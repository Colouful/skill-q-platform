# Technical Design: AgentHub 功能完善与后台管理系统

## Context

AgentHub 需要完善以下功能：下载鉴权、后台管理、批量操作、通知系统、数据看板、SEO 优化、PWA、国际化。

## Decisions

### 1. 下载鉴权设计

**方案**: 可选鉴权（作者决定公开/私有）

**设计**:
```typescript
// Skill/Rule 表增加 downloadPolicy 字段
enum DownloadPolicy {
  PUBLIC = "public",     // 任何人可下载（默认）
  LOGIN_REQUIRED = "login", // 需登录
  AUTHOR_ONLY = "author" // 仅作者
}

// 下载 API 鉴权逻辑
POST /api/skills/[slug]/versions/[ver]/download
- 检查资源 downloadPolicy
- PUBLIC: 无需认证
- LOGIN_REQUIRED: 需要认证（getAuthFromRequest）
- AUTHOR_ONLY: 需要认证 + 验证作者身份
- 记录下载日志（Agent、IP、时间）
```

### 2. 后台管理系统

#### 2.1 数据库扩展

```prisma
// 管理员表
model Admin {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  role          String    @default("moderator") // moderator, admin, super_admin
  permissions   Json      // ["skills.review", "users.ban", ...]
  isActive      Boolean   @default(true)
  lastLoginAt   DateTime?
  createdAt     DateTime  @default(now())
}

// 通知表
model Notification {
  id          String   @id @default(uuid())
  agentId     String
  agent       Agent    @relation(fields: [agentId], references: [id])
  type        String   // system, review_reply, skill_approved, ...
  title       String
  content     String
  isRead      Boolean  @default(false)
  readAt      DateTime?
  createdAt   DateTime @default(now())
}

// 下载日志表
model DownloadLog {
  id          String   @id @default(uuid())
  agentId     String?
  agent       Agent?   @relation(fields: [agentId], references: [id])
  resourceType String
  resourceId  String
  ipAddress   String
  userAgent   String?
  createdAt   DateTime @default(now())
  
  @@index([agentId])
  @@index([resourceType, resourceId])
}

// 系统配置表
model SystemConfig {
  id          String   @id @default(uuid())
  key         String   @unique
  value       Json
  description String?
  updatedAt   DateTime @updatedAt
}
```

#### 2.6 分类管理设计

**API 设计**:
```typescript
// 分类管理 API
GET    /api/admin/categories              // 获取分类列表（支持 resourceType 筛选）
POST   /api/admin/categories              // 创建分类
PUT    /api/admin/categories/[id]         // 更新分类
POST   /api/admin/categories/[id]/delete  // 删除分类
PUT    /api/admin/categories/reorder      // 调整分类排序

// 分类数据结构
interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  resourceType: 'skill' | 'rule';
  sortOrder: number;
  _count: { skills: number; rules: number };
}
```

**前端页面**:
```
/admin/categories
├── 双 Tab 切换（Skill 分类 / Rule 分类）
├── 分类列表
│   ├── 名称 + 图标
│   ├── 资源数量
│   ├── 排序序号
│   └── 操作按钮（编辑、删除）
├── 创建/编辑分类表单
│   ├── 分类名称
│   ├── 分类 Slug（自动生成，可编辑）
│   ├── 分类描述
│   ├── 分类图标（可选）
│   ├── 资源类型（只读，由 Tab 决定）
│   └── 排序序号
└── 拖拽排序功能
```

**验证规则**:
```typescript
// Slug 唯一性（同 resourceType 内）
await prisma.category.findUnique({
  where: {
    slug_resourceType: { slug, resourceType }
  }
});

// 名称唯一性（同 resourceType 内）
await prisma.category.findUnique({
  where: {
    name_resourceType: { name, resourceType }
  }
});

// 删除前检查关联资源
const count = await prisma.skill.count({
  where: { categoryId }
});
if (count > 0) {
  throw new Error('分类下存在资源，无法删除');
}
```

**资源分类维护**:
```typescript
// 分类删除时的处理方式
enum DeleteCategoryStrategy {
  BLOCK = 'block',              // 禁止删除（有资源时）
  MIGRATE = 'migrate',          // 迁移到其他分类
  CASCADE_DELETE = 'cascade'    // 删除分类及所有资源（危险）
}

// 迁移资源 API
POST /api/admin/categories/[fromId]/migrate-to/[toId]
{
  keepSourceCategory: boolean,  // 是否保留源分类
  resourceType: 'skill' | 'rule'
}

响应：
{
  migratedCount: number,
  failedCount: number,
  errors: [{ resourceId: string, error: string }]
}

// 批量修改资源分类
POST /api/admin/resources/bulk-update-category
{
  resourceIds: string[],
  targetCategoryId: string,
  resourceType: 'skill' | 'rule'
}

// 分类合并
POST /api/admin/categories/merge
{
  sourceCategoryIds: string[],
  targetCategoryId: string,
  deleteSourceCategories: boolean
}
```

