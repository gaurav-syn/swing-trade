# SwingTrader Pro — Indian Stock Market Platform

Production-grade swing trading platform for NSE/BSE built with NestJS, Next.js, PostgreSQL, and deployed on Azure.

## Quick Start (Local Dev)

```bash
# 1. Start database
docker-compose -f docker-compose.dev.yml up -d

# 2. Backend
cd apps/backend-nestjs
cp .env.example .env.local
# Edit: DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET
npm install
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
npm run dev       # http://localhost:3001

# 3. Frontend (new terminal)
cd apps/frontend-nextjs
cp .env.example .env.local
npm install
npm run dev       # http://localhost:3000
```

Demo: `demo@swingtrader.in` / `Demo@12345`

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, TradingView charts, React Query, Zustand |
| Backend | NestJS, TypeScript, Prisma ORM, JWT auth |
| Database | PostgreSQL 16 |
| Deployment | Azure App Service + Static Web Apps + PostgreSQL Flexible |
| CI/CD | GitHub Actions |

## Features

- **Scanner** — Multi-indicator NSE scanner (RSI, MACD, EMA, SuperTrend, ATR, Bollinger Bands)
- **Trade Management** — Open, monitor, exit with auto P&L calculation
- **Portfolio Dashboard** — Real-time capital, P&L, win rate, ROI
- **Analytics** — Equity curve, monthly performance, drawdown, strategy breakdown
- **Risk Management** — Daily loss limits, max exposure, position sizing
- **Watchlist** — Track stocks of interest

## Azure Cost

~₹1,900/month (well within ₹3,500 budget — ₹1,600 buffer)

| Resource | Cost |
|---|---|
| App Service B1 (Central India) | ~₹1,050 |
| PostgreSQL B1ms + Auto-pause | ~₹700 |
| Static Web Apps | ₹0 (free) |
| Monitoring + Storage | ~₹150 |

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
