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

npx prisma generate
exec next build
