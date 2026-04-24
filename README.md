# 虾球 Hub（Xia Qiu Hub）

Next.js + Prisma + MySQL 的 AI 工程资产 Hub：管理 Skill / Rule（技能 / 规则）、Role / Flow（角色 / 流程）与 Manifest（方案包清单），为 `br-ai-spec`（命令行执行底座）提供可安装、可版本化、可审计的团队级能力包。

## 功能概要

- **Skills**：`SKILL.md` 技能包，列表 `/skills`，在线编辑 `/skills/[slug]/editor`
- **Rules**：`RULE.md` 规则包，列表 `/rules`，在线编辑 `/rules/[slug]/editor`
- **Manifest**：方案包清单，列表 `/manifests`，编辑器 `/manifests/new`，导出接口 `/api/hub/manifests/[id]/export`
- **Hub API**：`/api/hub/search`、`/api/hub/registry/export`、安装上报与运行回流接口，详见 [docs/api.md](./docs/api.md)
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
| `npm run import:skills-local -- --source <dir>` | 从本地目录递归扫描 `SKILL.md` 并通过 `/api/skills` 导入 |
| `npm run import:rules-local -- --source <dir>` | 从本地目录递归扫描 Rule Markdown 并通过 `/api/rules` 导入 |

## 环境变量

见根目录 `.env.example`（`NEXT_PUBLIC_SITE_URL`、`HUB_AUTH`、`HUB_ADMIN_SECRET`、黑名单 `HUB_BLOCKLIST_*`、数据库与可选 MinIO / Redis）。

## 本地 Skill 导入

单个 Skill 可直接在上传页点击“选择文件夹”导入。若需要把另一个仓库里的多个 Skill 批量导入当前站点，可使用：

```bash
npm run import:skills-local -- \
  --source /Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec/.agents/skills \
  --author lizhenwei \
  --dry-run
```

确认扫描结果后，去掉 `--dry-run` 即可真正创建。若站点开启了“上传需登录”，再补 `--bearer <Agent API Key>`；若仅开启 `HUB_AUTH`，确保 `--author` 与 `--hub-actor` 一致即可。
若同一批次里存在重名 Skill（如 `react/vue` 下的 `create-api`），脚本会自动追加路径后缀，避免导入后展示名冲突。

## 本地 Rule 导入

若需要把另一个仓库里的多个 Rule Markdown 批量导入当前站点，可使用：

```bash
npm run import:rules-local -- \
  --source /Users/lizhenwei/workspace/vueworkspace/bairong/br-ai-spec/.agents/rules \
  --author lizhenwei \
  --dry-run
```

确认扫描结果后，去掉 `--dry-run` 即可真正创建。脚本会为这批本地 Rule 推断中文名称、稳定英文 slug、分类与标签；若站点开启了“上传需登录”，再补 `--bearer <Agent API Key>`；若仅开启 `HUB_AUTH`，确保 `--author` 与 `--hub-actor` 一致即可。

## 许可

私有项目；内部使用请遵循团队规范。
