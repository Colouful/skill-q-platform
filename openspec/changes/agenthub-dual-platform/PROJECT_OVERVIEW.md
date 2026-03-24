# AgentHub 双轨制扩展项目总览

> 📅 创建时间：2026-03-24  
> 🎯 状态：**Pending**（等待执行）  
> 📋 依赖：`agenthub-skill-platform` ✅ 已完成

---

## 🎯 项目目标

将 AgentHub 从单一 **Skill 平台** 扩展为 **Skill + Rules 双轨制平台**，满足用户分享和发现两类资源的需求：

| 资源类型 | 描述 | 示例 | 配色 |
|---------|------|------|------|
| **Skill** | 可执行的 Agent 代码包 | 自动化工具、浏览器脚本 | 🔵 蓝色系 |
| **Rule** | 决策规则包 | 风控策略、评分卡、流程模板 | 🟣 紫色系 |

---

## 📁 项目文件结构

```
openspec/changes/agenthub-dual-platform/
├── .openspec.yaml          ✅ 已创建 - OpenSpec 配置
├── proposal.md             ✅ 已完成 - 项目提案
├── design.md               ✅ 已完成 - 技术设计
├── tasks.md                ✅ 已创建 - 实施任务清单
└── PROJECT_OVERVIEW.md     ✅ 本文件 - 项目总览

specs/                      ✅ 已完成 - 功能规格说明
├── dual-navigation/
├── rule-category/
├── rule-fork/
├── rule-management/
├── rule-review/
├── rule-version/
└── unified-search/
```

---

## 📊 与已完成项目的关系

```
┌─────────────────────────────────────────────────────────┐
│              AgentHub 项目演进路线                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Phase 1: agenthub-skill-platform ✅ 已完成            │
│  └─ 单一 Skill 平台（15+ 分类、评测、Fork、版本管理）     │
│                                                         │
│  Phase 2: agenthub-dual-platform 📋 待执行             │
│  └─ 双轨制平台（Skill + Rule，独立分类，统一搜索）       │
│                                                         │
│  Future: 跨资源类型功能 🔮 规划中                       │
│  └─ Skill+Rule 组合包、依赖管理、推荐算法               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 快速开始（在 Cursor 中执行）

### 方式 1: 使用 OpenSpec 技能（推荐）

```bash
# 1. 打开 Cursor
cd /Users/admin/markView
cursor .

# 2. 使用 OpenSpec 技能
# 在 Cursor 聊天中输入：
/opsx apply agenthub-dual-platform

# 或直接执行：
npx openclaw-skill openspec-apply-change agenthub-dual-platform
```

### 方式 2: 手动执行任务

```bash
# 1. 查看任务清单
cat openspec/changes/agenthub-dual-platform/tasks.md

