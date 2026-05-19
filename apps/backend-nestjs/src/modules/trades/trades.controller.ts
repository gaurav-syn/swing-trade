import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TradesService } from './trades.service';
import { CreateTradeDto } from './dto/create-trade.dto';
import { ExitTradeDto } from './dto/exit-trade.dto';

@ApiTags('trades')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'trades', version: '1' })
export class TradesController {
  constructor(private tradesService: TradesService) {}

  @Post()
  @ApiOperation({ summary: 'Create new trade' })
  create(@Request() req, @Body() dto: CreateTradeDto) {
    return this.tradesService.create(req.user.id, dto);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active (open) trades' })
  getActive(@Request() req) {
    return this.tradesService.getActiveTrades(req.user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get closed trade history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'symbol', required: false })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  getHistory(@Request() req, @Query() query) {
    return this.tradesService.getTradeHistory(req.user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get trade details' })
  getTrade(@Request() req, @Param('id') id: string) {
    return this.tradesService.getTrade(req.user.id, id);
  }

  @Post(':id/exit')
  @ApiOperation({ summary: 'Exit an active trade' })
  exit(@Request() req, @Param('id') id: string, @Body() dto: ExitTradeDto) {
    return this.tradesService.exit(req.user.id, id, dto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an active trade' })
  cancel(@Request() req, @Param('id') id: string) {
    return this.tradesService.cancelTrade(req.user.id, id);
  }
}
