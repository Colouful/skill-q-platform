# Technical Design: AgentHub 双轨制扩展 — Skill + Rules 双资源平台

## Context

AgentHub 需要从单一 Skill 平台扩展为双轨制平台（Skill + Rule）。设计基于已有的 `agenthub-skill-platform` 变更，在其基础上增加 Rule 轨，实现：
- 双资源类型并列（Skill 可执行代码包、Rule 决策规则包）
- 独立分类体系（Skill 15+ 分类、Rule 10+ 分类）
- 统一搜索与导航
- 差异化视觉（Skill 蓝、Rule 紫）

## Goals / Non-Goals

**Goals:**
- 实现完整的 Rule CRUD 功能（对称于 Skill）
- 扩展导航支持 Skill/Rule 切换
- 实现统一搜索（跨资源类型）
- 保持像素风格 + 龙虾元素一致性
- 复用 Skill 组件，降低开发成本

**Non-Goals:**
- Skill 和 Rule 的依赖关系管理
- Rule 可视化编辑器（仅文本编辑）
- 跨资源类型推荐算法

## Decisions

### 1. 数据模型设计

**方案选择**: 独立表 vs 单表加 type 字段

**决策**: 使用独立表（`skills` 和 `rules` 并列）

**理由**:
- Skill 和 Rule 文件结构差异大（index.ts vs JSON/YAML）
- 分类体系独立（Skill 15+ 分类、Rule 10+ 分类）
- 便于未来扩展（Skill 特有功能不影响 Rule）
- 查询性能更优（无需 type 过滤）

```prisma
// Skill 表（保留原有）
model Skill {
  id          String     @id @default(uuid())
  name        String     @db.VarChar(255)
  slug        String     @unique @db.VarChar(255)
  description String     @db.Text
  longDescription String? @db.Text
  author      String     @db.VarChar(100)
  categoryId  String
  category    Category   @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  downloads   Int        @default(0)
  rating      Float      @default(0)
  reviewCount Int        @default(0)
  isFeatured  Boolean    @default(false)
  tags        String[]
  versions    Version[]
  reviews     Review[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  
  @@map("skills")
  @@index([categoryId])
}

// Rule 表（新增，对称于 Skill）
model Rule {
  id          String     @id @default(uuid())
  name        String     @db.VarChar(255)
  slug        String     @unique @db.VarChar(255)
  description String     @db.Text
  longDescription String? @db.Text
  author      String     @db.VarChar(100)
  categoryId  String
  category    Category   @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  downloads   Int        @default(0)
  rating      Float      @default(0)
  reviewCount Int        @default(0)
  isFeatured  Boolean    @default(false)
  tags        String[]
  versions    RuleVersion[]
  reviews     Review[]   // 复用 Review 表，加 resourceType 字段
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  
  @@map("rules")
  @@index([categoryId])
}

// Category 表扩展（增加 resourceType 字段）
model Category {
  id           String   @id @default(uuid())
  name         String   @db.VarChar(50)
  slug         String   @unique @db.VarChar(50)
  description  String?  @db.Text
  icon         String?  @db.VarChar(255)
  resourceType String   @default("skill") @db.VarChar(20) // "skill" 或 "rule"
  sortOrder    Int      @default(0)
  skills       Skill[]
  rules        Rule[]   // 新增关联
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@map("categories")
  @@index([slug, resourceType])
}

// Version 表改名为 ResourceVersion 或保持独立
// 方案：保持独立（SkillVersion 和 RuleVersion）

model RuleVersion {
  id          String   @id @default(uuid())
  version     String   @db.VarChar(20)
  ruleId      String
  rule        Rule     @relation(fields: [ruleId], references: [id], onDelete: Cascade)
  changelog   String?  @db.Text
  files       Json     // 文件列表：[{name, path, content}]
  downloadUrl String?  @db.VarChar(500)
  isLatest    Boolean  @default(false)
  downloads   Int      @default(0)
  createdAt   DateTime @default(now())
  
  @@map("rule_versions")
  @@index([ruleId])
  @@unique([ruleId, version])
}

// Review 表扩展（增加 resourceType 和 resourceId）
model Review {
  id           String   @id @default(uuid())
  resourceType String   @default("skill") @db.VarChar(20) // "skill" 或 "rule"
  resourceId   String   // skillId 或 ruleId
  skillId      String?  // 兼容旧数据
  skill        Skill?   @relation(fields: [skillId], references: [id], onDelete: Cascade)
  ruleId       String?  // 新增
  rule         Rule?    @relation(fields: [ruleId], references: [id], onDelete: Cascade)
  rating       Int
  content      String   @db.Text
  author       String   @db.VarChar(100)
  isHelpful    Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@map("reviews")
  @@index([resourceType, resourceId])
}
```

