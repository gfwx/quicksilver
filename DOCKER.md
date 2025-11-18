# Docker Deployment Guide for Quicksilver

This guide explains how to run Quicksilver using Docker with both production and development configurations.

## Architecture

Quicksilver consists of 4 main services:

```
┌─────────────────────────────────────────┐
│         Nginx (Port 80)                 │
│         Reverse Proxy                   │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
┌─────────────┐  ┌─────────────┐
│  Next.js    │  │  FastAPI    │
│  (Port 3000)│  │  (Port 8000)│
└──────┬──────┘  └──────┬──────┘
       │                │
       ▼                ▼
┌─────────────┐  ┌─────────────┐
│  MongoDB    │  │   Ollama    │
│ (Port 27017)│  │ (Host:11434)│
└─────────────┘  └─────────────┘
       │                │
       ▼                ▼
  [Chat Data]    [AI Models & RAG]
                       │
                       ▼
                 ┌─────────────┐
                 │  LanceDB    │
                 │  (Vectors)  │
                 └─────────────┘
```

### Services

- **Nginx**: Reverse proxy routing traffic to Next.js and FastAPI
- **Next.js**: Frontend application (React) and API routes
- **FastAPI**: Python microservice for document processing and vector search
- **MongoDB**: NoSQL database for chat messages and metadata
- **Ollama**: AI model server (runs on host machine)

### Data Persistence

Three Docker volumes maintain persistent data:

- `mongodb_data`: MongoDB database files
- `prisma_data`: SQLite database (user/project metadata)
- `lancedb_data`: Vector embeddings for RAG

## Prerequisites

1. **Docker Desktop** installed and running
2. **Ollama** running on your host machine:
   ```bash
   ollama serve
   ```
3. Pull required Ollama model:
   ```bash
   ollama pull gemma3:4b-it-qat
   ```

## Production Deployment

Production setup uses optimized multi-stage builds, Nginx reverse proxy, and runs on a single port.

