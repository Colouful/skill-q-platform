# Implementation Tasks: AgentHub 功能完善与后台管理系统

## Phase 1: 下载鉴权（Day 1-2）

### 1.1 数据库扩展

- [x] 1.1.1 在 Prisma Schema 中为 Skill 表添加 downloadPolicy 字段
  ```prisma
  downloadPolicy String @default("public") @db.VarChar(20)
  ```

- [x] 1.1.2 在 Prisma Schema 中为 Rule 表添加 downloadPolicy 字段
  ```prisma
  downloadPolicy String @default("public") @db.VarChar(20)
  ```

- [x] 1.1.3 创建 DownloadLog 表
  ```prisma
  model DownloadLog {
    id           String   @id @default(uuid())
    agentId      String?
    agent        Agent?   @relation(fields: [agentId], references: [id])
    resourceType String
    resourceId   String
    ipAddress    String
    userAgent    String?
    createdAt    DateTime @default(now())
  }
  ```

- [x] 1.1.4 执行数据库迁移
  ```bash
  npx prisma migrate dev --name add_download_policy_and_logs
  ```

### 1.2 下载 API 鉴权逻辑

- [x] 1.2.1 修改 `/api/skills/[slug]/versions/[ver]/download/route.ts`
  - [ ] 添加 `getAuthFromRequest` 调用
  - [ ] 检查 Skill 的 downloadPolicy
  - [ ] PUBLIC: 无需认证
  - [ ] LOGIN_REQUIRED: 需要认证
  - [ ] AUTHOR_ONLY: 验证作者身份
  - [ ] 记录 DownloadLog

- [x] 1.2.2 修改 `/api/rules/[slug]/versions/[ver]/download/route.ts`
  - [ ] 同上逻辑

- [x] 1.2.3 编写单元测试
  - [ ] 测试公开资源下载
  - [ ] 测试需登录资源下载
  - [ ] 测试仅作者资源下载

### 1.3 前端下载按钮状态

- [x] 1.3.1 在 Skill 详情页显示下载策略标识
  - [ ] 🌍 公开下载
  - [ ] 🔒 需登录
  - [ ] 👤 仅作者

- [x] 1.3.2 在上传/编辑页面增加下载策略选择
  - [ ] 单选按钮：公开/需登录/仅作者
  - [ ] 默认值：公开

- [x] 1.3.3 未登录用户点击下载时提示登录

---

## Phase 2: 后台管理系统（Day 3-7）

### 2.1 管理员认证

- [x] 2.1.1 创建 Admin 表
  ```prisma
  model Admin {
    id           String   @id @default(uuid())
    email        String   @unique
    passwordHash String
    role         String   @default("moderator")
    permissions  Json
    isActive     Boolean  @default(true)
    lastLoginAt  DateTime?
    createdAt    DateTime @default(now())
  }
  ```

- [x] 2.1.2 创建管理员种子数据
  - [ ] 默认管理员：admin@agenthub.com / Admin@123

- [x] 2.1.3 创建 `/api/admin/auth/login/route.ts`
  - [ ] 验证邮箱密码
  - [ ] 生成 Admin Session
  - [ ] 设置 HttpOnly Cookie

- [x] 2.1.4 创建 `/api/admin/auth/logout/route.ts`

- [x] 2.1.5 创建 `/api/admin/auth/me/route.ts`

### 2.2 后台前端框架

- [x] 2.2.1 创建后台布局组件 `src/components/admin/AdminShell.tsx`（侧栏、登出、子内容区）

- [x] 2.2.2 创建后台页面
  - [x] `/admin/login/page.tsx`
  - [x] `/admin/layout.tsx`
  - [x] `/admin/page.tsx`（概览：待审数量与站点统计；完整数据看板见 Phase 5）

### 2.3 内容审核

- [x] 2.3.1 创建待审核 API
  - [x] `GET /api/admin/skills/pending`
  - [x] `GET /api/admin/rules/pending`

