import { Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const yahooFinance = require('yahoo-finance2').default ?? require('yahoo-finance2');

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);

  async getQuote(symbol: string) {
    try {
      const q = await yahooFinance.quote(`${symbol}.NS`);
      return {
        symbol,
        price: q.regularMarketPrice,
        change: q.regularMarketChange,
        changePercent: q.regularMarketChangePercent,
        volume: q.regularMarketVolume,
        high: q.regularMarketDayHigh,
        low: q.regularMarketDayLow,
        open: q.regularMarketOpen,
        prevClose: q.regularMarketPreviousClose,
        marketCap: q.marketCap,
        fiftyTwoWeekHigh: q.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: q.fiftyTwoWeekLow,
        name: q.longName ?? q.shortName,
      };
    } catch (err) {
      this.logger.warn(`Quote fetch failed for ${symbol}: ${err.message}`);
      return null;
    }
  }

  async getMultipleQuotes(symbols: string[]) {
    const results = await Promise.allSettled(
      symbols.map(s => this.getQuote(s)),
    );
    return results
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => (r as PromiseFulfilledResult<any>).value);
  }

  async getNiftyIndices() {
    try {
      const [nifty50, sensex, niftyBank, niftyIt] = await Promise.allSettled([
        yahooFinance.quote('^NSEI'),
        yahooFinance.quote('^BSESN'),
        yahooFinance.quote('^NSEBANK'),
        yahooFinance.quote('^CNXIT'),
      ]);

      return [
        { name: 'NIFTY 50', data: nifty50.status === 'fulfilled' ? nifty50.value : null },
        { name: 'SENSEX', data: sensex.status === 'fulfilled' ? sensex.value : null },
        { name: 'BANK NIFTY', data: niftyBank.status === 'fulfilled' ? niftyBank.value : null },
        { name: 'NIFTY IT', data: niftyIt.status === 'fulfilled' ? niftyIt.value : null },
      ].filter(i => i.data).map(i => ({
        name: i.name,
        price: i.data.regularMarketPrice,
        change: i.data.regularMarketChange,
        changePercent: i.data.regularMarketChangePercent,
      }));
    } catch {
      return [];
    }
  }

  async searchSymbol(query: string) {
    try {
      const results = await yahooFinance.search(query, { newsCount: 0 });
      return results.quotes
        ?.filter(q => q.exchange === 'NSI' || q.exchange === 'BSE')
        .map(q => ({
          symbol: q.symbol?.replace('.NS', '').replace('.BO', ''),
          name: q.longname ?? q.shortname,
          exchange: q.exchange,
        })) ?? [];
    } catch {
      return [];
    }
  }
}
