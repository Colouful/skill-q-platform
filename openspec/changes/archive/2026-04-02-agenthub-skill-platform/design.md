# Technical Design: AgentHub — 像素风格龙虾主题 Skill 分享平台

## Context

AgentHub 是一个像素风格 + 龙虾主题的 OpenClaw Agent Skill 分享平台，类似 xiaping.coze.site。项目基于已有的 markView 代码库改造，从「项目 - 分类 - 文档」三级结构转为「Skill- 分类 - 版本 - 评测」四级结构。设计需遵循：
- Next.js 15 App Router 架构
- 仅 GET/POST 的 HTTP 约定
- PostgreSQL + Prisma ORM
- 像素风格设计（复古游戏机 + 龙虾元素）

## Goals / Non-Goals

**Goals:**
- 实现完整的四级数据模型与 CRUD 操作
- 构建像素风格 UI，龙虾元素贯穿全站
- 支持 Skill 上传、下载、Fork 编辑、评分评测
- 响应式设计，移动优先
- 统一的 API 响应格式与错误处理

**Non-Goals:**
- 多用户认证与权限系统（MVP 简化版）
- Skill 依赖管理与自动安装
- 付费 Skill 与支付系统
- 移动端原生 App

## Decisions

### 1. 技术栈选择

| 层级 | 选择 | 理由 | 备选方案 |
|------|------|------|----------|
| **框架** | Next.js 15 App Router | 服务端渲染、路由约定、API Routes 一体化 | Vite + Express |
| **语言** | TypeScript | 类型安全、开发体验、Prisma 集成 | JavaScript |
| **数据库** | PostgreSQL | 成熟稳定、JSONB 支持、扩展性强 | MySQL、SQLite |
| **ORM** | Prisma | 类型安全、迁移管理、开发体验 | Drizzle、TypeORM |
| **UI 库** | Tailwind CSS + 自定义像素组件 | 高度可定制、像素风格实现灵活 | shadcn/ui（需大幅修改） |
| **像素字体** | Press Start 2P + VT323 | 经典像素字体，Google Fonts 免费 | Perfect DOS VGA 437 |
| **Sprite 动画** | CSS Sprite + keyframes | 轻量、无需额外库 | JavaScript 动画库 |
| **文件处理** | JSZip + FileSaver | 前端打包下载、简单易用 | 后端打包 |

### 2. 数据模型设计

```prisma
// Prisma Schema (utf8mb3 字符集)
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Category {
  id          String   @id @default(uuid())
  name        String   @unique @db.VarChar(50)  // 分类名：开发辅助、办公效率等
  slug        String   @unique @db.VarChar(50)  // URL 友好：dev-tools、productivity
  description String?  @db.Text
  icon        String?  @db.VarChar(255)  // 像素图标类名
  sortOrder   Int      @default(0)
  skills      Skill[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("categories")
  @@index([slug])
}

model Skill {
  id          String     @id @default(uuid())
  name        String     @db.VarChar(255)  // Skill 名称
  slug        String     @unique @db.VarChar(255)  // URL 友好
  description String     @db.Text  // 简短描述
  longDescription String? @db.Text  // 详细描述（Markdown）
  author      String     @db.VarChar(100)  // 作者名
  categoryId  String
  category    Category   @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  downloads   Int        @default(0)  // 下载次数
  rating      Float      @default(0)  // 平均评分（1-5）
  reviewCount Int        @default(0)  // 评测数量
  isFeatured  Boolean    @default(false)  // 是否推荐
  tags        String[]   // 标签数组
  versions    Version[]
  reviews     Review[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  
  @@map("skills")
  @@index([categoryId])
  @@index([slug])
  @@index([downloads])
  @@index([rating])
}

model Version {
  id          String   @id @default(uuid())
  version     String   @db.VarChar(20)  // 语义化版本：1.0.0, 1.2.3
  skillId     String
  skill       Skill    @relation(fields: [skillId], references: [id], onDelete: Cascade)
  changelog   String?  @db.Text  // 更新日志（Markdown）
  files       Json     // 文件列表：[{name, path, content}]
  downloadUrl String?  @db.VarChar(500)  // 下载链接（如存储到对象存储）
  isLatest    Boolean  @default(false)  // 是否最新版
  downloads   Int      @default(0)  // 该版本下载次数
  createdAt   DateTime @default(now())
  
  @@map("versions")
  @@index([skillId])
  @@unique([skillId, version])  // 同一 Skill 下版本唯一
}

model Review {
  id        String   @id @default(uuid())
  skillId   String
  skill     Skill    @relation(fields: [skillId], references: [id], onDelete: Cascade)
  rating    Int      // 1-5 星
  content   String   @db.Text  // 评测内容
  author    String   @db.VarChar(100)  // 评测作者（MVP 简化）
  isHelpful Int      @default(0)  // 有帮助票数
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("reviews")
  @@index([skillId])
}
```

