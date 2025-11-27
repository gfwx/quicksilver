#!/bin/sh
set -e

echo "Starting Quicksilver application..."

# Check if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
  echo "Using database: $DATABASE_URL"

  # Check if using local SQLite
  if echo "$DATABASE_URL" | grep -q "^file:"; then
    echo "Detected local SQLite database"

    # Extract database path from file: URL
    DB_PATH=$(echo "$DATABASE_URL" | sed 's|^file:||')
    DB_DIR=$(dirname "$DB_PATH")

    # Ensure database directory exists
    echo "Ensuring database directory exists: $DB_DIR"
    mkdir -p "$DB_DIR"

    # Copy migrations from backup if they don't exist in the mounted volume
    if [ ! -d "$DB_DIR/migrations" ] && [ -d "/app/prisma-migrations-backup" ]; then
      echo "Copying migrations from backup to mounted volume..."
      cp -r /app/prisma-migrations-backup "$DB_DIR/migrations"
      echo "Migrations copied successfully"
    fi

    # Check if database file needs initialization
    if [ ! -f "$DB_PATH" ] || [ ! -s "$DB_PATH" ]; then
      echo "Database not found or empty, running migrations..."
      npx prisma migrate deploy || echo "Warning: Could not run migrations"
    else
      echo "Database exists, ensuring migrations are up to date..."
      npx prisma migrate deploy || echo "Warning: Could not run migrations"
    fi

    # Verify database was created and has tables
    echo "Verifying database at: $DB_PATH"
    if [ -f "$DB_PATH" ]; then
      echo "Database file exists, size: $(du -h "$DB_PATH" | cut -f1)"
      ls -la "$DB_PATH"
    else
      echo "WARNING: Database file not found after migrations!"
    fi
  else
    echo "Detected remote database, running migrations..."
    npx prisma migrate deploy || echo "Warning: Could not run migrations"
  fi
else
  echo "Warning: DATABASE_URL not set, skipping migrations"
fi

# Start the application
echo "Starting Next.js server..."
echo "DATABASE_URL is: $DATABASE_URL"
export DATABASE_URL
exec node server.js
