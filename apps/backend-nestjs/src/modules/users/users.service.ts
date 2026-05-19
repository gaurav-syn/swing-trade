import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, firstName: true,
        lastName: true, role: true, avatarUrl: true,
        isEmailVerified: true, createdAt: true, lastLoginAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; avatarUrl?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true, email: true, firstName: true,
        lastName: true, avatarUrl: true, updatedAt: true,
      },
    });
  }

  async updateRiskSettings(userId: string, settings: {
    riskPerTrade?: number;
    maxOpenTrades?: number;
    maxPortfolioRisk?: number;
    dailyLossLimit?: number;
  }) {
    const portfolio = await this.prisma.portfolio.findUnique({ where: { userId } });
    if (!portfolio) throw new NotFoundException('Portfolio not found');

    return this.prisma.portfolio.update({
      where: { userId },
      data: {
        riskPerTrade: settings.riskPerTrade,
        maxOpenTrades: settings.maxOpenTrades,
        maxPortfolioRisk: settings.maxPortfolioRisk,
        dailyLossLimit: settings.dailyLossLimit,
      },
    });
  }
}
