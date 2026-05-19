import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');

    if (process.env.NODE_ENV === 'development') {
      (this as any).$on('query', (e: any) => {
        if (e.duration > 200) {
          this.logger.warn(`Slow query (${e.duration}ms): ${e.query}`);
        }
      });
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }
    const tableNames = [
      'audit_logs', 'alerts', 'trade_logs', 'trades',
      'scanner_results', 'scanner_runs', 'watchlist_items',
      'watchlists', 'market_data_cache', 'risk_metrics',
      'portfolio_analytics', 'portfolios', 'refresh_tokens', 'users',
    ];
    for (const table of tableNames) {
      await this.$executeRawUnsafe(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
    }
  }
}
