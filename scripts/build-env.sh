#!/bin/sh
# 预发/生产：若存在 .env.pre / .env.prod 则加载；不存在则完全依赖当前已 export 的环境变量（SRE「ENV」区、RUN 前 export 均可）
set -eu

ENV_NAME="${1:?用法: build-env.sh <pre|prod>}"

case "$ENV_NAME" in
pre | prod) ;;
*)
  echo "ERROR: 仅支持 pre 或 prod" >&2
  exit 1
  ;;
esac

# 相对仓库根目录定位（不依赖当前工作目录是否被 pnpm/其他工具改掉）
ROOT=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
env_file="$ROOT/.env.${ENV_NAME}"

if [ -f "$env_file" ] && [ -r "$env_file" ]; then
  echo "build-env: 加载 $env_file"
  set -a
  # shellcheck disable=SC1090
  . "$env_file"
  set +a
else
  echo "build-env: 未找到可读文件 $env_file（正常：.env.* 通常不进 Git）。将使用构建环境已有变量，请确保 SRE/CI 已配置 NEXT_PUBLIC_SITE_URL、DATABASE_URL 或 DB_* 等。"
fi

# 支持分变量 DB_*：未设 DATABASE_URL 时由脚本拼接
if [ -z "${DATABASE_URL:-}" ] && [ -n "${DB_HOST:-}" ]; then
  _db_url="$(node "$ROOT/scripts/compose-database-url.cjs")"
  if [ -n "$_db_url" ]; then
    export DATABASE_URL="$_db_url"
  fi
fi

cd "$ROOT"
npx prisma generate
exec next build
