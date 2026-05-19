# SwingTrader Platform — Deployment Guide

## Prerequisites

- Node.js 20+
- Docker Desktop
- Azure CLI (`az`)
- GitHub repository

---

## Local Development (Quick Start)

### 1. Start PostgreSQL
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 2. Backend setup
```bash
cd apps/backend-nestjs
cp .env.example .env.local
# Edit .env.local — set DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET
npm install
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
npm run dev
# Backend: http://localhost:3001
# Swagger: http://localhost:3001/api/docs
```

### 3. Frontend setup
```bash
cd apps/frontend-nextjs
cp .env.example .env.local
# Edit: NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
npm install
npm run dev
# Frontend: http://localhost:3000
```

### Demo login
- Email: `demo@swingtrader.in`
- Password: `Demo@12345`

---

## Docker (Full Stack)

```bash
# Copy and configure env
cp .env.example .env

# Build and start
docker-compose up -d --build

# Run migrations
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx ts-node prisma/seed.ts
```

---

## Azure Deployment

### STEP 1 — Login to Azure (REQUIRES YOUR PERMISSION)

```bash
az login
az account set --subscription "YOUR_SUBSCRIPTION_ID"
```

> **Prompt user here** — requires Azure Contributor access

### STEP 2 — Create Service Principal (for GitHub Actions)

```bash
az ad sp create-for-rbac \
  --name "swingtrader-cicd" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/swingtrader-rg \
  --sdk-auth
```

Copy the JSON output → GitHub Secret: `AZURE_CREDENTIALS`

### STEP 3 — Run deployment script

```bash
chmod +x infra/azure/deploy.sh
./infra/azure/deploy.sh
```

### STEP 4 — Add GitHub Secrets

| Secret | Value |
|---|---|
| `AZURE_CREDENTIALS` | Service Principal JSON |
| `AZURE_BACKEND_APP_NAME` | `swingtrader-prod-backend` |
| `AZURE_STATIC_WEB_APPS_TOKEN` | From Azure portal → Static Web App → Manage token |
| `DATABASE_URL` | PostgreSQL connection string from deploy output |
| `BACKEND_URL` | Azure App Service URL |

### STEP 5 — Push to deploy

```bash
git push origin main
```

GitHub Actions will:
1. Lint & type-check
2. Build backend + frontend
3. Run DB migrations
4. Deploy backend → Azure App Service
5. Deploy frontend → Azure Static Web Apps

---

## Azure Cost Estimate (Monthly)

Budget: **₹3,500/month**

| Resource | SKU | Est. Cost | Key Optimization |
|---|---|---|---|
| App Service B1 | Linux, Central India | ~₹1,050 | Central India region = lower INR pricing |
| PostgreSQL Flexible | B1ms + **Auto-pause** | ~₹700 | Pauses after 60min idle — saves ~60% |
| Static Web Apps | **Free tier** | ₹0 | 100GB bandwidth/month included |
| Application Insights | Capped 1GB/day | ~₹100 | Daily quota cap prevents overrun |
| Storage | Standard_LRS Cool | ~₹50 | Minimal usage + cool tier |
| **Total** | | **~₹1,900** | **₹1,600 buffer remaining ✓** |

> **PostgreSQL Auto-pause:** Server stops after 60 min of idle. Only storage (~₹100/mo) billed while paused.
> Restarts on first connection (~30s). For a trading app used 9 AM–4 PM IST, this is fine.

> **Budget alerts:** Configured at 80% (₹2,800) and 100% (₹3,500) — email warning before hitting limit.

---

## Phase 2 — Python Analysis Engine

When ready, add to `apps/python-analysis-engine/`:

```bash
cd apps/python-analysis-engine
pip install fastapi uvicorn pandas numpy ta-lib scikit-learn vectorbt
uvicorn main:app --reload --port 8000
```

Backend will call `PYTHON_ENGINE_URL=http://localhost:8000` for:
- `/scan-market` — Advanced AI scanning
- `/backtest-strategy` — Historical backtesting
- `/predict-trend` — ML-based predictions

---

## Phase 3 — Zerodha Integration

Add to `.env`:
```
ZERODHA_API_KEY=your_key
ZERODHA_API_SECRET=your_secret
```

Implement `apps/backend-nestjs/src/modules/broker/zerodha.service.ts`
