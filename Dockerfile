# Multi-stage build for Next.js production
FROM oven/bun:1 AS deps

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies (including optional dependencies for platform-specific binaries)
# Using --frozen-lockfile to ensure reproducible builds
RUN bun install --frozen-lockfile || (echo "Frozen lockfile failed, trying without..." && bun install)

# Builder stage
FROM oven/bun:1 AS builder

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

# Copy Prisma schema and generate client
RUN apt-get update -y && apt-get install -y openssl

# Debug: Verify prisma schema exists and DATABASE_URL
RUN ls -la lib/generated/prisma/ || echo "Prisma directory not found"
RUN echo "DATABASE_URL is: $DATABASE_URL"

# Generate Prisma client (schema already copied with COPY . .)
RUN bunx prisma generate

# Build Next.js application
RUN bun run build

# Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install OpenSSL for Prisma and other build tools
RUN apk add --no-cache openssl npm

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma files for runtime (custom output location)
COPY --from=builder /app/lib/generated/prisma ./lib/generated/prisma

# Copy Prisma runtime dependencies
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy libsql dependencies (required for @prisma/adapter-libsql)
COPY --from=builder /app/node_modules/@libsql ./node_modules/@libsql
COPY --from=builder /app/node_modules/libsql ./node_modules/libsql

# Copy additional dependencies for libsql and node-fetch
COPY --from=builder /app/node_modules/js-base64 ./node_modules/js-base64
COPY --from=builder /app/node_modules/promise-limit ./node_modules/promise-limit
COPY --from=builder /app/node_modules/node-fetch ./node_modules/node-fetch
COPY --from=builder /app/node_modules/detect-libc ./node_modules/detect-libc
COPY --from=builder /app/node_modules/data-uri-to-buffer ./node_modules/data-uri-to-buffer
COPY --from=builder /app/node_modules/fetch-blob ./node_modules/fetch-blob
COPY --from=builder /app/node_modules/formdata-polyfill ./node_modules/formdata-polyfill
COPY --from=builder /app/node_modules/node-domexception ./node_modules/node-domexception
COPY --from=builder /app/node_modules/web-streams-polyfill ./node_modules/web-streams-polyfill

# Copy ws module for @libsql/isomorphic-ws runtime dependency
COPY --from=builder /app/node_modules/ws ./node_modules/ws

# Install platform-specific libsql native binaries for Alpine Linux
# These are optional dependencies that aren't installed on macOS during build
RUN npm install --no-save --omit=dev \
    @libsql/linux-arm64-musl@0.3.19 \
    @libsql/linux-x64-musl@0.5.22 || true

# Create Prisma data directory and set ownership
RUN mkdir -p /app/lib/generated/prisma && chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "server.js"]