### 2. API 设计（对称扩展）

```
┌─────────────────────────────────────────────────────────────────┐
│                    API Routes (新增 Rule 部分)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Rule 管理 (对称于 Skill)                                        │
│  ├── GET  /api/rules              列出所有 Rule（支持筛选）     │
│  ├── POST /api/rules              创建/上传 Rule               │
│  ├── GET  /api/rules/[slug]       获取 Rule 详情                │
│  ├── POST /api/rules/[slug]       更新 Rule 元数据              │
│  ├── POST /api/rules/[slug]/delete 删除 Rule                   │
│  └── POST /api/rules/[slug]/fork  Fork Rule（创建新版本）      │
│                                                                 │
│  Rule 分类管理                                                  │
│  ├── GET  /api/rule-categories    列出所有 Rule 分类           │
│  ├── GET  /api/rule-categories/[slug] 获取分类下 Rule 列表     │
│                                                                 │
│  Rule 版本管理                                                  │
│  ├── GET  /api/rules/[slug]/versions     列出所有版本          │
│  ├── GET  /api/rules/[slug]/versions/[ver] 获取版本详情        │
│  ├── POST /api/rules/[slug]/versions     创建新版本            │
│  └── POST /api/rules/[slug]/versions/[ver]/download 下载版本   │
│                                                                 │
│  Rule 评测系统                                                  │
│  ├── GET  /api/rules/[slug]/reviews      列出评测              │
│  ├── POST /api/rules/[slug]/reviews      创建评测              │
│  └── POST /api/reviews/[id]              更新评测              │
│                                                                 │
│  统一搜索（扩展）                                               │
│  ├── GET  /api/search?q=xxx&type=all     搜索全部              │
│  ├── GET  /api/search?q=xxx&type=skill   仅搜索 Skill          │
│  └── GET  /api/search?q=xxx&type=rule    仅搜索 Rule           │
│                                                                 │
│  综合榜单（新增）                                               │
│  ├── GET  /api/trending?type=all         综合热门              │
│  ├── GET  /api/trending?type=skill       Skill 热门            │
│  └── GET  /api/trending?type=rule        Rule 热门             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3. 前端架构扩展

```
app/
├── layout.tsx                    # 根布局（扩展导航）
├── page.tsx                      # 首页（增加 Rule 推荐区域）
├── skills/                       # Skill 相关页面（保留）
│   └── ...
├── rules/                        # Rule 相关页面（新增）
│   ├── page.tsx                  # Rule 列表页
│   ├── upload/page.tsx           # 上传 Rule 页
│   └── [slug]/
│       ├── page.tsx              # Rule 详情页
│       ├── edit/page.tsx         # 编辑 Rule 页
│       └── versions/
│           └── [ver]/page.tsx    # Rule 版本详情
├── categories/                   # 分类页（扩展支持 Rule）
│   ├── skills/[slug]/page.tsx    # Skill 分类页（保留）
│   └── rules/[slug]/page.tsx     # Rule 分类页（新增）
├── search/                       # 搜索页（扩展）
│   └── page.tsx                  # 支持类型筛选
└── api/
    ├── skills/                   # Skill API（保留）
    ├── rules/                    # Rule API（新增）
    └── search/                   # 统一搜索 API（扩展）

