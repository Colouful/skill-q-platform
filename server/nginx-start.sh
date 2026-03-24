#!/bin/sh
# 虾球 Hub：Next standalone + Nginx（单目录 /opt/web）。双包、仅 Node 见仓库根目录 web-start.sh。
set -e

export NODE_ENV="${NODE_ENV:-production}"
export PORT="${PORT:-3000}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"

cd /opt/web

if [ ! -f .next/standalone/server.js ]; then
  echo "ERROR: /opt/web/.next/standalone/server.js 不存在，请先执行 npm run build"
  exit 1
fi

# Next standalone 运行时需要同目录下的 public 与 .next/static
mkdir -p .next/standalone/.next
[ -d public ] && cp -r public .next/standalone/
[ -d .next/static ] && cp -r .next/static .next/standalone/.next/static

cd .next/standalone
node server.js &
NODE_PID=$!

# 与 COPY server/nginx.conf 的目标路径一致（见 deploy/sre-docker-notes.txt）
NGINX_CONF="${NGINX_CONF:-/opt/nginx/nginx.conf}"
if [ ! -f "$NGINX_CONF" ] && [ -f /opt/nginx/conf ]; then
  NGINX_CONF=/opt/nginx/conf
fi

nginx -t -c "$NGINX_CONF"
exec nginx -c "$NGINX_CONF" -g "daemon off;"
