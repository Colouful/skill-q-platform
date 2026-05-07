# P5 Asset Hub 模型映射说明

执行时间：2026-05-07

目标仓库：`skill-q-platform`

## 结论

P5 不重建 Asset Hub(资产中心)数据底座，继续复用现有 `HubAsset`、`HubAssetVersion`、`HubManifest`、`HubAgentProfile`、`HubInstallRecord`、`HubRuntimeFeedback` 等模型与 repository(仓储)接口，在服务层补齐 br-ai-spec(本地执行引擎)需要的资产包、搜索、回滚、继承和质量反馈能力。

## 现有模型映射

| P5 能力 | 复用模型 / 模块 | 本轮处理 |
| --- | --- | --- |
| 统一 Asset 基础模型 | `HubAsset`、`HubAssetVersion`、`src/server/hub/types.ts` | 扩展类型枚举，支持 `workflow`、`hook`、`command`、`prompt-template`，保留既有 `flow`、`agent-profile` 兼容 |
| 资产状态 | `HubStatus`、`AssetVersionService` | 内部继续使用既有 `published`，对 br-ai-spec 外部接口兼容输出 `active` |
| 企业 / 团队 / 项目作用域 | `HubScope`、`HubAsset.scope` | 新增 `enterprise` 作用域，保留 `platform`、`department`、`team`、`project`、`personal` |
| version / checksum / compatibility | `HubAssetVersion` | 继续由 `AssetVersionService` 生成 checksum(校验和)，AssetPackage(资产包)接口直接复用 |
| AssetPackage | `AssetPackageService` | 新增只读元数据服务，不写目标项目文件 |
| Fork / Override / 继承 | `AssetInheritanceService` | 使用 `parentAssetId`、`overrideFields`、`metadata` 的兼容字段表达；禁止覆盖 checksum、content、status 等核心字段 |
| 质量反馈 | `AssetQualityService` | 接收结构化 AssetUsageFeedback(资产使用反馈)，计算 usageCount(使用次数)、successRate(成功率)、riskScore(风险分)、qualityScore(质量分) |

## Prisma 说明

当前仓库已有 Hub Prisma(数据库 ORM)模型与 V2.1/V2.2 migration(迁移)。本轮优先补服务层、API(接口)和测试，不新增破坏性 migration(迁移)，原因：

1. 既有模型已经覆盖 P5 主体字段：asset、version、manifest、agent profile、install record、runtime feedback、audit log。
2. 本轮新增字段采用 TypeScript(类型脚本)兼容字段和内存仓储表达，避免在 P5 一次性扩大数据库变更面。
3. 如果后续切 Prisma 持久化，需要追加字段：`parentAssetId`、`overrideFields`、`metadata`，并为 `scope` 增补 `enterprise` 兼容值；该变更应单独走 migration(迁移)评审。

## 安全边界

1. Hub 只返回资产包和元数据，不写 `.agents`、manifest(清单)、lock(锁文件) 或执行器文件。
2. 反馈接口复用隐私过滤，拒绝 `rawPrompt`、`sourceCode`、`fileContent`、绝对路径、密钥等敏感字段。
3. Override(覆盖) 禁止修改 checksum、content、status、publishedAt、source 等核心安全字段。