components/
├── pixel/                        # 像素组件（复用）
├── lobster/                      # 龙虾组件（复用）
├── skills/                       # Skill 组件（保留）
├── rules/                        # Rule 组件（新增，对称于 skills）
│   ├── RuleCard.tsx              # Rule 卡片（紫色系）
│   ├── RuleList.tsx              # Rule 列表
│   ├── RuleUpload.tsx            # Rule 上传表单
│   └── RuleEditor.tsx            # Rule 在线编辑器
└── common/                       # 通用组件（扩展）
    ├── ResourceTabs.tsx          # Skill/Rule 切换标签
    ├── ResourceTypeFilter.tsx    # 资源类型筛选
    └── UnifiedSearchBar.tsx      # 统一搜索栏
```

### 4. 导航设计

**顶部导航栏结构**:
```
┌─────────────────────────────────────────────────────────────────┐
│  🦞 AgentHub    首页    Skills ▼    Rules ▼    🔍 [搜索框]      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Skills 下拉菜单：                          Rules 下拉菜单：     │
│  - 全部 Skill                             - 全部 Rule          │
│  - 开发辅助                               - 规则集             │
│  - 办公与效率                             - 决策表             │
│  - 自媒体                                 - 评分卡             │
│  - IT/互联网                              - 流程模板           │
│  - ... (15+ 分类)                          - ... (10+ 分类)      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**路由规则**:
- `/skills` - Skill 列表页
- `/rules` - Rule 列表页
- `/skills/[slug]` - Skill 详情页
- `/rules/[slug]` - Rule 详情页
- `/categories/skills/[slug]` - Skill 分类页
- `/categories/rules/[slug]` - Rule 分类页

### 5. 视觉设计（双轨差异化）

**配色体系**:
```css
:root {
  /* Skill 轨 - 蓝色系 */
  --skill-primary: #4ecdc4;        /* 像素蓝 */
  --skill-hover: #3db9b0;
  --skill-light: #e0f7fa;
  
  /* Rule 轨 - 紫色系 */
  --rule-primary: #c44cf3;         /* 像素紫 */
  --rule-hover: #b03ae0;
  --rule-light: #f3e5f5;
  
  /* 通用色（保留） */
  --gameboy-green: #0f380f;
  --lobster-red: #e74c3c;
  --pixel-pink: #ff6b9d;
  --pixel-yellow: #ffe66d;
}
```

**组件差异化**:
| 组件 | Skill | Rule |
|------|-------|------|
| 卡片边框 | 蓝色 | 紫色 |
| 卡片图标 | 蓝色系像素图标 | 紫色系像素图标 |
| 标签背景 | `bg-skill-light` | `bg-rule-light` |
| 按钮主色 | `bg-skill-primary` | `bg-rule-primary` |
| 评分图标 | 蓝色龙虾钳子 | 紫色龙虾钳子 |

**龙虾元素适配**:
- Skill 页面：龙虾拿代码符号
- Rule 页面：龙虾拿文档/规则书
- 通用场景：中性龙虾（无道具）

### 6. Rule 文件结构设计

**上传的 Rule 包结构**:
```
my-rule/
├── RULE.md               # 必需：Rule 元数据（YAML frontmatter + 描述）
├── rules.json            # 必需：规则定义（JSON/YAML）
├── package.json          # 可选：依赖声明
├── README.md             # 可选：详细文档
└── tests/                # 可选：测试文件
```

**RULE.md 格式**:
```markdown
---
name: risk-control-rules
description: 风控决策规则包
version: 1.0.0
author: Your Name
category: decision-tables
tags: [risk-control, finance, decision]
license: MIT
---

## 规则说明

详细说明 Rule 的功能和应用场景...

## 规则列表

1. 规则 1：...
2. 规则 2：...

## 使用示例

```json
{
  "input": {...},
  "output": {...}
}
```
```

