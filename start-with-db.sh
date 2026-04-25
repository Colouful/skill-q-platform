#!/bin/bash
# 启动 skill-q-platform 服务（使用 Docker MariaDB）

set -e
set -o pipefail

COMPOSE_FILE="docker-compose-db-only.yml"
APP_PORT="${PORT:-3000}"
DB_PORT="${SKILL_Q_DB_PORT:-13307}"
DB_NAME="${SKILL_Q_DB_NAME:-skill_q_platform}"
DB_USER="${SKILL_Q_DB_USER:-skillq_user}"
DB_PASSWORD="${SKILL_Q_DB_PASSWORD:-skillq_password_123}"
DB_ROOT_PASSWORD="${SKILL_Q_DB_ROOT_PASSWORD:-root_password_123}"
DATABASE_URL_LOCAL="mysql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:${DB_PORT}/${DB_NAME}?charset=utf8mb3"
PACKAGE_MANAGER="${PACKAGE_MANAGER:-pnpm}"

export SKILL_Q_DB_PORT="${DB_PORT}"
export SKILL_Q_DB_NAME="${DB_NAME}"
export SKILL_Q_DB_USER="${DB_USER}"
export SKILL_Q_DB_PASSWORD="${DB_PASSWORD}"
export SKILL_Q_DB_ROOT_PASSWORD="${DB_ROOT_PASSWORD}"

echo "🚀 启动 skill-q-platform (端口 ${APP_PORT} + Docker MariaDB)"
echo ""

if ! command -v docker-compose >/dev/null 2>&1; then
  echo "❌ 未找到 docker-compose，请先安装 Docker Desktop 或 docker-compose"
  exit 1
fi

if ! command -v "${PACKAGE_MANAGER}" >/dev/null 2>&1; then
  echo "❌ 未找到 ${PACKAGE_MANAGER}，可设置 PACKAGE_MANAGER=npm 后重试"
  exit 1
fi

echo "1️⃣  写入本地数据库覆盖配置..."
cat > .env.local <<EOF
# 本地开发覆盖配置；由 start-with-db.sh 自动生成。
# 远程数据库配置仍保留在 .env 中，本文件已被 .gitignore 忽略。
DATABASE_URL="${DATABASE_URL_LOCAL}"
EOF
echo "✅ .env.local 已指向本地 Docker MariaDB"
echo ""

echo "2️⃣  启动 MariaDB 容器..."
docker-compose -f "${COMPOSE_FILE}" up -d
echo "✅ MariaDB 已启动"
echo ""

echo "3️⃣  等待数据库就绪..."
for i in {1..40}; do
  if docker-compose -f "${COMPOSE_FILE}" exec -T db mariadb -u"${DB_USER}" -p"${DB_PASSWORD}" -e "SELECT 1" > /dev/null 2>&1; then
    echo "✅ 数据库就绪"
    break
  fi
  if [ "$i" -eq 40 ]; then
    echo "❌ 数据库启动超时"
    exit 1
  fi
  sleep 1
done
echo ""

echo "4️⃣  停止旧 Node 进程..."
pkill -f "next dev" 2>/dev/null || true
lsof -ti:"${APP_PORT}" | xargs kill -9 2>/dev/null || true
sleep 1
echo "✅ 旧进程已停止"
echo ""

echo "5️⃣  清理缓存..."
rm -rf .next node_modules/.cache 2>/dev/null || true
echo "✅ 缓存已清理"
echo ""

echo "6️⃣  初始化数据库..."
export DATABASE_URL="${DATABASE_URL_LOCAL}"
echo "   - 生成 Prisma Client..."
"${PACKAGE_MANAGER}" run prisma:generate
echo "   - 推送数据库 Schema..."
"${PACKAGE_MANAGER}" run db:push
echo "✅ 数据库初始化完成"
echo ""

echo "7️⃣  启动服务..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🌐 服务地址: http://localhost:${APP_PORT}"
echo "  🗄️  数据库: MariaDB (localhost:${DB_PORT}/${DB_NAME})"
echo "  📄 本地配置: .env.local"
echo "  ⏹  停止: Ctrl+C (数据库会继续运行)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

PORT="${APP_PORT}" DATABASE_URL="${DATABASE_URL_LOCAL}" "${PACKAGE_MANAGER}" run dev
