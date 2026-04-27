FROM node:20-bookworm-slim
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# 安装 pnpm（项目启动需要）
RUN npm install -g pnpm@10
COPY package.json package-lock.json pnpm-lock.yaml* .npmrc* ./
# 预生成 prisma（仅类型，不连数据库）
RUN npx prisma generate --no-engine
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
