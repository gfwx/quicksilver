# Multi-stage build for Next.js production

# Stage 1: Dependencies
FROM node:20-slim AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies including platform-specific native modules
RUN npm install --include=optional

# Explicitly install lightningcss platform-specific binary
RUN npm install lightningcss-linux-arm64-gnu@1.30.1 --no-save --force 2>&1 || echo "lightningcss binary install attempted"

# Stage 2: Builder
FROM node:20-slim AS builder
WORKDIR /app

# Accept build arguments with defaults for build-time
ARG DATABASE_URL="file:/app/prisma/dev.db"
ARG FASTAPI_ENDPOINT=""
ARG OLLAMA_ENDPOINT=""

# Set environment variables for build time
ENV DATABASE_URL=$DATABASE_URL
ENV FASTAPI_ENDPOINT=$FASTAPI_ENDPOINT
ENV OLLAMA_ENDPOINT=$OLLAMA_ENDPOINT

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy package.json for rebuild
COPY package.json ./

# Rebuild native modules for the current platform (especially lightningcss)
RUN npm rebuild

# Copy source code
COPY . .

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma client with custom output directory
RUN npx prisma generate

# Build Next.js application (standalone mode)
RUN npm run build

# Stage 3: Production runner
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install OpenSSL for Prisma runtime
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Create a non-root user with home directory
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --home /home/nextjs nextjs

# Copy built application from standalone output
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files for runtime (custom output location)
COPY --from=builder --chown=nextjs:nodejs /app/lib/generated/prisma ./lib/generated/prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/package.json ./package.json

# Copy migrations to a separate location to preserve them when volume is mounted
COPY --from=builder --chown=nextjs:nodejs /app/prisma/migrations ./prisma-migrations-backup

# Install only Prisma CLI and dotenv for migrations (before switching to non-root user)
RUN npm install --no-save prisma@7.0.0 dotenv@17.2.3

# Copy libsql dependencies for Prisma runtime
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@libsql ./node_modules/@libsql
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/libsql ./node_modules/libsql

# Copy entrypoint script
COPY --chown=nextjs:nodejs docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Create directories for SQLite database and ensure proper permissions
RUN mkdir -p /home/nextjs /app/prisma && \
    chown -R nextjs:nodejs /home/nextjs /app/prisma

# Switch to non-root user
USER nextjs

# Set HOME environment variable for the nextjs user
ENV HOME=/home/nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["/app/docker-entrypoint.sh"]
