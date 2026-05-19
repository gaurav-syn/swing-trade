import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import yahooFinance from 'yahoo-finance2';
import { PrismaService } from '../../database/prisma.service';
import { IndicatorsEngine, OHLCV } from './engines/indicators.engine';
import { ScoringEngine } from './engines/scoring.engine';
import { TradeSetupEngine } from './engines/trade-setup.engine';
import { NSE_STOCKS, getStockName, getStockSector } from './data/nse-stocks.data';

@Injectable()
export class ScannerService {
  private readonly logger = new Logger(ScannerService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  // ─────────────────────────────────────────────
  // RUN FULL MARKET SCAN
  // ─────────────────────────────────────────────
  async runScan(userId: string, options: { minScore?: number; maxStocks?: number } = {}) {
    const minScore = options.minScore ?? 55;
    const maxStocks = Math.min(options.maxStocks ?? 50, 100);

    const scannerRun = await this.prisma.scannerRun.create({
      data: { userId, status: 'RUNNING', parameters: { minScore, maxStocks } },
    });

    this.logger.log(`Scanner run ${scannerRun.id} started for user ${userId}`);

    // Run async — don't block the response
    this.processScan(scannerRun.id, userId, minScore, maxStocks).catch((err) => {
      this.logger.error(`Scanner run ${scannerRun.id} failed: ${err.message}`);
      this.prisma.scannerRun.update({
        where: { id: scannerRun.id },
        data: { status: 'FAILED', errorMessage: err.message, completedAt: new Date() },
      });
    });

    return { scannerRunId: scannerRun.id, status: 'RUNNING', message: 'Scan started' };
  }

  private async processScan(
    scannerRunId: string,
    userId: string,
    minScore: number,
    maxStocks: number,
  ) {
    const stocksToScan = NSE_STOCKS.slice(0, maxStocks);
    let scanned = 0;
    let found = 0;

    // Batch processing with concurrency control
    const BATCH_SIZE = 5;
    for (let i = 0; i < stocksToScan.length; i += BATCH_SIZE) {
      const batch = stocksToScan.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(stock => this.analyzeStock(stock.symbol, stock.name, stock.sector)),
      );

      for (const result of results) {
        scanned++;
        if (result.status === 'fulfilled' && result.value) {
          const analysis = result.value;
          if (analysis.score.confidenceScore >= minScore) {
            await this.prisma.scannerResult.create({
              data: {
                scannerRunId,
                symbol: analysis.symbol.replace('.NS', '').replace('.BO', ''),
                exchange: 'NSE',
                companyName: analysis.name,
                sector: analysis.sector,
                currentPrice: analysis.currentPrice,
                dayChangePercent: analysis.dayChangePercent,
                volume: BigInt(Math.round(analysis.volume)),
                avgVolume: BigInt(Math.round(analysis.avgVolume)),
                volumeRatio: analysis.indicators.volumeRatio,
                suggestedEntry: analysis.setup.suggestedEntry,
                stopLoss: analysis.setup.stopLoss,
                target1: analysis.setup.target1,
                target2: analysis.setup.target2,
                riskRewardRatio: analysis.setup.riskRewardRatio,
                suggestedHoldDays: analysis.setup.suggestedHoldDays,
                confidenceScore: analysis.score.confidenceScore,
                signalStrength: analysis.score.signalStrength as any,
                trendScore: analysis.score.trendScore,
                momentumScore: analysis.score.momentumScore,
                volumeScore: analysis.score.volumeScore,
                patternScore: analysis.score.patternScore,
                rsi: analysis.indicators.rsi,
                macd: analysis.indicators.macd?.macd,
                macdSignal: analysis.indicators.macd?.signal,
                ema20: analysis.indicators.ema20,
                ema50: analysis.indicators.ema50,
                ema200: analysis.indicators.ema200,
                atr: analysis.indicators.atr,
                superTrend: analysis.indicators.superTrend?.value,
                superTrendDir: analysis.indicators.superTrend?.direction,
                bbUpper: analysis.indicators.bollingerBands?.upper,
                bbLower: analysis.indicators.bollingerBands?.lower,
                bbMiddle: analysis.indicators.bollingerBands?.middle,
                patterns: analysis.patterns,
                strategy: analysis.score.strategy,
                reasoning: analysis.score.reasoning.join('; '),
              },
            });
            found++;
          }
        }
      }

      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < stocksToScan.length) {
        await this.sleep(500);
      }
    }

