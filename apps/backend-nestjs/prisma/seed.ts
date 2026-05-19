import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Demo user
  const passwordHash = await bcrypt.hash('Demo@12345', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@swingtrader.in' },
    update: {},
    create: {
      email: 'demo@swingtrader.in',
      passwordHash,
      firstName: 'Demo',
      lastName: 'Trader',
      isEmailVerified: true,
      portfolio: {
        create: {
          initialCapital: 500000,
          currentCapital: 500000,
          availableCapital: 500000,
          peakCapital: 500000,
          riskPerTrade: 2,
          maxOpenTrades: 5,
          maxPortfolioRisk: 10,
          dailyLossLimit: 3,
        },
      },
      watchlists: {
        create: {
          name: 'My Watchlist',
          isDefault: true,
          items: {
            create: [
              { symbol: 'RELIANCE', companyName: 'Reliance Industries' },
              { symbol: 'TCS', companyName: 'Tata Consultancy Services' },
              { symbol: 'INFY', companyName: 'Infosys' },
              { symbol: 'HDFCBANK', companyName: 'HDFC Bank' },
              { symbol: 'ICICIBANK', companyName: 'ICICI Bank' },
            ],
          },
        },
      },
    },
  });

  console.log(`✅ Demo user: demo@swingtrader.in / Demo@12345`);
  console.log(`   User ID: ${user.id}`);
  console.log('✅ Seeding complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
