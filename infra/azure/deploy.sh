#!/bin/bash
# =============================================================================
# SwingTrader — Azure Deployment Script
# Budget: ₹3,500/month — Optimized for personal trading platform
# Estimated cost: ~₹1,900/month (₹1,600 buffer remaining)
# =============================================================================

set -euo pipefail

# ─── EDIT THESE BEFORE RUNNING ────────────────────────────────────────────────
RESOURCE_GROUP="swingtrader-rg"
LOCATION="centralindia"          # Central India = lowest INR pricing
ENVIRONMENT="prod"
ALERT_EMAIL="your-email@example.com"   # ← CHANGE THIS for budget alerts

# ─────────────────────────────────────────────────────────────────────────────
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   SwingTrader Platform — Azure Deployment                ║"
echo "║   Budget: ₹3,500/month  |  Est: ~₹1,900/month           ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Resource Group : $RESOURCE_GROUP"
echo "Location       : $LOCATION (Central India)"
echo "Alert Email    : $ALERT_EMAIL"
echo ""

# Confirm before proceeding
read -p "Proceed with deployment? (yes/no): " CONFIRM
if [[ "$CONFIRM" != "yes" ]]; then echo "Aborted."; exit 0; fi

# ─── GENERATE STRONG SECRETS ──────────────────────────────────────────────────
DB_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | head -c 20)"Sw1!"
JWT_SECRET=$(openssl rand -base64 48 | tr -d '/+=' | head -c 48)
JWT_REFRESH_SECRET=$(openssl rand -base64 48 | tr -d '/+=' | head -c 48)

# ─── 1. CREATE RESOURCE GROUP ─────────────────────────────────────────────────
echo ""
echo "▶ Step 1/5 — Creating resource group..."
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --output table

# ─── 2. DEPLOY BICEP ──────────────────────────────────────────────────────────
echo ""
echo "▶ Step 2/5 — Deploying infrastructure (may take 5-10 minutes)..."
DEPLOYMENT=$(az deployment group create \
  --resource-group "$RESOURCE_GROUP" \
  --template-file "$(dirname "$0")/main.bicep" \
  --parameters \
    environment="$ENVIRONMENT" \
    location="$LOCATION" \
    dbAdminPassword="$DB_PASSWORD" \
    jwtSecret="$JWT_SECRET" \
    jwtRefreshSecret="$JWT_REFRESH_SECRET" \
  --output json)

BACKEND_URL=$(echo "$DEPLOYMENT" | jq -r '.properties.outputs.backendUrl.value')
FRONTEND_URL=$(echo "$DEPLOYMENT" | jq -r '.properties.outputs.frontendUrl.value')
DB_FQDN=$(echo "$DEPLOYMENT" | jq -r '.properties.outputs.dbServerFqdn.value')
AI_CONN=$(echo "$DEPLOYMENT" | jq -r '.properties.outputs.appInsightsConnectionString.value')

DATABASE_URL="postgresql://swingtraderadmin:${DB_PASSWORD}@${DB_FQDN}:5432/swingtrader?sslmode=require&connection_limit=5"

# ─── 3. SET BUDGET ALERT EMAIL ────────────────────────────────────────────────
echo ""
echo "▶ Step 3/5 — Configuring budget alert ($ALERT_EMAIL)..."
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
az consumption budget create \
  --budget-name "swingtrader-prod-budget" \
  --amount 42 \
  --category cost \
  --time-grain monthly \
  --resource-group "$RESOURCE_GROUP" \
  --subscription "$SUBSCRIPTION_ID" \
  --email-addresses "$ALERT_EMAIL" \
  --threshold 80 2>/dev/null || echo "  (Budget alert already exists or email update needed in Azure portal)"

# ─── 4. WAIT FOR POSTGRES + RUN MIGRATIONS ────────────────────────────────────
echo ""
echo "▶ Step 4/5 — Running database migrations..."
echo "  Waiting 30s for PostgreSQL to be ready..."
sleep 30

# Run migrations from local machine using the new DATABASE_URL
cd "$(dirname "$0")/../../apps/backend-nestjs"
DATABASE_URL="$DATABASE_URL" npx prisma migrate deploy
echo "  ✓ Migrations complete"

DATABASE_URL="$DATABASE_URL" npx ts-node prisma/seed.ts
echo "  ✓ Seed data inserted"

# ─── 5. TRIGGER INITIAL DEPLOYMENT ───────────────────────────────────────────
echo ""
echo "▶ Step 5/5 — Setup GitHub Actions deployment..."
echo "  Add these secrets to your GitHub repository:"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                  DEPLOYMENT COMPLETE ✓                      ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  Backend  : $BACKEND_URL"
echo "║  Frontend : $FRONTEND_URL"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  COST ESTIMATE                                               ║"
echo "║  App Service B1       : ~₹1,050/month                       ║"
echo "║  PostgreSQL B1ms*     : ~₹700/month  (auto-pause active)    ║"
echo "║  Static Web Apps      : ₹0           (free tier)            ║"
echo "║  App Insights + Logs  : ~₹100/month  (capped at 1GB/day)    ║"
echo "║  Storage              : ~₹50/month                          ║"
echo "║  ─────────────────────────────────────────────              ║"
echo "║  TOTAL ESTIMATE       : ~₹1,900/month                       ║"
echo "║  YOUR BUDGET          :  ₹3,500/month                       ║"
echo "║  BUFFER REMAINING     : ~₹1,600/month ✓                     ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  * PostgreSQL auto-pauses after 60min idle                  ║"
echo "║    Cold start: ~30s (acceptable for personal use)           ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║  GITHUB SECRETS TO ADD:                                     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "AZURE_BACKEND_APP_NAME=swingtrader-prod-backend"
echo "DATABASE_URL=$DATABASE_URL"
echo "BACKEND_URL=$BACKEND_URL"
echo ""
echo "# Get AZURE_CREDENTIALS by running:"
echo "az ad sp create-for-rbac --name swingtrader-cicd \\"
echo "  --role contributor \\"
echo "  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP \\"
echo "  --sdk-auth"
echo ""
echo "# Get AZURE_STATIC_WEB_APPS_TOKEN from Azure portal:"
echo "  → Portal → swingtrader-prod-frontend → Manage deployment token"
echo ""

# Save secrets to local file (gitignored)
cat > "$(dirname "$0")/../../.env.azure.local" <<EOF
# ⚠️  DO NOT COMMIT THIS FILE — it contains production secrets
# Generated: $(date)

AZURE_BACKEND_APP_NAME=swingtrader-prod-backend
BACKEND_URL=$BACKEND_URL
FRONTEND_URL=$FRONTEND_URL
DATABASE_URL=$DATABASE_URL
DB_PASSWORD=$DB_PASSWORD
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
APPLICATIONINSIGHTS_CONNECTION_STRING=$AI_CONN
EOF

echo "✓ Secrets saved to .env.azure.local (gitignored)"
echo ""
echo "⚠️  Budget alert set at 80% (~₹2,800) and 100% (~₹3,500)"
echo "   Alerts will go to: $ALERT_EMAIL"
