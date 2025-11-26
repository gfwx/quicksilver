#!/bin/sh
set -e

echo "Starting Quicksilver application..."

# Check if database needs to be initialized (only for local SQLite)
if [ -n "$DATABASE_URL" ] && echo "$DATABASE_URL" | grep -q "^file:"; then
  echo "Using local SQLite database"

  # Ensure database directory exists
  mkdir -p /app/prisma

  # Check if database needs initialization
  if [ ! -f "/app/prisma/dev.db" ] || [ ! -s "/app/prisma/dev.db" ]; then
    echo "Database not found or empty, running migrations..."

    # Run migrations to create the database and tables
    npx prisma migrate deploy || echo "Warning: Could not run migrations"
  else
    echo "Database exists, ensuring migrations are up to date..."
    npx prisma migrate deploy || echo "Warning: Could not run migrations"
  fi
else
  echo "Using remote database URL"
fi

# Start the application
echo "Starting Next.js server..."
exec node server.js