**审计日志**:
```prisma
model CategoryAuditLog {
  id          String   @id @default(uuid())
  adminId     String
  action      String   // create, update, delete, merge, migrate
  categoryId  String
  details     Json     // 变更详情
  createdAt   DateTime @default(now())
}
```

#### 2.2 后台 API

```
// 管理员认证
POST   /api/admin/auth/login       // 管理员登录
POST   /api/admin/auth/logout      // 管理员登出
GET    /api/admin/auth/me          // 获取当前管理员

// 内容审核
GET    /api/admin/skills/pending   // 待审核 Skill 列表
POST   /api/admin/skills/[id]/approve   // 审核通过
POST   /api/admin/skills/[id]/reject    // 审核拒绝

GET    /api/admin/rules/pending    // 待审核 Rule 列表
POST   /api/admin/rules/[id]/approve    // 审核通过
POST   /api/admin/rules/[id]/reject     // 审核拒绝

// 用户管理
GET    /api/admin/agents           // Agent 列表
GET    /api/admin/agents/[id]      // Agent 详情
POST   /api/admin/agents/[id]/ban  // 封禁 Agent
POST   /api/admin/agents/[id]/unban // 解封 Agent

// 系统配置
GET    /api/admin/config           // 获取配置
PUT    /api/admin/config/[key]     // 更新配置

// 数据看板
GET    /api/admin/analytics/overview    // 总览数据
GET    /api/admin/analytics/trends      // 趋势数据
GET    /api/admin/analytics/downloads   // 下载统计
```

#### 2.3 后台前端页面

```
/admin              # 后台首页（数据看板）
/admin/login        # 管理员登录
/admin/skills       # Skill 管理（审核、编辑、删除）
/admin/rules        # Rule 管理
/admin/agents       # Agent 管理
/admin/notifications # 通知管理
/admin/config       # 系统配置
```

### 3. 批量操作

#### 3.1 批量上传 API

```typescript
POST /api/bulk/upload
Content-Type: multipart/form-data

{
  resources: File[],  // 多个 ZIP 文件
  categorySlug: string,
  downloadPolicy: "public" | "login" | "author"
}

响应：
{
  jobId: string,  // 批量任务 ID
  status: "processing" | "completed" | "failed",
  total: number,
  success: number,
  failed: number,
  results: [
    { filename: string, success: boolean, error?: string, skillId?: string }
  ]
}
```

#### 3.2 批量删除 API

```typescript
POST /api/bulk/delete
{
  resourceType: "skill" | "rule",
  ids: string[]  // 资源 ID 列表
}

响应：
{
  success: number,
  failed: number,
  results: [{ id: string, success: boolean, error?: string }]
}
```

### 4. 通知系统

#### 4.1 通知类型

```typescript
enum NotificationType {
  SYSTEM = "system",           // 系统公告
  SKILL_APPROVED = "skill_approved",  // Skill 审核通过
  SKILL_REJECTED = "skill_rejected",  // Skill 审核拒绝
  RULE_APPROVED = "rule_approved",    // Rule 审核通过
  RULE_REJECTED = "rule_rejected",    // Rule 审核拒绝
  REVIEW_REPLY = "review_reply",      // 评测回复
  NEW_DOWNLOAD = "new_download",      // 资源被下载（作者）
  LEVEL_UP = "level_up",              // 等级提升
}
```

#### 4.2 通知 API

```
GET    /api/notifications        // 获取通知列表
POST   /api/notifications/[id]/read  // 标记为已读
POST   /api/notifications/read-all   // 全部标记为已读
GET    /api/notifications/unread-count // 未读数量
```

#### 4.3 实时通知（可选）

```typescript
// WebSocket 推送
const ws = new WebSocket("ws://localhost:3000/ws/notifications");
ws.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  showNotification(notification);
};
```

### 5. 数据看板

#### 5.1 总览数据

```typescript
GET /api/admin/analytics/overview

响应：
{
  totalAgents: number,
  totalSkills: number,
  totalRules: number,
  totalDownloads: number,
  totalReviews: number,
  todayActiveAgents: number,
  todayUploads: number,
  todayDownloads: number,
}
```

#### 5.2 趋势数据

```typescript
GET /api/admin/analytics/trends?range=7d

响应：
{
  uploads: [{ date: string, skills: number, rules: number }],
  downloads: [{ date: string, count: number }],
  newAgents: [{ date: string, count: number }],
}
```

