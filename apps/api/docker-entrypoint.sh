#!/bin/sh
set -e

# Run Prisma migrations
echo "Running database migrations..."
cd /app/apps/api
prisma migrate deploy

# Start the application
echo "Starting application..."
exec node /app/dist/main

