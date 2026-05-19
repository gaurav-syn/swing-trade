import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ScannerService } from './scanner.service';

@ApiTags('scanner')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'scanner', version: '1' })
export class ScannerController {
  constructor(private scannerService: ScannerService) {}

  @Post('run')
  @ApiOperation({ summary: 'Trigger a new market scan' })
  runScan(
    @Request() req,
    @Body() body: { minScore?: number; maxStocks?: number },
  ) {
    return this.scannerService.runScan(req.user.id, body);
  }

  @Get('results/latest')
  @ApiOperation({ summary: 'Get latest completed scan results' })
  getLatest(@Request() req) {
    return this.scannerService.getLatestResults(req.user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get scanner run history' })
  getHistory(@Request() req) {
    return this.scannerService.getScanHistory(req.user.id);
  }

  @Get('run/:id')
  @ApiOperation({ summary: 'Get specific scanner run with results' })
  getRun(@Request() req, @Param('id') id: string) {
    return this.scannerService.getScannerRun(req.user.id, id);
  }

  @Get('chart/:symbol')
  @ApiOperation({ summary: 'Get OHLCV chart data for a symbol' })
  @ApiQuery({ name: 'period', enum: ['1mo', '3mo', '6mo', '1y'], required: false })
  getChartData(@Param('symbol') symbol: string, @Query('period') period = '3mo') {
    return this.scannerService.getChartData(symbol, period);
  }

  @Get('analyze/:symbol')
  @ApiOperation({ summary: 'Analyze a single stock on demand' })
  analyzeStock(@Param('symbol') symbol: string) {
    return this.scannerService.analyzeStock(`${symbol}.NS`);
  }
}