- [x] 2.3.2 创建审核操作 API
  - [x] `POST /api/admin/skills/[id]/approve`
  - [x] `POST /api/admin/skills/[id]/reject`
  - [x] `POST /api/admin/rules/[id]/approve`
  - [x] `POST /api/admin/rules/[id]/reject`

- [x] 2.3.3 创建审核页面（列表内完成通过/拒绝，不单独建 `[id]/review` 详情页）
  - [x] `/admin/skills/page.tsx`
  - [x] `/admin/rules/page.tsx`

### 2.4 用户管理

- [x] 2.4.1 创建用户列表 API
  - [x] `GET /api/admin/agents`（分页、`q`、filter=active|inactive|all）
  - [x] `GET /api/admin/agents/[id]`（详情，含 API Key 前缀列表）

- [x] 2.4.2 创建用户管理 API
  - [x] `POST /api/admin/agents/[id]/ban`（封禁，`isActive=false`）
  - [x] `POST /api/admin/agents/[id]/unban`（解封）
  - [x] `POST /api/admin/agents/[id]/reset-api-key`（撤销全部 Key 并新建 Default，明文仅响应一次）

- [x] 2.4.3 创建用户管理页面
  - [x] `/admin/agents/page.tsx`（列表）
  - [x] `/admin/agents/[id]/page.tsx`（详情 + 操作栏）

### 2.5 系统配置

- [x] 2.5.1 创建 SystemConfig 表（`system_configs`，迁移见仓库 `prisma/migrations`）

- [x] 2.5.2 创建配置 API
  - [x] `GET /api/admin/config`
  - [x] `POST /api/admin/config/update`（body: `key` + `value`）

- [x] 2.5.3 创建配置页面
  - [x] `/admin/config/page.tsx`
  - [x] 配置项：
    - [x] 站点名称
    - [x] 站点 URL
    - [x] 默认下载策略（作用于新建 Skill/Rule 未传 `downloadPolicy` 时）
    - [x] 注册速率限制（每 IP 每小时最大次数，`register` 限流）
    - [x] 维护模式开关（中间件 + `/maintenance`，后台与 `/api/admin` 除外）

### 2.6 分类管理（Skill/Rule）

- [x] 2.6.1 创建分类管理 API（仅 GET / POST，与任务书路径差异以实际实现为准）
  - [x] `GET /api/admin/categories`（`?resourceType=skill|rule`）
  - [x] `POST /api/admin/categories/create`（创建）
  - [x] `POST /api/admin/categories/update`（更新）
  - [x] `POST /api/admin/categories/remove`（删除，含迁移/级联等模式）
  - [x] `POST /api/admin/categories/reorder`（`orderedIds` 全量顺序）
  - [x] `POST /api/admin/categories/merge`（合并）
  - [x] `POST /api/admin/categories/migrate-resources`（整类迁移资源，`keepSourceCategory`）

- [x] 2.6.2 创建分类管理页面
  - [x] `/admin/categories/page.tsx`
  - [x] 双 Tab（Skill / Rule）
  - [x] 分类列表（名称、图标、资源数量、排序）
  - [x] 创建/编辑表单（名称、Slug、描述、图标、当前 Tab 决定资源类型）

- [x] 2.6.3 分类操作功能
  - [x] 编辑分类
  - [x] 删除分类（含有关联资源时的多种策略）
  - [x] 上移/下移排序（非拖拽，见 2.6.1 reorder）
  - [ ] 批量导入分类（可选，未做）
  - [x] 合并分类

- [x] 2.6.4 分类验证
  - [x] Slug 唯一性（`@@unique([slug, resourceType])` + 接口校验）
  - [x] 名称唯一性（`@@unique([name, resourceType])`）
  - [x] 删除前按模式处理关联资源数量

- [x] 2.6.5 已有资源分类维护
  - [x] 删除分类：空类直接删；有资源时迁移/级联等（见 remove API）
  - [x] 批量修改资源分类：`POST /api/admin/resources/bulk-update-category` + 分类页「批量改资源分类」（`GET /api/admin/resources/browse` 分页勾选）
  - [x] 分类合并（merge）与单行「迁移资源」

