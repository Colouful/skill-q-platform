#!/bin/sh
# 预发/生产：可选加载 .env.pre / .env.prod，再生成 Prisma Client 与 next build
set -eu

ENV_NAME="${1:?用法: build-env.sh <pre|prod>}"

case "$ENV_NAME" in
pre | prod) ;;
*)
  echo "ERROR: 仅支持 pre 或 prod"
  exit 1
  ;;
esac

if [ -f ".env.${ENV_NAME}" ]; then
  set -a
  # shellcheck disable=SC1090
  . ".env.${ENV_NAME}"
  set +a
fi

# 支持分变量 DB_*：未设 DATABASE_URL 时由脚本拼接（CI/SRE 也可只 export DB_*）
if [ -z "${DATABASE_URL:-}" ] && [ -n "${DB_HOST:-}" ]; then
  _db_url="$(node scripts/compose-database-url.cjs)"
  if [ -n "$_db_url" ]; then
    export DATABASE_URL="$_db_url"
  fi
fi

npx prisma generate
exec next build
