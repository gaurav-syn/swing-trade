import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3001,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  apiPrefix: process.env.API_PREFIX || 'api',
  brokerage: {
    zerodha: parseFloat(process.env.ZERODHA_BROKERAGE || '0.03'),
    defaultRate: parseFloat(process.env.DEFAULT_BROKERAGE_RATE || '0.03'),
  },
  taxes: {
    stt: parseFloat(process.env.STT_RATE || '0.1'),
    gst: parseFloat(process.env.GST_RATE || '18'),
    stampDuty: parseFloat(process.env.STAMP_DUTY_RATE || '0.015'),
    sebiCharges: parseFloat(process.env.SEBI_CHARGES || '0.0001'),
  },
  cache: {
    marketDataTtl: parseInt(process.env.MARKET_DATA_TTL || '300', 10),
    scannerTtl: parseInt(process.env.SCANNER_TTL || '900', 10),
  },
  scanner: {
    maxStocksPerScan: parseInt(process.env.MAX_STOCKS_PER_SCAN || '200', 10),
    defaultNifty500: process.env.USE_NIFTY500 === 'true',
  },
}));