### 3. API 设计（仅 GET/POST）

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Routes                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Skill 管理                                                     │
│  ├── GET  /api/skills              列出所有 Skill（支持筛选）   │
│  ├── POST /api/skills              创建/上传 Skill             │
│  ├── GET  /api/skills/[slug]       获取 Skill 详情              │
│  ├── POST /api/skills/[slug]       更新 Skill 元数据            │
│  ├── POST /api/skills/[slug]/delete 删除 Skill                 │
│  └── POST /api/skills/[slug]/fork  Fork Skill（创建新版本）    │
│                                                                 │
│  分类管理                                                       │
│  ├── GET  /api/categories          列出所有分类                │
│  ├── GET  /api/categories/[slug]   获取分类下 Skill 列表        │
│                                                                 │
│  版本管理                                                       │
│  ├── GET  /api/skills/[slug]/versions     列出所有版本         │
│  ├── GET  /api/skills/[slug]/versions/[ver] 获取版本详情       │
│  ├── POST /api/skills/[slug]/versions     创建新版本           │
│  └── POST /api/skills/[slug]/versions/[ver]/download 下载版本  │
│                                                                 │
│  评测系统                                                       │
│  ├── GET  /api/skills/[slug]/reviews      列出评测             │
│  ├── POST /api/skills/[slug]/reviews      创建评测             │
│  ├── POST /api/reviews/[id]               更新评测             │
│  └── POST /api/reviews/[id]/helpful       标记有帮助            │
│                                                                 │
│  搜索与发现                                                     │
│  ├── GET  /api/search?q=xxx          搜索 Skill                │
│  ├── GET  /api/trending              热门榜单（下载量）        │
│  ├── GET  /api/top-rated             高分榜单（评分）          │
│  └── GET  /api/new                   最新上架                  │
│                                                                 │
│  文件上传下载                                                   │
│  └── POST /api/upload                上传 Skill 包（ZIP）       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**统一响应格式:**
```typescript
interface ApiResponse<T> {
  code: number;      // 0=成功，非 0=错误
  message: string;   // 提示信息
  data: T;           // 业务数据
}
```

