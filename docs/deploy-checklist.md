# 部署与运维清单

以下对应 `tasks.md` 中需在真实环境执行的操作，无法由代码仓库单独「完成」。

## 数据库

1. 备份生产库（10.3.1）。
2. 执行 `npx prisma migrate deploy`（1.2.4、10.3.2）。
3. 抽样校验 Rule/Skill 数据（10.3.3）。
4. 准备回滚方案：保留迁移前备份与上一版本镜像（10.3.4）。

## 应用

1. 配置生产环境变量：`.env.example` 中 `DATABASE_URL`、`NEXT_PUBLIC_SITE_URL`、`HUB_AUTH`、`HUB_ADMIN_SECRET` 等（10.1.1）。
2. 构建：`npm run build`（10.1.2）。
3. 部署至 Vercel / 自有 Node 主机（10.1.3）。
4. 配置域名与 HTTPS（10.1.4）。
5. Smoke：首页、/skills、/rules、搜索、上传（10.1.5）。
6. 接入 Sentry 等 APM（10.1.6，可选）。

## 浏览器手工回归（9.4）

在 Chrome / Firefox / Safari / Edge 及 iOS Safari、Chrome Mobile 对核心路径各过一遍；本仓库 E2E 已覆盖多视口自动化，但不替代真机网络与输入法测试。
