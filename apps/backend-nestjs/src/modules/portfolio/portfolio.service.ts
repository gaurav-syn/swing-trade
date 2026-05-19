import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PortfolioService {
  constructor(private prisma: PrismaService) {}

  async getPortfolio(userId: string) {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { userId },
    });
    if (!portfolio) throw new NotFoundException('Portfolio not found');

    const openTrades = await this.prisma.trade.findMany({
      where: { userId, status: 'OPEN' },
      select: { id: true, symbol: true, investedAmount: true, entryPrice: true, entryQuantity: true },
    });

    return { ...portfolio, openTrades, openTradesCount: openTrades.length };
  }

  async getDashboardSummary(userId: string) {
    const [portfolio, openTrades, todaysTrades, last30DaysClosed] = await Promise.all([
      this.prisma.portfolio.findUnique({ where: { userId } }),
      this.prisma.trade.findMany({ where: { userId, status: 'OPEN' } }),
      this.prisma.trade.findMany({
        where: {
          userId,
          status: 'CLOSED',
          exitDate: { gte: this.startOfDay() },
        },
        select: { netPnl: true, realizedPnlPercent: true },
      }),
      this.prisma.trade.findMany({
        where: {
          userId,
          status: 'CLOSED',
          exitDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        select: { netPnl: true, exitDate: true, realizedPnlPercent: true },
      }),
    ]);

    if (!portfolio) throw new NotFoundException('Portfolio not found');

    const todayPnl = todaysTrades.reduce((s, t) => s + Number(t.netPnl ?? 0), 0);
    const totalOpenInvested = openTrades.reduce((s, t) => s + Number(t.investedAmount), 0);
    const winRate = portfolio.totalTrades > 0
      ? (portfolio.winningTrades / portfolio.totalTrades) * 100
      : 0;
    const roi = Number(portfolio.initialCapital) > 0
      ? (Number(portfolio.totalRealizedPnl) / Number(portfolio.initialCapital)) * 100
      : 0;
    const capitalUtilization = Number(portfolio.currentCapital) > 0
      ? (totalOpenInvested / Number(portfolio.currentCapital)) * 100
      : 0;

    // Monthly P&L grouped by day
    const monthlyPnl = this.groupPnlByDay(last30DaysClosed);

    return {
      initialCapital: portfolio.initialCapital,
      currentCapital: portfolio.currentCapital,
      availableCapital: portfolio.availableCapital,
      totalRealizedPnl: portfolio.totalRealizedPnl,
      totalUnrealizedPnl: portfolio.totalUnrealizedPnl,
      totalBrokerage: portfolio.totalBrokerage,
      todayPnl,
      totalTrades: portfolio.totalTrades,
      winningTrades: portfolio.winningTrades,
      losingTrades: portfolio.losingTrades,
      openTradesCount: openTrades.length,
      winRate: Math.round(winRate * 10) / 10,
      roi: Math.round(roi * 100) / 100,
      capitalUtilization: Math.round(capitalUtilization * 10) / 10,
      maxDrawdown: portfolio.maxDrawdown,
      monthlyPnl,
    };
  }

  async updateCapital(userId: string, newCapital: number) {
    return this.prisma.portfolio.update({
      where: { userId },
      data: {
        initialCapital: newCapital,
        currentCapital: newCapital,
        availableCapital: newCapital,
        peakCapital: newCapital,
      },
    });
  }

  async getRiskMetrics(userId: string) {
    const portfolio = await this.prisma.portfolio.findUnique({ where: { userId } });
    if (!portfolio) throw new NotFoundException('Portfolio not found');

    const openTrades = await this.prisma.trade.findMany({
      where: { userId, status: 'OPEN' },
    });

    const currentExposure = openTrades.reduce((s, t) => s + Number(t.investedAmount), 0);
    const exposurePercent = Number(portfolio.currentCapital) > 0
      ? (currentExposure / Number(portfolio.currentCapital)) * 100
      : 0;

    const todayLoss = await this.prisma.trade.aggregate({
      where: { userId, status: 'CLOSED', exitDate: { gte: this.startOfDay() } },
      _sum: { netPnl: true },
    });
    const dailyLossToday = Number(todayLoss._sum.netPnl ?? 0);
    const dailyLossPercent = Number(portfolio.currentCapital) > 0
      ? (Math.abs(Math.min(dailyLossToday, 0)) / Number(portfolio.currentCapital)) * 100
      : 0;

    const isDailyLimitBreached = dailyLossPercent >= Number(portfolio.dailyLossLimit);

    return {
      currentExposure,
      exposurePercent: Math.round(exposurePercent * 10) / 10,
      openTradesCount: openTrades.length,
      maxOpenTrades: portfolio.maxOpenTrades,
      dailyLossToday,
      dailyLossPercent: Math.round(dailyLossPercent * 10) / 10,
      dailyLossLimit: portfolio.dailyLossLimit,
      isDailyLimitBreached,
      riskPerTrade: portfolio.riskPerTrade,
      maxPortfolioRisk: portfolio.maxPortfolioRisk,
      canOpenNewTrade: openTrades.length < portfolio.maxOpenTrades && !isDailyLimitBreached,
    };
  }

  private startOfDay(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private groupPnlByDay(trades: { netPnl: any; exitDate: Date }[]) {
    const map = new Map<string, number>();
    for (const t of trades) {
      const day = t.exitDate.toISOString().split('T')[0];
      map.set(day, (map.get(day) ?? 0) + Number(t.netPnl ?? 0));
    }
    return Array.from(map.entries())
      .map(([date, pnl]) => ({ date, pnl }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