# 2. 按 Phase 逐个执行
# Phase 1: 数据库扩展
# Phase 2: Rule API 开发
# ...
```

---

## 📋 实施阶段总览

| Phase | 名称 | 预计时间 | 主要产出 |
|-------|------|---------|---------|
| **Phase 1** | 数据库扩展 | Day 1-2 | Rule 表、迁移、种子数据 |
| **Phase 2** | Rule 管理 API | Day 3-5 | CRUD、版本、评测 API |
| **Phase 3** | Rule 分类 API | Day 6 | 分类查询接口 |
| **Phase 4** | Rule 前端 | Day 7-10 | 列表、详情、上传、编辑页 |
| **Phase 5** | Rule 分类前端 | Day 11 | 分类页、导航 |
| **Phase 6** | 导航与搜索 | Day 12-13 | 双轨导航、统一搜索、榜单 |
| **Phase 7** | 视觉差异化 | Day 14 | 紫色系配色、专属图标 |
| **Phase 8** | 响应式适配 | Day 15 AM | 移动端、平板、桌面 |
| **Phase 9** | 测试优化 | Day 15 PM | 单元测试、E2E、性能 |
| **Phase 10** | 部署文档 | Day 16 | 生产部署、用户文档 |

**总计：** 16 天，200+ 任务

---

## 🎯 核心功能清单

### Rule 资源管理

- ✅ 上传 Rule（ZIP 包，包含 RULE.md + 规则文件）
- ✅ 浏览 Rule（列表、详情、分类）
- ✅ 搜索 Rule（统一搜索、类型筛选）
- ✅ 下载 Rule（版本选择、计数统计）
- ✅ Fork Rule（在线编辑、生成新版本）
- ✅ 评测 Rule（1-5 星评分、文字评测）

### 双轨导航

- ✅ 顶部导航栏：首页 | Skills | Rules
- ✅ 独立分类下拉菜单（Skill 15+、Rule 10+）
- ✅ 资源类型筛选（全部/Skill/Rule）
- ✅ 综合榜单（分类型展示）

### 视觉差异化

- ✅ Skill 蓝色系（#4ecdc4）
- ✅ Rule 紫色系（#c44cf3）
- ✅ 专属像素图标集
- ✅ 龙虾元素适配（拿代码 vs 拿规则书）

---

## 📈 成功标准

### 功能完整性

- [ ] 所有 200+ 任务完成
- [ ] 核心流程 E2E 测试通过
- [ ] 无严重 Bug

### 性能指标

- [ ] 页面加载 < 2s
- [ ] 交互响应 < 100ms
- [ ] 搜索 API < 500ms

### 用户体验

- [ ] 移动端完全可用
- [ ] 视觉风格一致（像素 + 龙虾）
- [ ] 无障碍标准达标

### 代码质量

- [ ] 单元测试覆盖率 > 80%
- [ ] 代码复用率 > 70%
- [ ] 无 ESLint 严重错误

---

## 🔧 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | Next.js 15 + React 19 + TypeScript |
| **样式** | TailwindCSS + 像素字体 + Framer Motion |
| **后端** | Next.js API Routes + Prisma ORM |
| **数据库** | MySQL (utf8mb3) |
| **测试** | Vitest + Playwright + React Testing Library |
| **部署** | Vercel / Docker |

---

## 📚 相关文档

### OpenSpec 文档

- [Proposal](./proposal.md) - 项目提案
- [Design](./design.md) - 技术设计
- [Tasks](./tasks.md) - 实施任务
- [.openspec.yaml](./.openspec.yaml) - 配置

### 已完成项目参考

- [agenthub-skill-platform/tasks.md](../agenthub-skill-platform/tasks.md) - 参考实现
- [agenthub-skill-platform/design.md](../agenthub-skill-platform/design.md) - 设计模式

### 外部文档

- [OpenSpec v2.0](../../../../docs/OPENSPEC_v2.md) - Rules 系统架构
- [Rules 使用指南](../../../../rules/README.md) - 规则系统说明

---

## 🆘 常见问题

### Q: 如何开始执行？

**A:** 在 Cursor 中打开项目，然后执行：
```bash
/opsx apply agenthub-dual-platform
```

### Q: 执行顺序是什么？

**A:** 按 Phase 顺序执行（1→10），每个 Phase 内任务可并行。

### Q: 遇到数据库迁移问题怎么办？

**A:** 先备份数据库，然后逐步执行：
```bash
prisma validate
prisma migrate dev --name add_rules_support
prisma generate
```

### Q: 如何验证功能正确？

**A:** 运行测试套件：
```bash
npm test           # 单元测试
npm run test:e2e   # E2E 测试
```

### Q: Skill 和 Rule 会冲突吗？

**A:** 不会。使用独立表存储，slug 加前缀区分（可选）。

---

## 📞 项目联系人

- **项目负责人：** 哞哞🐮
- **技术栈：** Next.js + Prisma + TailwindCSS
- **项目地址：** `/Users/admin/markView`

---

*准备好了吗？在 Cursor 中执行 `/opsx apply` 开始吧！* 🚀🦞💜
