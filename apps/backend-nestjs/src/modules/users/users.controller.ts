import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  getProfile(@Request() req) {
    return this.usersService.findById(req.user.id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  updateProfile(@Request() req, @Body() body: { firstName?: string; lastName?: string; avatarUrl?: string }) {
    return this.usersService.updateProfile(req.user.id, body);
  }

  @Patch('risk-settings')
  @ApiOperation({ summary: 'Update risk management settings' })
  updateRiskSettings(
    @Request() req,
    @Body() body: { riskPerTrade?: number; maxOpenTrades?: number; maxPortfolioRisk?: number; dailyLossLimit?: number },
  ) {
    return this.usersService.updateRiskSettings(req.user.id, body);
  }
}
