import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WatchlistService } from './watchlist.service';

@ApiTags('watchlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'watchlists', version: '1' })
export class WatchlistController {
  constructor(private watchlistService: WatchlistService) {}

  @Get() getAll(@Request() req) { return this.watchlistService.getAll(req.user.id); }

  @Post() create(@Request() req, @Body() body: { name: string; description?: string }) {
    return this.watchlistService.create(req.user.id, body);
  }

  @Post(':id/items')
  addItem(@Request() req, @Param('id') id: string, @Body() body: { symbol: string; companyName?: string }) {
    return this.watchlistService.addItem(req.user.id, id, body);
  }

  @Delete(':id/items/:symbol')
  removeItem(@Request() req, @Param('id') id: string, @Param('symbol') symbol: string) {
    return this.watchlistService.removeItem(req.user.id, id, symbol);
  }

  @Delete(':id')
  delete(@Request() req, @Param('id') id: string) {
    return this.watchlistService.delete(req.user.id, id);
  }
}
