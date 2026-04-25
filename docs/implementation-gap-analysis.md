# skill-q-platform 第二阶段实现差距分析

## 分析范围

本文对照 `/Users/lizhenwei/Downloads/00download/docs/第二大阶段` 下 7 份 Markdown 文档，分析 `skill-q-platform` 当前代码结构、已实现能力与缺失能力。

本轮只做分析，不涉及业务代码修改。

## 当前项目定位

`skill-q-platform` 当前是基于 Next.js(前端全栈框架)、Prisma(数据库 ORM) 和 MySQL/MariaDB(关系型数据库) 的资产 Hub(资产中心)。现有主线是 Skill(技能)、Rule(规则)、Role(专家)、Scenario(场景方案) 资源站与后台管理。

第二阶段文档要求它升级为企业级 AI 工程资产事实源，负责：

- 平台/部门/团队/项目/个人多 scope(作用域)资产。
- Rule/Skill/Role/Flow/Scenario/Manifest/Agent Profile/Tech Profile/Source Pack(规则/技能/专家/流程/场景/安装清单/智能体画像/技术画像/资料包)。
- Manifest 推荐与导出。
- Asset Sync API(资产同步接口)。
- Asset Factory(资产工厂)生成、质检、导入草稿。
- 审核、发布、版本、checksum(校验和)、依赖、兼容性。
- 安装记录、运行反馈、质量和覆盖率统计。

## 当前代码结构

### 根目录

- `package.json`：Next.js 16、React 19、Prisma 7、Vitest(测试框架)、Playwright(端到端测试)。
- `prisma/schema.prisma`：当前业务模型集中在 Agent(智能体)、ApiKey(接口密钥)、Skill、Rule、Version、RuleVersion、Review、DownloadLog、Admin、RoleTemplate、ScenarioPackage、CapabilityDomain 等。
- `src/app/`：Next.js App Router(应用路由)。包含公开页面、后台页面、API route(接口路由)。
- `src/components/`：公开站点、后台、上传、编辑器、安装预览、主题等组件。
- `src/lib/`：认证、Hub 资产契约、manifest 构建、导入导出、校验、限流、搜索、缓存等服务逻辑。
- `scripts/`：本地导入 Skill/Rule、manifest 契约校验、字段修复、资产 canonical(规范化)脚本。
- `docs/`：API、上传、部署、主题、Agent 鉴权等已有文档。

### API(接口)现状

当前已存在大量 API route(接口路由)，核心包括：

- 公开资源：`/api/skills`、`/api/rules`、`/api/roles`、`/api/scenarios`、`/api/search`。
- 版本下载：`/api/skills/[slug]/versions/[ver]/download`、`/api/rules/[slug]/versions/[ver]/download`、Role 下载等。
- 安装相关：`/api/install/preview`、`/api/install/export`、`/api/install/registry`、`/api/install/supplement-export`。
- Manifest 相关：`/api/manifests/scenarios/[slug]`、`/api/hub/manifests/[manifestId]/export`。
- 后台：资源浏览、技能/规则审核、角色/场景管理、分类、配置、统计、Agent 管理。
- 用户/Agent 认证：`/api/auth/*`、`/api/admin/auth/*`、API Key 管理。

## 第二阶段目标能力对照

| 能力域 | 第二阶段要求 | 当前状态 | 说明 |
| --- | --- | --- | --- |
| 资产模型 | HubAsset/HubAssetVersion 统一承载 rule/skill/role/flow/scenario/manifest/agent-profile/tech-profile/source-pack | 部分实现 | 当前 Skill、Rule、RoleTemplate、ScenarioPackage 分表存在，但没有统一 HubAsset 抽象、scope、status、checksum、dependency graph(依赖图)。 |
| 资产版本 | 发布版本不可变，checksum 强约束 | 部分实现 | Skill/Rule/Role 有 version 表或版本字段，但不可变、checksum、状态机和依赖未统一。 |
| Manifest | 一等资产、版本、引用资产、installPolicy、checksum | 部分实现 | 有场景生成 manifest、安装预览与 export API；缺 hub_manifest/hub_manifest_version/hub_manifest_asset 数据模型。 |
| Manifest 推荐 | `POST /api/hub/manifests/recommend` | 缺失 | 目前有按场景导出，未见扫描事实输入后的推荐接口。 |
| Asset Export | `GET /api/hub/assets/:kind/:slug/export` | 部分实现 | Skill/Rule/Role/Scenario 有各自下载/导出，缺统一资产导出契约。 |
| Agent Profile(智能体画像) | 一等资产，含 executor、tools、contextScope、modelPolicy、approvalPolicy、outputContract、riskLevel | 缺失 | 当前 Agent 是平台使用者/API Key 主体，不等同 Agent Profile。 |
| Tech Profile(技术画像) | 技术栈画像资产，用于 Manifest 推荐 | 缺失 | 当前有 supportedProfiles 字段和 profile option(画像选项)，但不是 TechProfile 表。 |
| Source Pack(资料包) | 资料包与资料项，供 Asset Factory 引用 | 缺失 | 暂无 source_pack/source_pack_item 模型。 |
| Asset Factory(资产工厂) | 生成任务、生成项、质量检查、LLM Provider(大模型提供器)配置 | 缺失 | 暂无 asset_generation_job、quality_check、provider_config。 |
| 审核与审计 | audit_ticket、audit_log，资产发布流转 | 部分实现 | 有 admin、pending skills/rules、moderationStatus、CategoryAuditLog，但未统一所有资产类型。 |
| 安装记录 | `POST /api/hub/install-records` | 缺失 | Visual 有 installation report，Hub 侧缺第二阶段要求的安装记录模型和接口。 |
| 运行反馈 | `POST /api/hub/runtime-feedback` | 缺失 | br-ai-spec 有 `hub runtime-report` 客户端概念，但 Hub 服务端接口/模型不完整。 |
| 统一 API 响应 | `{ code, message, data, error, requestId, timestamp }` | 部分实现 | 项目有 api-response 工具，但路由不一定全部按第二阶段契约统一。 |
| Error Code(错误码) | 全局可枚举错误码 | 部分实现 | 有 api-errors 等基础，但未覆盖第二阶段全部错误域。 |
| Asset Scope(资产作用域) | platform/department/team/project/personal | 缺失 | 当前主要是公开资源、作者、Agent，缺组织与作用域模型。 |
| Org/User 模型 | org_unit、hub_user、org_member | 缺失 | 当前 Agent/Admin/User 语义分散，缺组织成员体系。 |
| 权限与风险 | 高风险资产人工审批，Agent Profile 策略 | 部分实现 | 有 admin 权限和上传策略，但缺统一 riskLevel 与发布门禁。 |
| 统计治理 | 使用率、覆盖率、质量、推荐等级 | 部分实现 | 有 analytics 接口和下载/评分，但缺 Manifest/Agent Profile/运行反馈驱动的治理指标。 |
| 与 br-ai-spec 联动 | 推荐、导出、同步、反馈闭环 | 部分实现 | CLI 可消费部分 manifest/export/supplement，但缺第二阶段标准 API 全链路。 |