    await this.prisma.scannerRun.update({
      where: { id: scannerRunId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        totalScanned: scanned,
        opportunitiesFound: found,
      },
    });

    this.logger.log(`Scanner run ${scannerRunId} completed: ${scanned} scanned, ${found} opportunities`);
  }

  // ─────────────────────────────────────────────
  // ANALYZE SINGLE STOCK
  // ─────────────────────────────────────────────
  async analyzeStock(symbol: string, name?: string, sector?: string) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 8); // 8 months of data

      const [chart, quote] = await Promise.all([
        yahooFinance.chart(symbol, {
          period1: startDate,
          period2: endDate,
          interval: '1d',
        }),
        yahooFinance.quote(symbol),
      ]);

      if (!chart?.quotes || chart.quotes.length < 30) return null;

      const candles: OHLCV[] = chart.quotes
        .filter(q => q.open && q.high && q.low && q.close && q.volume)
        .map(q => ({
          open: q.open,
          high: q.high,
          low: q.low,
          close: q.adjclose ?? q.close,
          volume: q.volume,
          date: new Date(q.date),
        }));

      if (candles.length < 30) return null;

      const indicators = IndicatorsEngine.compute(candles);
      const patterns = IndicatorsEngine.detectPatterns(candles);
      const score = ScoringEngine.score(indicators, patterns, candles);
      const setup = TradeSetupEngine.calculate(candles, indicators, score.direction);

      const avgVolume = candles.slice(-20).reduce((s, c) => s + c.volume, 0) / 20;
      const lastCandle = candles[candles.length - 1];
      const prevCandle = candles[candles.length - 2];
      const dayChangePercent = prevCandle
        ? ((lastCandle.close - prevCandle.close) / prevCandle.close) * 100
        : 0;

      return {
        symbol,
        name: name ?? getStockName(symbol),
        sector: sector ?? getStockSector(symbol),
        currentPrice: lastCandle.close,
        dayChangePercent,
        volume: lastCandle.volume,
        avgVolume,
        indicators,
        patterns,
        score,
        setup,
        candles: candles.slice(-50), // Last 50 candles for charting
      };
    } catch (err) {
      this.logger.warn(`Failed to analyze ${symbol}: ${err.message}`);
      return null;
    }
  }

  // ─────────────────────────────────────────────
  // GET SCANNER RUN STATUS + RESULTS
  // ─────────────────────────────────────────────
  async getScannerRun(userId: string, scannerRunId: string) {
    const run = await this.prisma.scannerRun.findFirst({
      where: { id: scannerRunId, userId },
      include: {
        results: {
          orderBy: { confidenceScore: 'desc' },
          take: 50,
        },
      },
    });
    if (!run) throw new NotFoundException('Scanner run not found');
    return run;
  }

  async getLatestResults(userId: string) {
    const latestRun = await this.prisma.scannerRun.findFirst({
      where: { userId, status: 'COMPLETED' },
      orderBy: { completedAt: 'desc' },
      include: {
        results: {
          orderBy: { confidenceScore: 'desc' },
          take: 30,
        },
      },
    });
    return latestRun;
  }

  async getScanHistory(userId: string) {
    return this.prisma.scannerRun.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        status: true,
        startedAt: true,
        completedAt: true,
        totalScanned: true,
        opportunitiesFound: true,
      },
    });
  }

  // ─────────────────────────────────────────────
  // GET CHART DATA FOR A SYMBOL
  // ─────────────────────────────────────────────
  async getChartData(symbol: string, period = '3mo') {
    const endDate = new Date();
    const startDate = new Date();
    const months = period === '1mo' ? 1 : period === '3mo' ? 3 : period === '6mo' ? 6 : 12;
    startDate.setMonth(startDate.getMonth() - months);

    const chart = await yahooFinance.chart(`${symbol}.NS`, {
      period1: startDate,
      period2: endDate,
      interval: '1d',
    });

    return chart?.quotes?.map(q => ({
      time: Math.floor(new Date(q.date).getTime() / 1000),
      open: q.open,
      high: q.high,
      low: q.low,
      close: q.adjclose ?? q.close,
      volume: q.volume,
    })) ?? [];
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
