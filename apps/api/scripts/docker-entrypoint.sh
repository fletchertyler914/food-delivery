#!/bin/sh
set -eu

if [ "${NODE_ENV:-development}" = "production" ] && [ "${SEED_DATABASE:-false}" = "true" ] && [ "${ALLOW_PROD_SEED:-false}" != "true" ]; then
  echo "Refusing to seed in production. Set ALLOW_PROD_SEED=true to override." >&2
  exit 1
fi

echo "Applying database migrations..."
(cd /app/apps/api && ./node_modules/.bin/prisma migrate deploy)

if [ "${SEED_DATABASE:-false}" = "true" ]; then
  echo "Seeding demo data..."
  (cd /app/apps/api && ./node_modules/.bin/tsx prisma/seed.ts)
fi

echo "Starting API..."
exec node /app/apps/api/dist/main.js
