# skill-q-platform P0 实施计划

## 目标

将当前资源站式 Hub(资产中心)收敛为第二阶段要求的资产事实源最小底座，优先满足 `br-ai-spec` 初始化、推荐、同步和锁定所需的稳定 API(接口)契约。

## 非目标

- P0 不做完整 Asset Factory(资产工厂)。
- P0 不重做全部前台 UI(用户界面)。
- P0 不删除现有 Skill/Rule/Role/Scenario 表。
- P0 不强制迁移历史数据到统一 HubAsset(资产) 表，先做兼容映射。

## P0 第一批开发建议

1. 先定义统一资产 DTO(数据传输对象) 和导出契约，不急于物理表大迁移。
2. 在现有 Skill/Rule/RoleTemplate/ScenarioPackage 上补齐 checksum(校验和)、status(状态)、scope(作用域) 的兼容输出。
3. 新增 Manifest(安装清单) 标准导出层，保持现有 `/api/manifests/scenarios/[slug]` 可用。
4. 新增 `POST /api/hub/manifests/recommend`，先基于 projectFacts(项目事实) + profile(技术画像) 做规则推荐。
5. 新增 Agent Profile(智能体画像) 最小模型或配置表，并提供 export API(导出接口)。
6. 新增 install-records(安装记录) 与 runtime-feedback(运行反馈) 最小表和接口。
7. 将统一 ApiResponse(接口响应) 和 Error Code(错误码) 先应用到新增 `/api/hub/*` 接口。
8. 建立 Hub API contract tests(接口契约测试)，供 `br-ai-spec` 对接。

## 推荐实现路线

### P0-1 Hub API 统一响应与错误码

交付内容：

- 统一 `ApiResponse<T>`。
- 统一 `ApiErrorDetail`。
- Hub 资产错误码、Agent Profile 错误码、安装/反馈错误码。
- `requestId` 与 `timestamp` 统一注入。

验收口径：

- 新增 `/api/hub/*` 全部返回 `{ code, message, data, error, requestId, timestamp }`。
- 参数错误必须返回可枚举 `errorCode(错误码)`。
- 不改造旧 API 的返回结构，避免前台页面回归。

### P0-2 资产统一导出契约

交付内容：

- `src/lib/hub-asset-contract.ts`
- `src/lib/hub-asset-export.ts`
- 统一 `HubAssetExport(资产导出)` 类型。
- 从 Skill/Rule/RoleTemplate/ScenarioPackage 映射到统一导出对象。

验收口径：

- 输出 kind(类型)、slug(标识)、version(版本)、checksum(校验和)、dependencies(依赖)、compatibility(兼容性)、contentRef(内容引用)。
- 已发布资产不允许通过导出层被静默覆盖。
- 导出 payload(负载) 不包含目标项目源码或敏感配置。

### P0-3 Manifest 标准导出

交付内容：

- 标准 `GET /api/hub/manifests/:slug/export?version=...`。
- 兼容当前场景 manifest 构建器。
- Manifest 输出包含 manifest checksum、assets、agentProfiles、techProfiles、installPolicy。

验收口径：

- `br-ai-spec sync --manifest <url>` 可消费。
- `roles/skills/rules/flows` 标识与 `br-ai-spec` registry(注册表)兼容。
- 缺资产时返回 `MANIFEST_ASSET_MISSING`。

### P0-4 Manifest 推荐接口

交付内容：

- `POST /api/hub/manifests/recommend`
- 输入 `WorkspaceTopology(工作区拓扑)` 或 projectFacts(项目事实)。
- 输出推荐列表、置信度、理由和需要确认项。

第一批推荐规则：

- Next.js / React -> React 标准交付 manifest。
- Vue + Vite -> Vue 标准交付 manifest。
- Node tooling(节点工具链) -> CLI/工具链 manifest。
- 低置信度返回 no-auto-install(禁止自动安装)。

验收口径：

- confidence(置信度) 低于 60 不返回自动安装建议。
- 每条推荐包含 reasons(原因)。
- 支持多 package(包) 推荐。

### P0-5 Agent Profile 最小资产

交付内容：

- `AgentProfile` 兼容模型或 JSON 配置表。
- `GET /api/hub/agent-profiles/:slug/export?version=...`
- 输出 defaultExecutor(默认执行器)、fallbackExecutors(后备执行器)、allowedTools(允许工具)、deniedTools(禁用工具)、approvalPolicy(审批策略)、riskLevel(风险等级)、outputContract(输出契约)。

验收口径：

- 默认禁止 upload-source(上传源码)。
- 默认 beforePush 为 true。
- Manifest 可引用 Agent Profile。
- `br-ai-spec` 可缓存 Agent Profile checksum。

### P0-6 安装记录与运行反馈

交付内容：

- `POST /api/hub/install-records`
- `POST /api/hub/runtime-feedback`
- 最小数据表或现有表扩展：installationId、projectHash、manifestSlug、manifestVersion、assetVersions、status、durationMs、failureCategory。

验收口径：

- 不接收源码、完整 prompt、完整 response、绝对路径、用户名。
- 可按 manifest、asset、profile 聚合成功率。
- `br-ai-spec hub runtime-report` 可对接。

### P0-7 资产不可变与 checksum

交付内容：

- checksum 计算工具。
- 发布版本写入 checksum。
- 发布后正文更新阻断或强制新版本。
- 导出接口使用 checksum。

验收口径：

- published(已发布) 版本不可直接覆盖。
- 修改已发布资产返回 `ASSET_IMMUTABLE`。
- checksum mismatch(校验和不一致) 返回 `ASSET_CHECKSUM_MISMATCH`。

### P0-8 契约测试

交付内容：

- Manifest 推荐 API 测试。
- Manifest 导出 API 测试。
- Agent Profile 导出 API 测试。
- Install Record / Runtime Feedback 测试。
- 与 `br-ai-spec` registry(注册表)样例的兼容测试。

验收口径：

- 不依赖真实用户项目。
- 所有错误断言 `errorCode(错误码)`。
- 所有上报测试断言隐私字段未出现。

## 数据模型建议

P0 不建议直接替换现有表。建议先新增以下轻量表或兼容视图：

```text
hub_manifest
hub_manifest_version
hub_manifest_asset
hub_agent_profile
hub_agent_profile_version
hub_install_record
hub_runtime_feedback
```

P1 再引入：

```text
hub_asset
hub_asset_version
tech_profile
source_pack
source_pack_item
audit_ticket
audit_log
```

P3 再引入：

```text
asset_generation_job
asset_generation_item
asset_quality_check
llm_provider_config
```

## 与其他项目依赖顺序

1. 先交付 Manifest Export(清单导出) 与 Recommend(推荐)。
2. `br-ai-spec` 接入 `init --recommend` 与 `sync` 新契约。
3. Hub 接收 `br-ai-spec` 安装记录和运行反馈。
4. `br-ai-spec-visual` 再读取 Hub 汇总指标，展示团队治理报表。

## 主要风险

1. 统一资产模型会冲击现有页面查询和后台编辑，P0 必须采用兼容映射。
2. Agent 与 Agent Profile 命名冲突，建议明确 `Agent` 是调用主体，`AgentProfile` 是执行策略资产。
3. Manifest 推荐需要 `br-ai-spec` 扫描输出稳定，否则推荐输入会反复变化。
4. 安装记录和运行反馈涉及隐私，服务端必须拒绝源码、绝对路径和 raw prompt(原始提示词)。

