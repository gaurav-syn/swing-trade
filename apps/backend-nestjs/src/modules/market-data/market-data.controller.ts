import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MarketDataService } from './market-data.service';

@ApiTags('market-data')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'market-data', version: '1' })
export class MarketDataController {
  constructor(private marketDataService: MarketDataService) {}

  @Get('indices')
  getIndices() { return this.marketDataService.getNiftyIndices(); }

  @Get('quote/:symbol')
  getQuote(@Param('symbol') symbol: string) { return this.marketDataService.getQuote(symbol); }

  @Get('search')
  search(@Query('q') q: string) { return this.marketDataService.searchSymbol(q); }

  @Get('quotes')
  getMultiple(@Query('symbols') symbols: string) {
    return this.marketDataService.getMultipleQuotes(symbols.split(','));
  }
}
