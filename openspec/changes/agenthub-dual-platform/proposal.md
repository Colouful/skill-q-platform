# Proposal: AgentHub 双轨制扩展 — Skill + Rules 双资源平台

## Why

当前 AgentHub 设计仅支持 Skill 单一资源类型，但 OpenClaw 生态中还有大量决策规则资源（规则集、决策表、评分卡、流程模板等）。用户需要一个统一平台来分享和发现这两类资源。参考 xiaping.coze.site 的 Skill 单轨模式，本变更扩展为双轨制平台：
- **Skill 轨**：可执行的 Agent 代码包（自动化、工具类）
- **Rule 轨**：决策规则包（业务规则、风控策略、评分模型）

双轨制满足更广泛的 OpenClaw 用户需求，打造完整的 Agent 资源生态。

## What Changes

- **新增 Rule 实体**：与 Skill 并列的第二类资源，支持上传、浏览、搜索、下载
- **双分类体系**：Skill 分类（15+）和 Rule 分类（10+）独立管理
- **双轨导航**：顶部导航栏增加「Rules」入口，与「Skills」并列
- **统一搜索**：支持跨 Skill 和 Rule 的全局搜索，支持按资源类型筛选
- **独立评测**：Skill 和 Rule 各自维护独立评测和评分
- **Fork 编辑**：支持在线编辑 Rule，生成新版本（不影响原始内容）
- **双榜单**：Skill 热门榜和 Rule 热门榜分别展示
- **差异化 UI**：Skill 使用蓝色系、Rule 使用紫色系视觉区分

## Capabilities

### New Capabilities

- `rule-management`: Rule CRUD 能力，包括上传、详情、编辑、删除、下载
- `rule-category-management`: Rule 分类浏览能力，支持 10+ 预定义分类（规则集、决策表、评分卡、流程模板等）
- `rule-version-management`: Rule 版本管理能力，支持多版本查看、下载指定版本
- `rule-review-system`: Rule 评测系统能力，支持评分（1-5 星）、文字评测
- `rule-fork-editing`: Rule Fork 编辑能力，支持在线编辑他人 Rule 并生成新版本
- `unified-search`: 统一搜索能力，支持跨 Skill 和 Rule 的全局搜索、类型筛选
- `dual-navigation`: 双轨导航能力，顶部导航栏 Skill/Rules 切换
- `resource-type-filter`: 资源类型筛选能力，列表页支持按 Skill/Rule 筛选

### Modified Capabilities

- `search-discovery`: 扩展搜索范围，从仅搜索 Skill 改为搜索 Skill + Rule
- `category-management`: 扩展为双分类体系，Skill 分类和 Rule 分类独立管理

## Impact

- **数据库**: 新增 `rules` 表（与 `skills` 表并列），新增 `rule_categories` 表（或复用 categories 加 type 字段）
- **API**: 新增 20+ 个 Rule 相关接口（与 Skill 接口对称）
- **前端**: 新增 10+ 个 Rule 页面组件，复用 Skill 组件但使用紫色系配色
- **导航**: 顶部导航栏增加「Rules」入口
- **搜索**: 搜索 API 和 UI 需支持资源类型筛选
- **技能依赖**: 复用现有技能，新增 `rule-validator`（Rule 包验证）
- **后续影响**: 为跨资源类型推荐、Skill+Rule 组合包等功能预留扩展点

## Non-Goals（本次不做）

- Skill 和 Rule 的依赖关系管理（后续迭代）
- Skill+Rule 组合包（后续迭代）
- 跨资源类型推荐算法（后续迭代）
- Rule 可视化编辑器（仅文本编辑，后续迭代）
- Rule 测试与验证工具（后续迭代）

## Impact on Existing Change

**原变更**: `agenthub-skill-platform`
- **保留**: 所有 Skill 相关功能、API、页面
- **扩展**: 搜索、导航、分类系统支持双轨
- **新增**: Rule 相关功能（对称于 Skill）

**关系**: `agenthub-dual-platform` 依赖于 `agenthub-skill-platform`，在其基础上扩展 Rule 轨。

## Success Criteria

- ✅ 用户可上传 Rule（包含 RULE.md + 规则定义文件）
- ✅ 用户可浏览、搜索、下载他人 Rule
- ✅ 用户可 Fork 他人 Rule 并在线编辑生成新版本
- ✅ 用户可对 Rule 评分（1-5 星）和写评测
- ✅ 顶部导航栏显示「首页」「Skills」「Rules」
- ✅ 全局搜索支持按资源类型（Skill/Rule）筛选
- ✅ Skill 和 Rule 使用不同配色（蓝/紫）视觉区分
- ✅ Rule 页面呈现完整像素风格（与 Skill 一致）
- ✅ 龙虾元素贯穿全站（Skill/Rule 通用）
- ✅ 页面加载时间 < 2s，交互响应时间 < 100ms
- ✅ 移动端（375px 宽度）完全可用
