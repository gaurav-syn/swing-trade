# ─── Build stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# ─── Production stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

USER nestjs
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s CMD wget -qO- http://localhost:3001/api/v1/health || exit 1
CMD ["node", "dist/main"]