- [x] 2.6.6 资源分类迁移 API
  - [x] `POST /api/admin/categories/migrate-resources`（等价于「整类迁移」，含 `keepSourceCategory`）
  - [x] `POST /api/admin/resources/bulk-update-category`（`resourceIds` + `targetCategoryId`）
  - [x] `GET /api/admin/resources/browse`（管理端分页浏览资源，供批量勾选）

- [x] 2.6.7 分类删除保护（部分）
  - [x] 有资源时按策略迁移或级联，非空类不可「静默删除」
  - [x] `CategoryAuditLog` 审计记录
  - [ ] 撤销删除（24 小时内，未实现）

---

## Phase 3: 批量操作（Day 8-9）

### 3.1 批量上传

- [ ] 3.1.1 创建批量上传 API（未实现，见 Phase 3）
  - [ ] `POST /api/bulk/upload`
  - [ ] 支持多文件上传
  - [ ] 返回任务 ID

- [ ] 3.1.2 创建批量任务表
  ```prisma
  model BulkTask {
    id          String   @id @default(uuid())
    agentId     String
    type        String   // upload, delete
    status      String   // processing, completed, failed
    total       Int
    success     Int
    failed      Int
    results     Json
    createdAt   DateTime @default(now())
  }
  ```

- [ ] 3.1.3 创建任务状态 API
  - [ ] `GET /api/bulk/tasks/[id]`

- [ ] 3.1.4 创建批量上传页面
  - [ ] `/upload/bulk/page.tsx`
  - [ ] 文件拖拽区域
  - [ ] 进度显示
  - [ ] 结果列表

### 3.2 批量删除

- [ ] 3.2.1 创建批量删除 API
  - [ ] `POST /api/bulk/delete`
  - [ ] 支持 Skill 和 Rule

- [ ] 3.2.2 在我的资源页面增加批量选择
  - [ ] 复选框
  - [ ] 批量删除按钮
  - [ ] 二次确认

---

## Phase 4: 通知系统（Day 10-11）

### 4.1 数据库

- [x] 4.1.1 创建通知表（实现为 `HubNotification` / `hub_notifications`，避免与浏览器 `Notification` 冲突；迁移 `20260330120000_hub_notifications`）

### 4.2 通知 API

- [x] 4.2.1 创建通知 API
  - [x] `GET /api/notifications`（列表）
  - [x] `GET /api/notifications/unread-count`（未读数）
  - [x] `POST /api/notifications/[id]/read`（标记已读）
  - [x] `POST /api/notifications/read-all`（全部已读）

### 4.3 通知 UI

- [x] 4.3.1 在导航栏增加通知铃铛图标
  - [x] 未读数徽章（sm+；移动端抽屉内「通知中心」链接）
  - [ ] 下拉菜单显示通知列表（未做，改为独立通知中心页）

- [x] 4.3.2 创建通知中心页面
  - [x] `/notifications/page.tsx`
  - [ ] 按类型分组（当前为时间倒序列表）
  - [x] 分页加载

### 4.4 通知触发

- [x] 4.4.1 Skill 审核通过时发送通知
- [x] 4.4.2 Skill 审核拒绝时发送通知
- [x] 4.4.3 等级提升时发送通知（在 `applyExperienceDelta` 事务内写入）
- [x] 4.4.4 资源被下载时发送通知（作者）：某版本**首次**被他人下载时通知（非本人下载）

---

## Phase 5: 数据看板（Day 12-13）

### 5.1 数据分析 API

- [x] 5.1.1 创建总览 API
  - [x] `GET /api/admin/analytics/overview`
  - [x] 返回：特工、已上架 Skill/Rule、待审、下载记录、评测等

- [x] 5.1.2 创建趋势 API
  - [x] `GET /api/admin/analytics/trends`
  - [x] 参数：range（7d/30d/90d）
  - [x] 返回：每日下载、新建 Skill、新用户（`src/lib/admin-analytics-queries.ts`）

- [x] 5.1.3 创建分类统计 API
  - [x] `GET /api/admin/analytics/categories`
  - [x] 返回：已上架 Skill/Rule 各分类数量

