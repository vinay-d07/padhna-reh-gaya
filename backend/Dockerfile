# Build context: repo root (see docker-compose.yml) — needed because
# backend/src/lib/rag.js dynamically imports ../../../lanchain/src/index.js
# by relative path, so both packages have to land in the image at the same
# relative layout they have in the repo. This in-process coupling is
# tracked for a proper split into its own service — see docs/adr/.
FROM node:22-slim AS base
WORKDIR /app

FROM base AS backend-deps
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/prisma ./prisma
RUN npx prisma generate

FROM base AS lanchain-deps
WORKDIR /app/lanchain
COPY lanchain/package.json lanchain/package-lock.json ./
RUN npm ci --omit=dev

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=backend-deps /app/backend/node_modules ./backend/node_modules
COPY --from=backend-deps /app/backend/src/generated ./backend/src/generated
COPY backend ./backend
COPY --from=lanchain-deps /app/lanchain/node_modules ./lanchain/node_modules
COPY lanchain ./lanchain

WORKDIR /app/backend
EXPOSE 8080
CMD ["node", "src/index.js"]