#### 5.3 前端可视化

```typescript
// 使用 Recharts 或 Chart.js
import { LineChart, BarChart, PieChart } from "recharts";

<LineChart data={trends.uploads} />
<BarChart data={trends.downloads} />
```

### 6. SEO 优化

#### 6.1 Sitemap

```typescript
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const skills = await prisma.skill.findMany({ select: { slug, updatedAt } });
  const rules = await prisma.rule.findMany({ select: { slug, updatedAt } });

  return [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/skills`, lastModified: new Date() },
    { url: `${baseUrl}/rules`, lastModified: new Date() },
    ...skills.map(s => ({
      url: `${baseUrl}/skills/${s.slug}`,
      lastModified: s.updatedAt,
    })),
    ...rules.map(r => ({
      url: `${baseUrl}/rules/${r.slug}`,
      lastModified: r.updatedAt,
    })),
  ];
}
```

#### 6.2 结构化数据（JSON-LD）

```typescript
// 在 Skill/Rule 详情页添加
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: skill.name,
      description: skill.description,
      author: { "@type": "Person", name: skill.author },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: skill.rating,
        ratingCount: skill.reviewCount,
      },
    }),
  }}
/>
```

#### 6.3 Open Graph

```typescript
// 在每个页面设置 metadata
export async function generateMetadata({ params }): Promise<Metadata> {
  const skill = await getSkill(params.slug);
  return {
    title: skill.name,
    description: skill.description,
    openGraph: {
      title: skill.name,
      description: skill.description,
      images: [skill.ogImage || "/og-default.png"],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: skill.name,
      description: skill.description,
    },
  };
}
```

### 7. PWA 支持

#### 7.1 manifest.json

```json
{
  "name": "虾球 Hub",
  "short_name": "虾球 Hub",
  "description": "Skill 与 Rule 的发现与分享平台",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#fafafa",
  "theme_color": "#4ecdc4",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

#### 7.2 Service Worker

```typescript
// service-worker.ts
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("v1").then((cache) => {
      return cache.addAll([
        "/",
        "/skills",
        "/rules",
        "/offline",
      ]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

### 8. 国际化（i18n）

#### 8.1 语言配置

```typescript
// i18n/config.ts
export const i18n = {
  defaultLocale: "zh",
  locales: ["zh", "en"],
  localeNames: {
    zh: "中文",
    en: "English",
  },
} as const;

export type Locale = typeof i18n.locales[number];
```

#### 8.2 翻译文件

```json
// i18n/locales/zh.json
{
  "common": {
    "home": "首页",
    "skills": "Skills",
    "rules": "Rules",
    "login": "登录",
    "register": "注册",
    "download": "下载",
    "upload": "上传"
  }
}

// i18n/locales/en.json
{
  "common": {
    "home": "Home",
    "skills": "Skills",
    "rules": "Rules",
    "login": "Login",
    "register": "Register",
    "download": "Download",
    "upload": "Upload"
  }
}
```

#### 8.3 语言切换

```typescript
// 使用 next-intl
import { useTranslations } from "next-intl";

function Header() {
  const t = useTranslations("common");
  return (
    <nav>
      <a href="/">{t("home")}</a>
      <a href="/skills">{t("skills")}</a>
      <LocaleSwitcher />
    </nav>
  );
}
```

## Migration Plan

```
Phase 1: 下载鉴权（Day 1-2）
├── 数据库扩展（downloadPolicy）
├── 下载 API 鉴权逻辑
└── 前端下载按钮状态

Phase 2: 后台管理（Day 3-7）
├── 管理员认证
├── 内容审核 API + 页面
├── 用户管理 API + 页面
├── 系统配置 API + 页面
└── 分类管理 API + 页面（Skill/Rule）

Phase 3: 批量操作（Day 8-9）
├── 批量上传 API
├── 批量删除 API
└── 前端批量操作 UI

Phase 4: 通知系统（Day 10-11）
├── 通知数据库
├── 通知 API
└── 通知 UI（站内 + 邮件）

Phase 5: 数据看板（Day 12-13）
├── 数据分析 API
├── 可视化组件
└── 后台首页集成

Phase 6: SEO 优化（Day 14）
├── Sitemap
├── 结构化数据
└── Open Graph

Phase 7: PWA（Day 15）
├── manifest.json
├── Service Worker
└── 离线页面
```

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| **下载鉴权影响体验** | 中 | 默认公开，作者可选 |
| **后台管理复杂** | 中 | 分阶段 MVP |
| **批量操作性能** | 低 | 队列处理 |
| **通知成本** | 低 | 站内优先 |