### 1. Build and Start Services

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f nextjs
docker-compose logs -f fastapi
```

### 2. Access Application

Open your browser to:
```
http://localhost
```

All traffic is routed through Nginx:
- `/` → Next.js frontend
- `/api/ai/*` → FastAPI backend
- All other `/api/*` → Next.js API routes

### 3. Monitor Services

```bash
# Check service status
docker-compose ps

# Check service health
docker-compose ps --format json | jq '.[] | {name: .Name, health: .Health}'

# Monitor resource usage
docker stats
```

### 4. Stop Services

```bash
# Stop all services (preserves data in volumes)
docker-compose down

# Stop and remove volumes (deletes all data)
docker-compose down -v
```

## Development Setup

Development setup provides hot-reloading, direct port access, and source code mounting for rapid iteration.

### 1. Start Development Environment

```bash
# Build and start development services
docker-compose -f docker-compose.dev.yml up

# Run in detached mode
docker-compose -f docker-compose.dev.yml up -d
```

### 2. Access Services

Services are directly accessible on their ports:

- **Next.js**: http://localhost:3000
- **FastAPI**: http://localhost:8000
- **FastAPI Docs**: http://localhost:8000/docs
- **MongoDB**: mongodb://localhost:27017

### 3. Hot Reload

Changes to source files are automatically detected:

- **Next.js**: Turbopack hot-reload via mounted `/app` directory
- **FastAPI**: Uvicorn auto-reload via mounted `/app` directory

### 4. Rebuilding After Dependency Changes

If you modify `package.json` or `requirements.txt`:

```bash
# Rebuild specific service
docker-compose -f docker-compose.dev.yml build nextjs
docker-compose -f docker-compose.dev.yml build fastapi

# Restart the service
docker-compose -f docker-compose.dev.yml up -d nextjs
```

### 5. Stop Development Environment

```bash
docker-compose -f docker-compose.dev.yml down
```

## Database Management

### Prisma Migrations

Migrations are automatically applied on container startup via the init script.

#### Create New Migration

```bash
# From host machine
npx prisma migrate dev --name your_migration_name

# Or exec into container
docker exec -it quicksilver-nextjs sh
npx prisma migrate dev --name your_migration_name
```

#### Reset Database

```bash
# Stop containers
docker-compose down

# Remove Prisma volume
docker volume rm quicksilver_prisma_data

# Restart (will create fresh database)
docker-compose up -d
```

### MongoDB Access

```bash
# Connect to MongoDB shell
docker exec -it quicksilver-mongodb mongosh quicksilver

# View collections
db.getCollectionNames()

# Query messages
db.messages.find().limit(5)

# Query chats
db.chats.find().limit(5)
```

### Backup Data

```bash
# Backup MongoDB
docker exec quicksilver-mongodb mongodump --out=/data/backup
docker cp quicksilver-mongodb:/data/backup ./mongodb-backup

# Backup SQLite
docker cp quicksilver-nextjs:/app/prisma/dev.db ./prisma-backup.db

# Backup vector embeddings
docker run --rm -v quicksilver_lancedb_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/lancedb-backup.tar.gz -C /data .
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs for errors
docker-compose logs [service-name]

# Verify Ollama is running on host
curl http://localhost:11434/api/tags

# Check health status
docker inspect --format='{{.State.Health.Status}}' quicksilver-nextjs
```

### Connection Refused Errors

Ensure services are using correct internal DNS names:
- Use `fastapi:8000` NOT `localhost:8000` from Next.js container
- Use `mongodb:27017` NOT `localhost:27017` from containers
- Use `host.docker.internal:11434` to reach Ollama on host

### Rebuild from Scratch

```bash
# Stop everything
docker-compose down -v

# Remove all Quicksilver images
docker images | grep quicksilver | awk '{print $3}' | xargs docker rmi -f

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

### Prisma Client Out of Sync

```bash
# Regenerate Prisma client
docker exec -it quicksilver-nextjs bunx prisma generate

# Restart Next.js service
docker-compose restart nextjs
```

### Clear Embeddings

```bash
# Remove LanceDB volume
docker-compose down
docker volume rm quicksilver_lancedb_data
docker-compose up -d
```

## Environment Variables

Environment variables are defined in `docker-compose.yml` and `docker-compose.dev.yml`. You can also create a `.env` file:

```bash
# Copy example
cp .env.docker.example .env

# Edit with your values
nano .env

# Docker Compose will automatically load .env file
```

Key variables:
- `OLLAMA_ENDPOINT`: URL to Ollama server
- `MONGODB_URI`: MongoDB connection string
- `FASTAPI_ENDPOINT`: FastAPI service URL
- `WORKOS_API_KEY`: WorkOS authentication (optional)

## Performance Optimization

### Production

- Multi-stage builds minimize image size
- Bun used for faster dependency installation
- Sentence transformer model pre-downloaded at build time
- Nginx caching and rate limiting enabled

### Development

- Volume mounts avoid rebuilding for code changes
- Shared dependency caches speed up rebuilds
- Direct port mapping bypasses Nginx overhead

## Security Considerations

1. **Nginx Security Headers**: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection
2. **Rate Limiting**: API and upload endpoints have rate limits
3. **Non-root User**: Next.js container runs as unprivileged user (UID 1001)
4. **Network Isolation**: Services communicate via internal Docker network
5. **Volume Permissions**: Proper ownership and permissions on mounted volumes

## Advanced Usage

### Custom Ollama Model

To use a different model:

1. Pull the model on host:
   ```bash
   ollama pull your-model-name
   ```

2. Update the model reference in your code:
   ```typescript
   // app/api/chat/route.ts
   const model = ollama('your-model-name')
   ```

### Scale Services

```bash
# Run multiple FastAPI workers
docker-compose up -d --scale fastapi=3

# Update Nginx to load balance
```

### External MongoDB

To use an external MongoDB instance:

1. Update `MONGODB_URI` in docker-compose.yml
2. Remove the `mongodb` service from docker-compose.yml
3. Remove `depends_on` references to mongodb

## CI/CD Integration

### Build Images

```bash
# Build production images
docker-compose build

# Tag for registry
docker tag quicksilver-nextjs:latest your-registry/quicksilver-nextjs:latest
docker tag quicksilver-fastapi:latest your-registry/quicksilver-fastapi:latest

# Push to registry
docker push your-registry/quicksilver-nextjs:latest
docker push your-registry/quicksilver-fastapi:latest
```

### Health Check Endpoints

Use these endpoints for health checks in orchestration tools:

- Next.js: `http://localhost/api/health`
- FastAPI: `http://localhost/api/ai/`
- Nginx: `http://localhost/health`

## Support

For issues or questions:
1. Check service logs: `docker-compose logs -f`
2. Verify all prerequisites are met
3. Ensure Ollama is running: `curl http://localhost:11434/api/tags`
4. Check Docker resources (memory, disk space)
