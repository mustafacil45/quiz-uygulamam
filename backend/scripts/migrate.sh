#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

: "${DATABASE_URL:?Environment variable DATABASE_URL is required}"

echo "Running alembic migrations (DATABASE_URL=$DATABASE_URL)" 

# Try to run alembic with retries to wait for DB readiness
for i in {1..30}; do
  if alembic -c alembic.ini upgrade head; then
    echo "Migrations applied"
    exit 0
  else
    echo "Attempt $i failed, retrying in 1s..."
    sleep 1
  fi
done

echo "Failed to apply migrations after retries"
exit 1
