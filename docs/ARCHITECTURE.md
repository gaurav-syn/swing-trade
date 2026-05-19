# SwingTrader Platform — Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AZURE CLOUD (₹3,500/month)                    │
│                                                                   │
│  ┌──────────────────────┐    ┌────────────────────────────────┐  │
│  │  Azure Static Web    │    │   Azure App Service (B1)        │  │
│  │  Apps (FREE)         │───▶│   NestJS Backend               │  │
│  │  Next.js Frontend    │    │   Port 3001                     │  │
│  └──────────────────────┘    └──────────────┬─────────────────┘  │
│                                             │                     │
│                              ┌──────────────▼─────────────────┐  │
│                              │  Azure PostgreSQL Flexible      │  │
│                              │  (Burstable B1ms)               │  │
│                              │  16 tables, full indexing       │  │
│                              └─────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Application Insights — Monitoring & Performance         │    │
│  └──────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Modular Monolith Structure

```
swing-trader-platform/
├── apps/
│   ├── backend-nestjs/              ← NestJS API
│   │   └── src/modules/
│   │       ├── auth/                ← JWT + Refresh tokens
│   │       ├── users/               ← User management
│   │       ├── portfolio/           ← Dashboard, P&L, risk
│   │       ├── trades/              ← CRUD + exit + cancel
│   │       ├── scanner/             ← Market scan engine
│   │       │   └── engines/
│   │       │       ├── indicators.engine.ts  ← RSI,MACD,EMA,ATR...
│   │       │       ├── scoring.engine.ts     ← Confidence scoring
│   │       │       └── trade-setup.engine.ts ← Entry/SL/Target
│   │       ├── analytics/           ← Charts, equity curve
│   │       ├── market-data/         ← Yahoo Finance wrapper
│   │       └── watchlist/           ← Symbol watchlists
│   │
│   └── frontend-nextjs/             ← Next.js 14 App Router
│       └── src/
│           ├── app/
│           │   ├── (auth)/          ← Login, Register
│           │   └── (dashboard)/     ← All protected pages
│           ├── components/          ← Reusable UI components
│           ├── store/               ← Zustand state
│           └── lib/                 ← API client, utils
│
├── database/prisma/schema.prisma    ← 16-table PostgreSQL schema
├── infra/azure/main.bicep           ← IaC — all Azure resources
├── .github/workflows/deploy.yml     ← CI/CD pipeline
└── docker-compose.yml               ← Full stack Docker
```

## Scanner Algorithm

```
Market Data (Yahoo Finance)
        │
        ▼
   OHLCV Data (8 months daily)
        │
        ├─── RSI (14 period)
        ├─── MACD (12,26,9)
        ├─── EMA (20, 50, 200)
        ├─── SuperTrend (10,3)
        ├─── ATR (14 period)
        ├─── Bollinger Bands (20,2)
        ├─── ADX (14 period)
        ├─── Stochastic (14,3)
        └─── Volume Ratio (20-day avg)
                │
                ▼
      Composite Scoring (0-100)
      ┌─────────────────────────┐
      │ Trend Score    (max 30) │
      │ Momentum Score (max 30) │
      │ Volume Score   (max 20) │
      │ Pattern Score  (max 20) │
      └─────────────────────────┘
                │
        Score >= 55 threshold
                │
                ▼
      Trade Setup (ATR-based)
      ├── Entry: Current breakout level
      ├── Stop Loss: 1.5× ATR below entry
      ├── Target 1: 2:1 R:R minimum
      └── Target 2: 3:1 R:R
```

## Trade Lifecycle

```
Scanner Result
    │ User clicks "Take Trade"
    ▼
Trade Created (status: OPEN)
    │ Capital deducted from portfolio
    │ Brokerage estimated
    ▼
Active Trade
    │ Live P&L updates (from market data)
    │ Stop loss / Target alerts
    ▼
User clicks "Exit"
    │ Enters exit price + quantity
    ▼
P&L Calculated
    │ Gross P&L = (exit - entry) × qty
    │ Brokerage = min(0.03% × value, ₹20)
    │ STT = 0.1% on sell value
    │ Net P&L = Gross - Charges
    ▼
Trade Closed (status: CLOSED)
    │ Capital returned + P&L
    │ Portfolio metrics updated
    │ Win/Loss counters updated
    ▼
Trade History + Analytics
```

## API Endpoints

| Module | Endpoints |
|---|---|
| Auth | POST /auth/register, /login, /refresh, /logout · GET /auth/me |
| Portfolio | GET /portfolio, /dashboard, /risk · PATCH /capital |
| Trades | POST / · GET /active, /history, /:id · POST /:id/exit · PATCH /:id/cancel |
| Scanner | POST /scanner/run · GET /results/latest, /history, /run/:id, /chart/:sym |
| Analytics | GET /analytics, /win-loss, /export |
| Market Data | GET /market-data/indices, /quote/:sym, /search, /quotes |
| Watchlist | GET/POST /watchlists · POST/DELETE /watchlists/:id/items/:sym |

## Security

- JWT access tokens (15 min expiry)
- Refresh token rotation (7 days, single-use)
- bcrypt password hashing (12 rounds)
- Helmet.js HTTP security headers
- Rate limiting (10/s, 50/10s, 200/min per IP)
- Input validation with class-validator
- SQL injection prevention via Prisma ORM
- CORS whitelist

## Future Phases

### Phase 2 — Python Analysis Engine
- FastAPI service at `apps/python-analysis-engine/`
- Advanced ML predictions (scikit-learn)
- Vectorbt backtesting
- Advanced ta-lib indicators

### Phase 3 — Broker Integration
- Zerodha Kite Connect
- Angel One SmartAPI
- Upstox API v2
- Real-time WebSocket price feeds
- Automated order placement
