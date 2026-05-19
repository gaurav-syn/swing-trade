import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class WatchlistService {
  constructor(private prisma: PrismaService) {}

  async getAll(userId: string) {
    return this.prisma.watchlist.findMany({
      where: { userId },
      include: { items: { orderBy: { addedAt: 'desc' } } },
    });
  }

  async create(userId: string, data: { name: string; description?: string }) {
    return this.prisma.watchlist.create({
      data: { userId, name: data.name, description: data.description },
    });
  }

  async addItem(
    userId: string,
    watchlistId: string,
    item: { symbol: string; companyName?: string; notes?: string },
  ) {
    const list = await this.prisma.watchlist.findFirst({ where: { id: watchlistId, userId } });
    if (!list) throw new NotFoundException('Watchlist not found');

    const exists = await this.prisma.watchlistItem.findUnique({
      where: { watchlistId_symbol: { watchlistId, symbol: item.symbol.toUpperCase() } },
    });
    if (exists) throw new ConflictException('Symbol already in watchlist');

    return this.prisma.watchlistItem.create({
      data: {
        watchlistId,
        symbol: item.symbol.toUpperCase(),
        companyName: item.companyName,
        notes: item.notes,
      },
    });
  }

  async removeItem(userId: string, watchlistId: string, symbol: string) {
    const list = await this.prisma.watchlist.findFirst({ where: { id: watchlistId, userId } });
    if (!list) throw new NotFoundException('Watchlist not found');

    return this.prisma.watchlistItem.deleteMany({
      where: { watchlistId, symbol: symbol.toUpperCase() },
    });
  }

  async delete(userId: string, watchlistId: string) {
    const list = await this.prisma.watchlist.findFirst({ where: { id: watchlistId, userId } });
    if (!list) throw new NotFoundException('Watchlist not found');
    return this.prisma.watchlist.delete({ where: { id: watchlistId } });
  }
}
