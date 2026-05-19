import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'analytics', version: '1' })
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get()
  @ApiOperation({ summary: 'Get full analytics report' })
  getAnalytics(@Request() req) {
    return this.analyticsService.getFullAnalytics(req.user.id);
  }

  @Get('win-loss')
  @ApiOperation({ summary: 'Win/Loss analysis' })
  getWinLoss(@Request() req) {
    return this.analyticsService.getWinLossAnalysis(req.user.id);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export trades as CSV data' })
  exportTrades(@Request() req) {
    return this.analyticsService.exportTrades(req.user.id);
  }
}
