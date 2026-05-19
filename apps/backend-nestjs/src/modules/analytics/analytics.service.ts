import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getFullAnalytics(userId: string) {
    const [closed, portfolio] = await Promise.all([
      this.prisma.trade.findMany({
        where: { userId, status: 'CLOSED' },
        orderBy: { exitDate: 'asc' },
        select: {
          id: true, symbol: true, entryPrice: true, exitPrice: true,
          entryDate: true, exitDate: true, netPnl: true,
          realizedPnlPercent: true, holdingDays: true, strategy: true,
          investedAmount: true, entryQuantity: true,
        },
      }),
      this.prisma.portfolio.findUnique({ where: { userId } }),
    ]);

    if (!closed.length) {
      return { message: 'No closed trades yet', trades: [], metrics: null };
    }

    const metrics = this.calculateMetrics(closed, portfolio);
    const equityCurve = this.buildEquityCurve(closed, Number(portfolio.initialCapital));
    const monthlyPerf = this.monthlyPerformance(closed);
    const strategyBreakdown = this.byStrategy(closed);
    const symbolBreakdown = this.bySymbol(closed);
    const drawdown = this.maxDrawdownSeries(equityCurve);

    return { metrics, equityCurve, monthlyPerf, strategyBreakdown, symbolBreakdown, drawdown };
  }

  async getWinLossAnalysis(userId: string) {
    const trades = await this.prisma.trade.findMany({
      where: { userId, status: 'CLOSED' },
      select: { netPnl: true, realizedPnlPercent: true, holdingDays: true, symbol: true },
    });

    const wins = trades.filter(t => Number(t.netPnl) >= 0);
    const losses = trades.filter(t => Number(t.netPnl) < 0);

    const avgWin = wins.length
      ? wins.reduce((s, t) => s + Number(t.netPnl), 0) / wins.length
      : 0;
    const avgLoss = losses.length
      ? losses.reduce((s, t) => s + Number(t.netPnl), 0) / losses.length
      : 0;
    const profitFactor = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;
    const expectancy = trades.length
      ? trades.reduce((s, t) => s + Number(t.netPnl), 0) / trades.length
      : 0;

    return {
      totalTrades: trades.length,
      wins: wins.length,
      losses: losses.length,
      winRate: trades.length ? (wins.length / trades.length) * 100 : 0,
      avgWin,
      avgLoss,
      profitFactor: Math.round(profitFactor * 100) / 100,
      expectancy: Math.round(expectancy * 100) / 100,
      bestTrade: wins.sort((a, b) => Number(b.netPnl) - Number(a.netPnl))[0] ?? null,
      worstTrade: losses.sort((a, b) => Number(a.netPnl) - Number(b.netPnl))[0] ?? null,
    };
  }

  async exportTrades(userId: string) {
    const trades = await this.prisma.trade.findMany({
      where: { userId },
      orderBy: { entryDate: 'desc' },
    });

    const headers = [
      'Symbol', 'Exchange', 'Type', 'Status', 'Entry Price', 'Exit Price',
      'Quantity', 'Entry Date', 'Exit Date', 'Invested Amount',
      'Realized P&L', 'P&L %', 'Net P&L', 'Brokerage', 'Taxes',
      'Holding Days', 'Strategy', 'Stop Loss', 'Target 1',
    ];

    const rows = trades.map(t => [
      t.symbol, t.exchange, t.tradeType, t.status,
      t.entryPrice, t.exitPrice ?? '', t.entryQuantity,
      t.entryDate.toISOString().split('T')[0],
      t.exitDate?.toISOString().split('T')[0] ?? '',
      t.investedAmount, t.realizedPnl ?? '', t.realizedPnlPercent ?? '',
      t.netPnl ?? '', t.brokerage, t.taxes,
      t.holdingDays ?? '', t.strategy ?? '',
      t.stopLoss ?? '', t.target1 ?? '',
    ]);

    return {
      headers,
      rows,
      csv: [headers.join(','), ...rows.map(r => r.join(','))].join('\n'),
    };
  }

  // ─────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────
  private calculateMetrics(trades: any[], portfolio: any) {
    const total = trades.length;
    const wins = trades.filter(t => Number(t.netPnl) >= 0).length;
    const totalPnl = trades.reduce((s, t) => s + Number(t.netPnl ?? 0), 0);
    const avgHolding = trades.reduce((s, t) => s + (t.holdingDays ?? 0), 0) / total;
    const winPnls = trades.filter(t => Number(t.netPnl) >= 0).map(t => Number(t.netPnl));
    const lossPnls = trades.filter(t => Number(t.netPnl) < 0).map(t => Number(t.netPnl));
    const avgWin = winPnls.length ? winPnls.reduce((a, b) => a + b, 0) / winPnls.length : 0;
    const avgLoss = lossPnls.length ? lossPnls.reduce((a, b) => a + b, 0) / lossPnls.length : 0;
    const roi = Number(portfolio?.initialCapital) > 0
      ? (totalPnl / Number(portfolio.initialCapital)) * 100
      : 0;

    return {
      totalTrades: total,
      winRate: Math.round((wins / total) * 1000) / 10,
      totalPnl: Math.round(totalPnl * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      avgHoldingDays: Math.round(avgHolding * 10) / 10,
      avgWin: Math.round(avgWin * 100) / 100,
      avgLoss: Math.round(avgLoss * 100) / 100,
      profitFactor: avgLoss < 0 ? Math.round((Math.abs(avgWin) / Math.abs(avgLoss)) * 100) / 100 : 0,
    };
  }

  private buildEquityCurve(trades: any[], initialCapital: number) {
    let capital = initialCapital;
    return trades.map(t => {
      capital += Number(t.netPnl ?? 0);
      return {
        date: t.exitDate?.toISOString().split('T')[0],
        capital: Math.round(capital * 100) / 100,
        pnl: Number(t.netPnl ?? 0),
      };
    });
  }

  private monthlyPerformance(trades: any[]) {
    const map = new Map<string, { pnl: number; trades: number; wins: number }>();
    for (const t of trades) {
      if (!t.exitDate) continue;
      const key = t.exitDate.toISOString().slice(0, 7); // YYYY-MM
      const curr = map.get(key) ?? { pnl: 0, trades: 0, wins: 0 };
      curr.pnl += Number(t.netPnl ?? 0);
      curr.trades++;
      if (Number(t.netPnl) >= 0) curr.wins++;
      map.set(key, curr);
    }
    return Array.from(map.entries())
      .map(([month, data]) => ({
        month,
        pnl: Math.round(data.pnl * 100) / 100,
        trades: data.trades,
        winRate: Math.round((data.wins / data.trades) * 1000) / 10,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private byStrategy(trades: any[]) {
    const map = new Map<string, { pnl: number; trades: number; wins: number }>();
    for (const t of trades) {
      const key = t.strategy ?? 'Unknown';
      const curr = map.get(key) ?? { pnl: 0, trades: 0, wins: 0 };
      curr.pnl += Number(t.netPnl ?? 0);
      curr.trades++;
      if (Number(t.netPnl) >= 0) curr.wins++;
      map.set(key, curr);
    }
    return Array.from(map.entries()).map(([strategy, d]) => ({
      strategy,
      pnl: Math.round(d.pnl * 100) / 100,
      trades: d.trades,
      winRate: Math.round((d.wins / d.trades) * 1000) / 10,
    }));
  }

  private bySymbol(trades: any[]) {
    const map = new Map<string, { pnl: number; trades: number }>();
    for (const t of trades) {
      const curr = map.get(t.symbol) ?? { pnl: 0, trades: 0 };
      curr.pnl += Number(t.netPnl ?? 0);
      curr.trades++;
      map.set(t.symbol, curr);
    }
    return Array.from(map.entries())
      .map(([symbol, d]) => ({
        symbol,
        pnl: Math.round(d.pnl * 100) / 100,
        trades: d.trades,
      }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 10);
  }

  private maxDrawdownSeries(equityCurve: { capital: number; date: string }[]) {
    let peak = equityCurve[0]?.capital ?? 0;
    return equityCurve.map(point => {
      if (point.capital > peak) peak = point.capital;
      const drawdown = peak > 0 ? ((peak - point.capital) / peak) * 100 : 0;
      return { date: point.date, drawdown: Math.round(drawdown * 100) / 100 };
    });
  }
}