### 7. 统一搜索设计

**搜索 API**:
```typescript
// GET /api/search?q=xxx&type=all|skill|rule
interface SearchRequest {
  q: string;       // 关键词
  type: string;    // 'all' | 'skill' | 'rule'
  category?: string;
  page?: number;
  pageSize?: number;
}

interface SearchResponse {
  skills: {
    total: number;
    list: SkillSummary[];
  };
  rules: {
    total: number;
    list: RuleSummary[];
  };
}
```

**搜索 UI**:
```
┌─────────────────────────────────────────────────────────────────┐
│  🔍 搜索框：[输入关键词...]  [类型：全部 ▼]  [搜索按钮]          │
├─────────────────────────────────────────────────────────────────┤
│  筛选：                                                         │
│  ☑ Skill  ☑ Rule                                               │
│                                                                 │
│  结果：                                                         │
│  ─────────────────────────────────────────────────────────────  │
│  Skills (15)                                                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ Skill 卡片 1│ │ Skill 卡片 2│ │ Skill 卡片 3│               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
│                                                                 │
│  Rules (8)                                                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ Rule 卡片 1 │ │ Rule 卡片 2 │ │ Rule 卡片 3 │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| **代码复用率低** | 中 | 提取通用组件（ResourceCard、ResourceList），通过 props 区分类型 |
| **数据库迁移复杂** | 中 | 分步迁移：先加 Rule 表，再加 Review 扩展，最后迁移旧数据 |
| **导航复杂度增加** | 低 | 保持 Skill/Rule 对称结构，用户易理解 |
| **搜索性能下降** | 中 | 使用全文索引，分页加载，缓存热门搜索 |
| **视觉混淆** | 低 | 严格区分 Skill 蓝/Rule 紫配色，添加类型标签 |

## Migration Plan

```
Phase 1: 数据库扩展（Day 1-2）
├── 编写扩展 Prisma Schema（Rule 表、扩展 Category、Review）
├── 执行数据库迁移
├── 创建 Rule 分类种子数据（10+ 分类）
└── 测试数据库查询

Phase 2: Rule API 开发（Day 3-5）
├── Rule CRUD API（对称于 Skill）
├── Rule 版本管理 API
├── Rule 评测 API
└── 统一搜索 API 扩展

Phase 3: Rule 前端页面（Day 6-9）
├── Rule 列表页（复用 Skill 列表，改紫色系）
├── Rule 详情页
├── Rule 上传页
├── Rule 编辑页（复用编辑器）
└── Rule 分类页

Phase 4: 导航与搜索扩展（Day 10-11）
├── 顶部导航栏增加 Rules 入口
├── 统一搜索栏（支持类型筛选）
├── 综合榜单页
└── 资源类型筛选组件

Phase 5: 视觉差异化（Day 12-13）
├── Rule 紫色系配色
├── Rule 专属像素图标
├── 龙虾 Rule 元素（拿规则书）
└── 响应式适配

Phase 6: 测试与优化（Day 14-15）
├── E2E 测试（Skill + Rule 全流程）
├── 性能优化（搜索、列表）
└── 部署上线
```

## Open Questions

1. **Rule 文件格式**: JSON vs YAML vs 自定义 DSL？
   - MVP: JSON（易解析），后续支持 YAML

2. **Rule 分类是否独立**: 独立表 vs 复用 Category 加 type？
   - 决策：复用 Category 加 `resourceType` 字段（减少表数量）

3. **Review 表如何兼容**: 新增 ruleId 字段 vs 独立 RuleReview 表？
   - 决策：扩展 Review 表，加 `resourceType` 和 `resourceId` 字段

4. **Skill 和 Rule 是否允许同名**: 
   - 决策：允许（slug 加前缀区分：`skill-xxx`、`rule-xxx`）

5. **是否支持 Skill+Rule 组合包**:
   - MVP: 不支持，后续迭代
