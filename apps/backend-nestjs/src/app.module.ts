import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { TradesModule } from './modules/trades/trades.module';
import { ScannerModule } from './modules/scanner/scanner.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { WatchlistModule } from './modules/watchlist/watchlist.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { MarketDataModule } from './modules/market-data/market-data.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10000, limit: 50 },
      { name: 'long', ttl: 60000, limit: 200 },
    ]),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    UsersModule,
    PortfolioModule,
    TradesModule,
    ScannerModule,
    AnalyticsModule,
    WatchlistModule,
    AlertsModule,
    MarketDataModule,
  ],
})
export class AppModule {}
