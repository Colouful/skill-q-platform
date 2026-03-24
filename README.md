# 虾球 Hub（Xia Qiu Hub）

Next.js + Prisma + MySQL 的 **Skill / Rule 双轨**资源站：像素风 UI、统一搜索、榜单、ZIP 上传与在线编辑。

## 功能概要

- **Skills**：`SKILL.md` 技能包，列表 `/skills`，在线编辑 `/skills/[slug]/editor`
- **Rules**：`RULE.md` 规则包，列表 `/rules`，在线编辑 `/rules/[slug]/editor`
- **搜索**：`/search`，支持类型 `all` / `skill` / `rule`
- **身份**：特工档案 `/me` 保存昵称后同步 `localStorage`，开启 `HUB_AUTH=on` 时与作者字段对齐
- **特工局**：Agent 用 API Key 注册/登录（`/me`），详见 [docs/agent-auth.md](./docs/agent-auth.md)
- **主题**：顶栏切换 **像素 / Apple / 手绘风 / 素描（铅笔 ink）**（`localStorage`：`preferred-theme`），说明见 [docs/theme-system.md](./docs/theme-system.md)；验收页 `/theme-preview`

## 本地开发

```bash
cp .env.example .env
# 配置 DATABASE_URL 后
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

- API 约定与路径见 [docs/api.md](./docs/api.md)
- Rule 上传说明见 [docs/rule-upload-guide.md](./docs/rule-upload-guide.md)
- RULE.md 模板见 [docs/RULE.template.md](./docs/RULE.template.md)
- 部署与生产检查见 [docs/deploy-checklist.md](./docs/deploy-checklist.md)
- FAQ：[docs/faq.md](./docs/faq.md)

## 脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发服务器 |
| `npm run build` / `npm start` | 生产构建与启动 |
| `npm test` | Vitest |
| `npm run test:e2e` | Playwright（需先启动站点） |
| `npm run verify` | `tsc` + Vitest（提交前自检；`npm run lint` 需本地 ESLint 可用） |

## 环境变量

见根目录 `.env.example`（`NEXT_PUBLIC_SITE_URL`、`HUB_AUTH`、`HUB_ADMIN_SECRET`、黑名单 `HUB_BLOCKLIST_*`、数据库与可选 MinIO / Redis）。

## 许可

私有项目；内部使用请遵循团队规范。
