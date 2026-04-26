# 虾球 Hub（Xia Qiu Hub）

Next.js + Prisma + MySQL 的 **Skill / Rule 双轨**资源站：像素风 UI、统一搜索、榜单、ZIP 上传与在线编辑。本仓库在整体方案中承担 **资产 Hub**（管理、审核、发布与分发；含 Manifest、Agent Profile、Asset Factory 等能力路线）。

## 在整体体系中的位置

`skill-q-platform` 是「AI 工程资产操作系统」三仓之一，与本地执行引擎、运行态可视化协同：

| 项目 | 定位 | 与 Hub 的关系 |
|------|------|---------------|
| `br-ai-spec` | 本地工程执行引擎 | 从 Hub 拉取/同步资产，在目标项目内落地索引、锁与上下文 |
| **skill-q-platform（本仓库）** | **资产 Hub** | 对外提供资产、Manifest、Agent 配置等管理端与 API |
| br-ai-spec-visual | 运行态可视化与治理 | 消费运行与治理类数据，不上传业务源码正文 |

更完整的系统目标、目录边界与三仓协作关系，以体系级 PRD 为准（见下节「体系文档」）。

## 体系与规范文档（`br-ai-spec-docs`）

团队维护的 **文档总库**（本机示例路径，请以你克隆位置为准）：

`~/Downloads/00download/docs` 或同名的 `br-ai-spec-docs` 根目录。

开发本仓库前，**必须先阅读**「第二大阶段」下 **7 份** Markdown，形成统一架构、数据模型、API 与路线图共识：

| 顺序 | 文档 | 内容侧重 |
|------|------|----------|
| 1 | `第二大阶段/1-AI 工程资产操作系统：指令级 PRD 与技术蓝图.md` | 全局架构、技术栈与系统目标 |
| 2 | `第二大阶段/2-物理工程结构与目录树.md` | 三仓、业务项目、缓存的物理结构边界 |
| 3 | `第二大阶段/3-核心数据模型与数据库设计.md` | Hub/CLI/Visual 侧数据与建模约定 |
| 4 | `第二大阶段/4-API 契约与核心接口定义.md` | 统一 API 形态、安全与多执行器接入原则 |
| 5 | `第二大阶段/5-超详细的功能实现路线图.md` | 分阶段任务与优先级（按 P0→P1…执行） |
| 6 | `第二大阶段/6-极度严苛的测试验证清单.md` | 单元/集成/执行器切换/安全等测试要求 |
| 7 | `第二大阶段/7-最终交付验收清单.md` | DoD 与版本验收项 |

**补充**：同库中 `知识库文档/ai-spec规范核心架构/` 下为 Manifest、Rule、Skill、Agent Profile 等 **规范细化**，与 Hub 数据模型、接口命名对照阅读更佳。

**本仓库实现约束**（不删除既有逻辑、不绕过 lock、不修改已发布资产正文、CLI 与提示为中文、核心结构有类型与测试等）见根目录 [AGENTS.md](./AGENTS.md)。

## 功能概要

- **Skills**：`SKILL.md` 技能包，列表 `/skills`，在线编辑 `/skills/[slug]/editor`
- **Rules**：`RULE.md` 规则包，列表 `/rules`，在线编辑 `/rules/[slug]/editor`
- **搜索**：`/search`，支持类型 `all` / `skill` / `rule`
- **身份**：特工档案 `/me` 保存昵称后同步 `localStorage`，开启 `HUB_AUTH=on` 时与作者字段对齐
- **特工局**：Agent 用 API Key 注册/登录（`/me`），详见 [docs/agent-auth.md](./docs/agent-auth.md)
- **主题**：顶栏切换 **像素 / Apple / 手绘风 / 素描（铅笔 ink）**（`localStorage`：`preferred-theme`），说明见 [docs/theme-system.md](./docs/theme-system.md)；验收页 `/theme-preview`

## 本仓库内文档索引

- **使用与上云**：[docs/user-guide.md](./docs/user-guide.md)、[docs/upload-guide.md](./docs/upload-guide.md)
- **API**：[docs/api.md](./docs/api.md)
- **快速上手/版本记录**：[docs/v2.1-quick-start.md](./docs/v2.1-quick-start.md)（以仓库内最新为准）
- **部署**：[docs/deploy-checklist.md](./docs/deploy-checklist.md)
- **其他**：Rule 上传 [docs/rule-upload-guide.md](./docs/rule-upload-guide.md)、模板 [docs/RULE.template.md](./docs/RULE.template.md)、[docs/faq.md](./docs/faq.md)

## 本地开发

```bash
cp .env.example .env
# 配置 DATABASE_URL 后
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

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
