#!/bin/sh
set -e

echo "🔄 Initializing database..."

# Wait for the database file to be accessible
if [ ! -f "/app/prisma/dev.db" ]; then
    echo "📝 Creating new database..."
else
    echo "✓ Database file exists"
fi

# Run Prisma migrations
echo "🔄 Running Prisma migrations..."
cd /app
npx prisma migrate deploy

echo "✅ Database initialization complete!"
