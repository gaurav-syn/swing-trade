import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PortfolioService } from './portfolio.service';

@ApiTags('portfolio')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'portfolio', version: '1' })
export class PortfolioController {
  constructor(private portfolioService: PortfolioService) {}

  @Get()
  @ApiOperation({ summary: 'Get portfolio overview' })
  getPortfolio(@Request() req) {
    return this.portfolioService.getPortfolio(req.user.id);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard summary data' })
  getDashboard(@Request() req) {
    return this.portfolioService.getDashboardSummary(req.user.id);
  }

  @Get('risk')
  @ApiOperation({ summary: 'Get current risk metrics' })
  getRisk(@Request() req) {
    return this.portfolioService.getRiskMetrics(req.user.id);
  }

  @Patch('capital')
  @ApiOperation({ summary: 'Update portfolio capital' })
  updateCapital(@Request() req, @Body() body: { capital: number }) {
    return this.portfolioService.updateCapital(req.user.id, body.capital);
  }
}
