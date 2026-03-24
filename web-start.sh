#!/bin/sh
# 依赖构建阶段已 npm install/ci 且目录内保留完整 node_modules + .next（与 SRE 的 cp -R 一致）
set -e
export NODE_ENV="${NODE_ENV:-production}" PORT="${PORT:-3000}" HOSTNAME="${HOSTNAME:-0.0.0.0}"
cd "/opt/${CONF_ENV:-prod}"
exec npm run start