### 5.2 可视化组件

- [x] 5.2.1 安装 Recharts（`recharts@2`）

- [x] 5.2.2 创建图表组件（`AdminDashboardCharts` 内联折线图；未单独拆 Bar/Pie 文件）

### 5.3 后台首页集成

- [x] 5.3.1 设计后台首页布局
  - [x] 关键指标卡片（扩展统计）
  - [x] 趋势折线图（最近 7 天）
  - [x] 热门资源榜单（Skill / Rule 各 Top5，按下载量）
  - [x] 最新用户列表（特工 8 条，链到 `/admin/agents/[id]`）

- [x] 5.3.2 实现数据刷新
  - [x] 每 30 秒自动刷新
  - [x] 手动刷新按钮

---

## Phase 6: SEO 优化（Day 14）

### 6.1 Sitemap

- [x] 6.1.1 创建 `src/app/sitemap.ts`
  - [x] 静态页面（首页、Skills、Rules、search、trending）
  - [x] 动态页面（已上架 Skill / Rule 详情）

- [x] 6.1.2 创建 `src/app/robots.ts`
  - [x] 允许所有搜索引擎
  - [x] 指定 Sitemap 位置

### 6.2 结构化数据

- [x] 6.2.1 在 Skill 详情页添加 JSON-LD
  - [x] SoftwareApplication schema
  - [x] aggregateRating（有评测时输出）

- [x] 6.2.2 在 Rule 详情页添加 JSON-LD
  - [x] CreativeWork schema（`RuleJsonLd` 已改为 `@type: CreativeWork`）

### 6.3 Open Graph

- [x] 6.3.1 优化首页 metadata
  - [x] title
  - [x] description
  - [x] og:image（`layout` 根 `openGraph.images` → `/patterns/sketch-paper.svg`）

- [x] 6.3.2 优化详情页 metadata
  - [x] 动态生成 title/description（已有）
  - [x] 生成 OG 图片（可选，未单独生成；详情页与首页共用 `sketch-paper.svg` 的 `og:image`）

---

## Phase 7: PWA 支持（Day 15）

### 7.1 Manifest

- [x] 7.1.1 创建 `public/manifest.json`
  - [x] name、short_name
  - [x] icons（`public/icons/pwa-icon.svg` 提供 192/512/maskable 条目，矢量满足多 DPR）
  - [x] theme_color、background_color

- [x] 7.1.2 在 layout.tsx 中引用 manifest
  - Next Metadata：`manifest: "/manifest.json"`（等价于 `<link rel="manifest" href="/manifest.json" />`）

### 7.2 Service Worker

- [x] 7.2.1 创建 `public/service-worker.js`
  - [x] 缓存策略（预缓存壳资源；非 HTML GET 网络优先并写入 Cache Storage）
  - [x] 离线回退（HTML 导航失败时响应已缓存的 `/offline`）

- [x] 7.2.2 在客户端注册 Service Worker
  - [x] `src/components/pwa/ServiceWorkerRegistrar.tsx`（仅生产环境注册，见 `Providers`）

### 7.3 离线页面

- [x] 7.3.1 创建离线页面
  - [x] `/offline/page.tsx`
  - [x] 友好的离线提示

---

## 说明

- **不包含国际化**：界面与文案保持中文，不引入 next-intl，亦无文案迁移类任务。

---

## 验收标准

### 功能完整性

- ✅ 下载鉴权正常工作
- ✅ 后台管理系统完整（含分类管理）
- ✅ 批量操作可用
- ✅ 通知系统正常
- ✅ 数据看板可视化
- ✅ SEO 评分 > 90（Lighthouse）
- ✅ PWA 可安装

### 性能指标

- ✅ 后台页面加载 < 2s
- ✅ 数据分析 API < 500ms
- ✅ 通知推送 < 100ms

### 安全标准

- ✅ 管理员密码加密存储
- ✅ 后台 API 权限验证
- ✅ 批量操作速率限制

---

*任务数不含已移除的国际化子任务；以任务清单勾选为准。*
