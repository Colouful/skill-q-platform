# 虾球Hub — 预发 /opt/pre + 生产 /opt/prod 双包；启动仅 Node（无 Nginx），见 web-start.sh
# 构建：
#   docker build -t xiaqiu-hub:latest \
#     --build-arg NEXT_PUBLIC_SITE_URL_PRE=https://pre.example.com \
#     --build-arg NEXT_PUBLIC_SITE_URL_PROD=https://www.example.com .
# 运行：注入 DATABASE_URL 等；预发 Pod 设 CONF_ENV=pre，生产设 CONF_ENV=prod（默认 prod）

FROM node:20-bookworm-slim AS base
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_SITE_URL_PRE=http://localhost:3000
ARG NEXT_PUBLIC_SITE_URL_PROD=https://example.com

RUN cp -a /app /opt/pre \
  && cd /opt/pre \
  && NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL_PRE}" npm run build:pre

RUN cp -a /app /opt/prod \
  && cd /opt/prod \
  && NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL_PROD}" npm run build:prod

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV CONF_ENV=prod

WORKDIR /opt/web
COPY web-start.sh /opt/web/web-start.sh
RUN chmod +x /opt/web/web-start.sh

# next start 需要完整工程树（含 node_modules），与 SRE「cp -R 后 npm run start」一致；镜像体积会较大
COPY --from=builder /opt/pre /opt/pre
COPY --from=builder /opt/prod /opt/prod

EXPOSE 3000
CMD ["sh", "/opt/web/web-start.sh"]