## 已实现能力

1. Skill(技能) 与 Rule(规则) 资源管理：列表、详情、上传、在线编辑、版本、下载、评论。
2. Role(专家) 管理：RoleTemplate(专家模板)、RoleVersion(专家版本)、关联 Skill/Rule。
3. ScenarioPackage(场景方案) 管理：关联 Role/Skill/Rule，支持 supportedProfiles(支持画像) 和 recommendedIdes(推荐 IDE)。
4. Manifest(安装清单)雏形：可按场景生成安装 manifest，提供安装预览、导出、supplement-export(补充导出)。
5. Admin(后台管理)能力：资源浏览、分类、配置、角色、场景、待审核 Skill/Rule。
6. Agent(API 调用主体)能力：API Key、会话、限流、下载策略和作者关联。
7. 资产导入脚本：可从 `br-ai-spec` 本地 `.agents/skills`、`.agents/rules` 批量导入。
8. Manifest 契约校验脚本：`verify-manifest-contract` 可对导出的 manifest 与 CLI registry(注册表)契约做校验。
9. 基础安全能力：限流、黑名单、登录策略、上传安全扫描、ZIP 导入校验。
10. 主题与前台展示：资源市场、搜索、榜单、主题切换等完整 Web 体验。

## 缺失能力 Top 20

1. 统一 HubAsset(资产) / HubAssetVersion(资产版本) 模型。
2. AssetKind(资产类型) 覆盖 manifest、agent-profile、tech-profile、source-pack、contract、template。
3. AssetScope(资产作用域) 与组织模型。
4. 发布版本不可变与 checksum(校验和)强约束。
5. Manifest 一等资产数据表和版本表。
6. Manifest 与资产引用关系表。
7. `POST /api/hub/manifests/recommend` 推荐接口。
8. `GET /api/hub/manifests/:slug/export?version=` 标准导出接口完全对齐。
9. `GET /api/hub/assets/:kind/:slug/export` 统一资产导出接口。
10. Agent Profile(智能体画像) 数据表、版本、导出接口。
11. Tech Profile(技术画像) 数据表与推荐规则。
12. Source Pack(资料包) 与 item(资料项)。
13. Asset Factory(资产工厂) 任务、生成项、质检、导入草稿。
14. audit_ticket/audit_log(审核工单/审计日志) 覆盖所有资产。
15. install-records(安装记录) 接口和表。
16. runtime-feedback(运行反馈) 接口和表。
17. 统一 ApiResponse(接口响应) 和 Error Code(错误码) 全路由收敛。
18. 资产依赖图和兼容性约束。
19. 使用效果、失败原因、推荐等级的闭环指标。
20. 对 `br-ai-spec` 扫描结果的 Manifest 推荐测试集。

## 与其他两个项目的依赖

`skill-q-platform` 是三项目中应优先收敛的事实源。`br-ai-spec` 的 `init --recommend`、`sync`、全局缓存和 lock 都依赖它的 Manifest/Asset/Agent Profile 导出契约；`br-ai-spec-visual` 的资产质量和治理报表依赖它接收安装记录与运行反馈。

## 风险点

1. 当前 Skill/Rule/Role/Scenario 是分表模型，第二阶段要求统一 HubAsset 抽象，迁移要避免破坏现有前台页面和后台操作路径。
2. Agent 当前代表 API 调用者，不是 Agent Profile(智能体画像)，命名容易混淆。
3. Manifest 当前更多是场景导出结果，不是可审核、可发布、不可变的一等资产。
4. supportedProfiles(支持画像) 当前是资源字段，不等于 Tech Profile(技术画像)事实源。
5. Asset Factory(资产工厂) 会引入外部模型调用、成本、质量和安全问题，不应先于 P0/P1 核心契约实现。