### 4. 前端架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend Structure                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  app/                                                           │
│  ├── layout.tsx              根布局（像素导航、Footer）         │
│  ├── page.tsx                首页（热门 Skill、龙虾吉祥物）     │
│  ├── skills/                                                │
│  │   ├── page.tsx            Skill 列表页（筛选、搜索）         │
│  │   ├── upload/page.tsx     上传 Skill 页                       │
│  │   └── [slug]/                                          │
│  │       ├── page.tsx        Skill 详情页                        │
│  │       ├── edit/page.tsx   编辑 Skill 页                       │
│  │       └── versions/                                      │
│  │           └── [ver]/                                       │
│  │               └── page.tsx  版本详情页                       │
│  ├── categories/                                            │
│  │   └── [slug]/                                          │
│  │       └── page.tsx        分类页                            │
│  ├── reviews/                                               │
│  │   └── [skillSlug]/                                       │
│  │       └── page.tsx        评测列表页                        │
│  └── api/                    API Routes（见上文）               │
│                                                                 │
│  components/                                                    │
│  ├── pixel/                  像素风格组件                       │
│  │   ├── PixelCard.tsx       像素卡片                          │
│  │   ├── PixelButton.tsx     像素按钮                          │
│  │   ├── PixelBorder.tsx     像素边框                          │
│  │   ├── PixelIcon.tsx       像素图标                          │
│  │   └── PixelFont.tsx       像素字体包装器                    │
│  ├── lobster/                龙虾元素组件                       │
│  │   ├── LobsterMascot.tsx   龙虾吉祥物                        │
│  │   ├── LobsterLoading.tsx  龙虾加载动画                      │
│  │   ├── LobsterEmpty.tsx    龙虾空状态                        │
│  │   └── LobsterSuccess.tsx  龙虾成功提示                      │
│  ├── skills/                 Skill 相关组件                      │
│  │   ├── SkillCard.tsx       Skill 卡片                          │
│  │   ├── SkillList.tsx       Skill 列表                          │
│  │   ├── SkillUpload.tsx     Skill 上传表单                      │
│  │   └── SkillEditor.tsx     Skill 在线编辑器                    │
│  ├── reviews/                评测组件                          │
│  │   ├── StarRating.tsx      星级评分                          │
│  │   ├── ReviewForm.tsx      评测表单                          │
│  │   └── ReviewList.tsx      评测列表                          │
│  └── common/                 通用组件                          │
│      ├── SearchBar.tsx       搜索栏                            │
│      ├── CategoryFilter.tsx  分类筛选                          │
│      └── Pagination.tsx      分页（像素风格）                  │
│                                                                 │
│  lib/                                                           │
│  ├── api.ts                  API 请求封装                       │
│  ├── utils.ts                工具函数                           │
│  ├── validations.ts          Zod 表单验证                       │
│  └── pixel-constants.ts      像素风格常量（配色、字体、尺寸）   │
│                                                                 │
│  styles/                                                        │
│  ├── globals.css             全局样式（像素字体引入）           │
│  ├── pixel-variables.css     像素风格 CSS 变量                  │
│  └── animations.css          像素动画（Sprite keyframes）       │
│                                                                 │
│  public/                                                        │
│  ├── fonts/                  像素字体文件                       │
│  ├── sprites/                龙虾 Sprite 图                      │
│  └── icons/                  像素图标集                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5. 像素风格设计系统

**配色方案:**
```css
:root {
  /* 主色 - 复古游戏机风格 */
  --gameboy-green: #0f380f;      /* GameBoy 深绿 */
  --gameboy-light: #8bac0f;      /* GameBoy 浅绿 */
  --lobster-red: #e74c3c;        /* 龙虾红 */
  
  /* 像素辅助色 */
  --pixel-pink: #ff6b9d;         /* 像素粉 */
  --pixel-blue: #4ecdc4;         /* 像素蓝 */
  --pixel-yellow: #ffe66d;       /* 像素黄 */
  --pixel-purple: #c44cf3;       /* 像素紫 */
  
  /* 中性色 */
  --bg-cream: #f7f3e8;           /* 米白背景 */
  --text-dark: #2c3e50;          /* 深灰文字 */
  --border-dark: #34495e;        /* 边框色 */
}
```

**像素字体:**
```css
@font-face {
  font-family: 'Press Start 2P';
  src: url('/fonts/PressStart2P-Regular.ttf') format('truetype');
}

@font-face {
  font-family: 'VT323';
  src: url('/fonts/VT323-Regular.ttf') format('truetype');
}

.pixel-title {
  font-family: 'Press Start 2P', cursive;
  font-size: 16px;  /* 实际显示较大，像素字体特性 */
  line-height: 1.5;
}

.pixel-body {
  font-family: 'VT323', monospace;
  font-size: 20px;
  line-height: 1.4;
}
```

**像素边框实现:**
```css
.pixel-border {
  position: relative;
  background: #fff;
  box-shadow: 
    -4px 0 0 0 #000,
    4px 0 0 0 #000,
    0 -4px 0 0 #000,
    0 4px 0 0 #000;
  margin: 4px;
}

/* 或使用 SVG 像素边框 */
.pixel-border-svg {
  border: none;
  background-image: url('/sprites/pixel-border.svg');
  background-size: stretch;
}
```

**Sprite 动画:**
```css
@keyframes lobster-walk {
  0% { background-position: 0 0; }
  25% { background-position: -32px 0; }
  50% { background-position: -64px 0; }
  75% { background-position: -96px 0; }
  100% { background-position: 0 0; }
}

.lobster-loading {
  width: 32px;
  height: 32px;
  background-image: url('/sprites/lobster-walk.png');
  background-size: 128px 32px;  /* 4 帧 */
  animation: lobster-walk 0.8s steps(4) infinite;
}
```

### 6. 龙虾元素应用场景

