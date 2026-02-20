FROM node:22-slim AS base

# Install OpenSSL for Prisma + build tools for native modules
RUN apt-get update && apt-get install -y openssl python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Use the existing 'node' user (uid 1000) that comes with the node image
# HF Spaces also runs as uid 1000, so this is compatible

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3

# Create data directory for SQLite with correct permissions
RUN mkdir -p /app/data && chown node:node /app/data

USER node

# HF Spaces expects port 7860
EXPOSE 7860

ENV PORT=7860
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/prod.db"

CMD ["sh", "-c", "npx prisma db push --skip-generate && node server.js"]
