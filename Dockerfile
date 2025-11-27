# Multi-stage build for Next.js production
FROM oven/bun:1-debian AS deps

WORKDIR /app

# Install Python and build tools for native dependencies
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --no-save

# Builder stage
FROM oven/bun:1-debian AS builder

WORKDIR /app

# Accept build arguments with defaults for build-time
ARG DATABASE_URL="file:/app/prisma/dev.db"
ARG FASTAPI_ENDPOINT
ARG OLLAMA_ENDPOINT

# Set environment variables for build time
ENV DATABASE_URL=$DATABASE_URL
ENV FASTAPI_ENDPOINT=$FASTAPI_ENDPOINT
ENV OLLAMA_ENDPOINT=$OLLAMA_ENDPOINT

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Generate Prisma client (schema already copied with COPY . .)
RUN bunx prisma generate

# Build Next.js application
RUN bun run build

# Production runner stage
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install only OpenSSL for Prisma (npm is included in node:20-slim)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Create a non-root user with home directory
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --home /home/nextjs nextjs

# Copy built application from standalone output
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma files for runtime (custom output location)
COPY --from=builder /app/lib/generated/prisma ./lib/generated/prisma
COPY --from=builder /app/prisma ./prisma

# Copy entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# The standalone output already includes all necessary dependencies (including Prisma now)
# Copy libsql dependencies and ws package for Prisma runtime
COPY --from=builder /app/node_modules/@libsql ./node_modules/@libsql
COPY --from=builder /app/node_modules/ws ./node_modules/ws

# Create Prisma data directory and home directory with proper permissions
RUN mkdir -p /app/lib/generated/prisma /app/prisma /home/nextjs && \
    touch /app/prisma/dev.db || true && \
    chown -R nextjs:nodejs /app /home/nextjs

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
