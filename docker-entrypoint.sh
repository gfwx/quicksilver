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
    echo "Database not found or empty, initializing..."

    # Try to push the schema to create the database
    npx prisma db push --skip-generate || echo "Warning: Could not initialize database"
  fi
else
  echo "Using remote database URL"
fi

# Start the application
echo "Starting Next.js server..."
exec node server.js
