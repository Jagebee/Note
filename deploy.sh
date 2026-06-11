#!/usr/bin/env bash
set -euo pipefail

# ============================================
# 一键部署脚本 —— 在目标服务器上运行
# 用法: bash deploy.sh
# ============================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "==> Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "Error: Docker not installed"; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "Error: Docker Compose not installed"; exit 1; }

echo "==> Checking .env..."
if [ ! -f .env ]; then
  echo "Error: .env not found!"
  echo "Copy .env.example to .env and fill in the values."
  exit 1
fi

echo "==> Pulling MySQL image..."
docker compose pull db

echo "==> Building and starting services..."
docker compose up -d --build

echo "==> Waiting for database to be healthy..."
sleep 5
docker compose exec db mysqladmin ping -h localhost --silent 2>/dev/null && echo "Database ready" || echo "Database not ready - check logs: docker compose logs db"

echo "==> Seeding admin account..."
docker compose exec -T app npx tsx prisma/seed.ts 2>/dev/null && echo "Admin seeded" || echo "Seeding may have been done already"

echo ""
echo "✅  Deployment complete!"
echo "    App:  http://localhost:3000 (via Docker)"
echo "    Or via your domain if Nginx is configured."
echo ""
echo "    Default login: admin / admin123456"
