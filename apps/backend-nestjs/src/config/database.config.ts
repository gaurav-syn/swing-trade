import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10) || 5432,
  name: process.env.DB_NAME || 'swingtrader',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production',
  poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
  poolMax: parseInt(process.env.DB_POOL_MAX || '10', 10),
}));
