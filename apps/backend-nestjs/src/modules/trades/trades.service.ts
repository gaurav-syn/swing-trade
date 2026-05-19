import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { ExitTradeDto } from './dto/exit-trade.dto';
import Decimal from 'decimal.js';

// Indian brokerage & tax constants
const STT_RATE = 0.001;        // 0.1% on sell side
const SEBI_CHARGES = 0.000001; // ₹1 per lakh
const STAMP_DUTY = 0.00015;    // 0.015% on buy side
const EXCHANGE_TXNCHARGE = 0.0000335;
const GST_RATE = 0.18;
const BROKERAGE_CAP = 20;      // Zerodha flat ₹20 per order

@Injectable()
export class TradesService {
  private readonly logger = new Logger(TradesService.name);

  constructor(private prisma: PrismaService) {}

  // ─────────────────────────────────────────────
  // CREATE TRADE
  // ─────────────────────────────────────────────
  async create(userId: string, dto: CreateTradeDto) {
    const portfolio = await this.prisma.portfolio.findUnique({ where: { userId } });
    if (!portfolio) throw new NotFoundException('Portfolio not found');

    // Open trades check
    const openCount = await this.prisma.trade.count({
      where: { userId, status: 'OPEN' },
    });
    if (openCount >= Number(portfolio.maxOpenTrades)) {
      throw new BadRequestException(
        `Maximum open trades limit (${portfolio.maxOpenTrades}) reached`,
      );
    }

    const investedAmount = new Decimal(dto.entryPrice).mul(dto.entryQuantity);

    if (investedAmount.gt(portfolio.availableCapital)) {
      throw new BadRequestException('Insufficient available capital');
    }

    const brokerage = this.calculateBrokerage(dto.entryPrice, dto.entryQuantity);
    const riskReward = this.calculateRiskReward(dto.entryPrice, dto.stopLoss, dto.target1);

    const trade = await this.prisma.$transaction(async (tx) => {
      const newTrade = await tx.trade.create({
        data: {
          userId,
          symbol: dto.symbol.toUpperCase(),
          exchange: dto.exchange || 'NSE',
          tradeType: dto.tradeType || 'LONG',
          entryPrice: dto.entryPrice,
          entryQuantity: dto.entryQuantity,
          stopLoss: dto.stopLoss,
          target1: dto.target1,
          target2: dto.target2,
          entryNotes: dto.entryNotes,
          scannerRunId: dto.scannerRunId,
          confidenceScore: dto.confidenceScore,
          strategy: dto.strategy,
          tags: dto.tags || [],
          investedAmount: investedAmount.toNumber(),
          brokerage: brokerage,
          riskRewardRatio: riskReward,
          status: 'OPEN',
        },
      });

      // Deduct from available capital
      await tx.portfolio.update({
        where: { userId },
        data: {
          availableCapital: { decrement: investedAmount.toNumber() },
          totalInvested: { increment: investedAmount.toNumber() },
          totalTrades: { increment: 1 },
        },
      });

      await tx.tradeLog.create({
        data: {
          tradeId: newTrade.id,
          action: 'TRADE_OPENED',
          details: { entryPrice: dto.entryPrice, quantity: dto.entryQuantity },
          priceAt: dto.entryPrice,
        },
      });

      return newTrade;
    });

    return trade;
  }