| 场景 | 龙虾元素 | 实现方式 |
|------|----------|----------|
| **首页** | 大龙虾吉祥物欢迎 | SVG 像素龙虾 + 动画 |
| **加载状态** | 龙虾走路动画 | CSS Sprite 帧动画 |
| **空状态** | 龙虾"空空如也"插画 | 像素插画 + 文字 |
| **成功提示** | 龙虾举旗庆祝 | 动画 + Toast |
| **错误提示** | 龙虾困惑表情 | 动画 + 错误信息 |
| **404 页面** | 龙虾迷路插画 | 像素场景插画 |
| **分页器** | 龙虾脚印装饰 | 像素图标 |
| **评分星星** | 龙虾钳子代替星星 | 自定义 SVG 图标 |

### 7. Skill 文件结构设计

**上传的 Skill 包结构:**
```
my-skill/
├── SKILL.md              # 必需：Skill 元数据（YAML frontmatter + 描述）
├── index.ts              # 必需：Skill 入口文件
├── package.json          # 可选：依赖声明
├── README.md             # 可选：详细文档
├── assets/               # 可选：图片等资源
└── tests/                # 可选：测试文件
```

**SKILL.md 格式:**
```markdown
---
name: my-awesome-skill
description: 我的超棒 Skill
version: 1.0.0
author: Your Name
category: dev-tools
tags: [productivity, ai, automation]
license: MIT
---

## 功能描述

详细说明 Skill 的功能...

## 使用方法

```typescript
// 使用示例
```

## 依赖

- 依赖 1
- 依赖 2
```

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| **像素风格实现复杂度** | 高 | 使用 Tailwind 自定义 + 预制组件库，不重复造轮子 |
| **龙虾素材绘制** | 中 | 使用 AI 生成像素图 + 手动调整，或找设计师合作 |
| **文件上传安全性** | 中 | 限制文件类型/大小，服务端校验，沙箱解压 |
| **Skill 恶意代码** | 高 | 安全审计工具（agent-skills-tools），用户举报机制 |
| **性能问题（大量 Skill）** | 中 | 分页加载、图片懒加载、CDN 加速 |
| **无多用户认证** | 低 | 明确标注为 MVP 限制，后续迭代补充 |

## Migration Plan

```
Phase 1: 基础设施（Day 1-2）
├── 改造 Next.js 项目结构（从 markView 转为 AgentHub）
├── 配置像素字体与样式变量
├── 安装 Prisma + PostgreSQL
├── 创建基础布局组件（像素导航、Footer）
└── 准备龙虾 Sprite 素材

Phase 2: 数据层（Day 3-4）
├── 编写 Prisma Schema（Skill/Category/Version/Review）
├── 执行数据库迁移
├── 创建种子数据（15+ 分类、示例 Skill）
└── 测试 API 接口

Phase 3: Skill 核心功能（Day 5-8）
├── Skill 列表页（像素卡片、筛选、搜索）
├── Skill 详情页（描述、版本列表、评测）
├── Skill 上传功能（表单、文件处理、ZIP 打包）
└── Skill 编辑功能（在线编辑器、Fork 逻辑）

Phase 4: 评测与榜单（Day 9-10）
├── 星级评分组件（龙虾钳子样式）
├── 评测表单与列表
├── 热门榜单页（下载量、评分排序）
└── 搜索功能（关键词、分类筛选）

Phase 5: 像素风格 UI（Day 11-13）
├── 像素卡片、按钮、边框组件
├── 像素图标集
├── 龙虾加载动画、空状态、成功提示
└── 响应式适配测试

Phase 6: 测试与部署（Day 14-15）
├── E2E 测试
├── 性能优化
├── 安全审计（Skill 上传校验）
└── 部署上线
```

## Open Questions

1. **龙虾素材来源**: AI 生成 vs 手绘 vs 外包？
   - 倾向：AI 生成（Stable Diffusion 像素模型）+ 手动调整

2. **Skill 存储方案**: 数据库 JSON vs 对象存储（S3/OSS）？
   - MVP: 数据库 JSON（小文件），后续迁移对象存储

3. **Skill 安全审计**: 自动扫描 vs 人工审核？
   - MVP: 自动扫描（agent-skills-tools）+ 用户举报

4. **Fork 机制**: 完整复制 vs 差异存储？
   - MVP: 完整复制（简单），后续考虑差异存储

5. **分类是否可自定义**: 仅预定义 vs 用户可创建？
   - MVP: 仅预定义 15+ 分类，后续开放用户创建