  // ─────────────────────────────────────────────
  // EXIT TRADE
  // ─────────────────────────────────────────────
  async exit(userId: string, tradeId: string, dto: ExitTradeDto) {
    const trade = await this.prisma.trade.findFirst({
      where: { id: tradeId, userId, status: 'OPEN' },
    });
    if (!trade) throw new NotFoundException('Active trade not found');

    const exitQty = dto.exitQuantity || trade.entryQuantity;
    if (exitQty > trade.entryQuantity) {
      throw new BadRequestException('Exit quantity exceeds entry quantity');
    }

    const exitAmount = new Decimal(dto.exitPrice).mul(exitQty);
    const entryAmount = new Decimal(trade.entryPrice.toString()).mul(exitQty);

    const rawPnl =
      trade.tradeType === 'LONG'
        ? exitAmount.minus(entryAmount)
        : entryAmount.minus(exitAmount);

    const exitBrokerage = this.calculateBrokerage(dto.exitPrice, exitQty);
    const stt = exitAmount.mul(STT_RATE);
    const totalCharges = new Decimal(exitBrokerage).plus(stt).plus(Number(trade.brokerage));
    const netPnl = rawPnl.minus(totalCharges);
    const pnlPercent = rawPnl.div(entryAmount).mul(100);

    const entryDate = new Date(trade.entryDate);
    const exitDate = new Date();
    const holdingDays = Math.ceil(
      (exitDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    const updatedTrade = await this.prisma.$transaction(async (tx) => {
      const closed = await tx.trade.update({
        where: { id: tradeId },
        data: {
          exitPrice: dto.exitPrice,
          exitQuantity: exitQty,
          exitDate,
          exitNotes: dto.exitNotes,
          status: 'CLOSED',
          realizedPnl: rawPnl.toNumber(),
          realizedPnlPercent: pnlPercent.toNumber(),
          netPnl: netPnl.toNumber(),
          taxes: stt.toNumber(),
          holdingDays,
        },
      });

      // Update portfolio
      const isWin = netPnl.gte(0);
      await tx.portfolio.update({
        where: { userId },
        data: {
          availableCapital: { increment: exitAmount.toNumber() },
          totalInvested: { decrement: entryAmount.toNumber() },
          totalRealizedPnl: { increment: netPnl.toNumber() },
          totalBrokerage: { increment: totalCharges.toNumber() },
          totalTaxes: { increment: stt.toNumber() },
          winningTrades: isWin ? { increment: 1 } : undefined,
          losingTrades: !isWin ? { increment: 1 } : undefined,
          currentCapital: { increment: netPnl.toNumber() },
        },
      });

      await tx.tradeLog.create({
        data: {
          tradeId,
          action: 'TRADE_CLOSED',
          details: {
            exitPrice: dto.exitPrice,
            quantity: exitQty,
            pnl: rawPnl.toNumber(),
            netPnl: netPnl.toNumber(),
          },
          priceAt: dto.exitPrice,
        },
      });

      return closed;
    });

    return {
      trade: updatedTrade,
      summary: {
        rawPnl: rawPnl.toNumber(),
        totalCharges: totalCharges.toNumber(),
        netPnl: netPnl.toNumber(),
        pnlPercent: pnlPercent.toNumber(),
        holdingDays,
        isWin: netPnl.gte(0),
      },
    };
  }

  // ─────────────────────────────────────────────
  // GET ACTIVE TRADES
  // ─────────────────────────────────────────────
  async getActiveTrades(userId: string) {
    const trades = await this.prisma.trade.findMany({
      where: { userId, status: 'OPEN' },
      orderBy: { entryDate: 'desc' },
    });
    return trades;
  }

  // ─────────────────────────────────────────────
  // GET TRADE HISTORY
  // ─────────────────────────────────────────────
  async getTradeHistory(
    userId: string,
    filters: {
      page?: number;
      limit?: number;
      symbol?: string;
      fromDate?: string;
      toDate?: string;
      status?: string;
    } = {},
  ) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = { userId, status: 'CLOSED' };
    if (filters.symbol) where.symbol = filters.symbol.toUpperCase();
    if (filters.fromDate) where.exitDate = { ...where.exitDate, gte: new Date(filters.fromDate) };
    if (filters.toDate) where.exitDate = { ...where.exitDate, lte: new Date(filters.toDate) };

    const [trades, total] = await Promise.all([
      this.prisma.trade.findMany({
        where,
        orderBy: { exitDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.trade.count({ where }),
    ]);

    return {
      trades,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─────────────────────────────────────────────
  // GET SINGLE TRADE
  // ─────────────────────────────────────────────
  async getTrade(userId: string, tradeId: string) {
    const trade = await this.prisma.trade.findFirst({
      where: { id: tradeId, userId },
      include: { logs: { orderBy: { createdAt: 'asc' } } },
    });
    if (!trade) throw new NotFoundException('Trade not found');
    return trade;
  }

  // ─────────────────────────────────────────────
  // CANCEL TRADE
  // ─────────────────────────────────────────────
  async cancelTrade(userId: string, tradeId: string) {
    const trade = await this.prisma.trade.findFirst({
      where: { id: tradeId, userId, status: 'OPEN' },
    });
    if (!trade) throw new NotFoundException('Active trade not found');

    return this.prisma.$transaction(async (tx) => {
      const cancelled = await tx.trade.update({
        where: { id: tradeId },
        data: { status: 'CANCELLED' },
      });

      await tx.portfolio.update({
        where: { userId },
        data: {
          availableCapital: { increment: trade.investedAmount },
          totalInvested: { decrement: trade.investedAmount },
        },
      });

      await tx.tradeLog.create({
        data: {
          tradeId,
          action: 'TRADE_CANCELLED',
          details: { reason: 'Manual cancellation' },
        },
      });

      return cancelled;
    });
  }

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────
  private calculateBrokerage(price: number, qty: number): number {
    const tradeValue = price * qty;
    const brokerage = Math.min(tradeValue * 0.0003, BROKERAGE_CAP);
    const exchange = tradeValue * EXCHANGE_TXNCHARGE;
    const gst = (brokerage + exchange) * GST_RATE;
    const stampDuty = tradeValue * STAMP_DUTY;
    return Number((brokerage + exchange + gst + stampDuty).toFixed(2));
  }

  private calculateRiskReward(
    entry: number,
    stopLoss?: number,
    target?: number,
  ): number | null {
    if (!stopLoss || !target) return null;
    const risk = Math.abs(entry - stopLoss);
    const reward = Math.abs(target - entry);
    if (risk === 0) return null;
    return Number((reward / risk).toFixed(2));
  }
}
