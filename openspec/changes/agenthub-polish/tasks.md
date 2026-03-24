# Implementation Tasks: AgentHub 功能完善与后台管理系统

## Phase 1: 下载鉴权（Day 1-2）

### 1.1 数据库扩展

- [ ] 1.1.1 在 Prisma Schema 中为 Skill 表添加 downloadPolicy 字段
  ```prisma
  downloadPolicy String @default("public") @db.VarChar(20)
  ```

- [ ] 1.1.2 在 Prisma Schema 中为 Rule 表添加 downloadPolicy 字段
  ```prisma
  downloadPolicy String @default("public") @db.VarChar(20)
  ```

- [ ] 1.1.3 创建 DownloadLog 表
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

- [ ] 1.1.4 执行数据库迁移
  ```bash
  npx prisma migrate dev --name add_download_policy_and_logs
  ```

### 1.2 下载 API 鉴权逻辑

- [ ] 1.2.1 修改 `/api/skills/[slug]/versions/[ver]/download/route.ts`
  - [ ] 添加 `getAuthFromRequest` 调用
  - [ ] 检查 Skill 的 downloadPolicy
  - [ ] PUBLIC: 无需认证
  - [ ] LOGIN_REQUIRED: 需要认证
  - [ ] AUTHOR_ONLY: 验证作者身份
  - [ ] 记录 DownloadLog

- [ ] 1.2.2 修改 `/api/rules/[slug]/versions/[ver]/download/route.ts`
  - [ ] 同上逻辑

- [ ] 1.2.3 编写单元测试
  - [ ] 测试公开资源下载
  - [ ] 测试需登录资源下载
  - [ ] 测试仅作者资源下载

### 1.3 前端下载按钮状态

- [ ] 1.3.1 在 Skill 详情页显示下载策略标识
  - [ ] 🌍 公开下载
  - [ ] 🔒 需登录
  - [ ] 👤 仅作者

- [ ] 1.3.2 在上传/编辑页面增加下载策略选择
  - [ ] 单选按钮：公开/需登录/仅作者
  - [ ] 默认值：公开

- [ ] 1.3.3 未登录用户点击下载时提示登录

---

## Phase 2: 后台管理系统（Day 3-7）

### 2.1 管理员认证

- [ ] 2.1.1 创建 Admin 表
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

- [ ] 2.1.2 创建管理员种子数据
  - [ ] 默认管理员：admin@agenthub.com / Admin@123

- [ ] 2.1.3 创建 `/api/admin/auth/login/route.ts`
  - [ ] 验证邮箱密码
  - [ ] 生成 Admin Session
  - [ ] 设置 HttpOnly Cookie

- [ ] 2.1.4 创建 `/api/admin/auth/logout/route.ts`

- [ ] 2.1.5 创建 `/api/admin/auth/me/route.ts`

### 2.2 后台前端框架

- [ ] 2.2.1 创建后台布局组件 `src/components/admin/AdminLayout.tsx`
  - [ ] 侧边栏导航
  - [ ] 顶部栏（管理员信息、登出）
  - [ ] 主内容区

- [ ] 2.2.2 创建后台页面
  - [ ] `/admin/login/page.tsx`
  - [ ] `/admin/layout.tsx`
  - [ ] `/admin/page.tsx`（数据看板）

### 2.3 内容审核

- [ ] 2.3.1 创建待审核 API
  - [ ] `GET /api/admin/skills/pending`
  - [ ] `GET /api/admin/rules/pending`

- [ ] 2.3.2 创建审核操作 API
  - [ ] `POST /api/admin/skills/[id]/approve`
  - [ ] `POST /api/admin/skills/[id]/reject`
  - [ ] `POST /api/admin/rules/[id]/approve`
  - [ ] `POST /api/admin/rules/[id]/reject`

- [ ] 2.3.3 创建审核页面
  - [ ] `/admin/skills/page.tsx`（列表）
  - [ ] `/admin/skills/[id]/review/page.tsx`（审核详情）
  - [ ] `/admin/rules/page.tsx`
  - [ ] `/admin/rules/[id]/review/page.tsx`

### 2.4 用户管理

- [ ] 2.4.1 创建用户列表 API
  - [ ] `GET /api/admin/agents`（分页、筛选）
  - [ ] `GET /api/admin/agents/[id]`（详情）

- [ ] 2.4.2 创建用户管理 API
  - [ ] `POST /api/admin/agents/[id]/ban`（封禁）
  - [ ] `POST /api/admin/agents/[id]/unban`（解封）
  - [ ] `POST /api/admin/agents/[id]/reset-api-key`（重置 Key）

- [ ] 2.4.3 创建用户管理页面
  - [ ] `/admin/agents/page.tsx`（列表）
  - [ ] `/admin/agents/[id]/page.tsx`（详情）

### 2.5 系统配置

- [ ] 2.5.1 创建 SystemConfig 表

- [ ] 2.5.2 创建配置 API
  - [ ] `GET /api/admin/config`
  - [ ] `PUT /api/admin/config/[key]`

- [ ] 2.5.3 创建配置页面
  - [ ] `/admin/config/page.tsx`
  - [ ] 配置项：
    - [ ] 站点名称
    - [ ] 站点 URL
    - [ ] 默认下载策略
    - [ ] 注册速率限制
    - [ ] 维护模式开关

### 2.6 分类管理（Skill/Rule）

- [ ] 2.6.1 创建分类管理 API
  - [ ] `GET /api/admin/categories`（列表，支持 resourceType 筛选）
  - [ ] `POST /api/admin/categories`（创建分类）
  - [ ] `PUT /api/admin/categories/[id]`（更新分类）
  - [ ] `POST /api/admin/categories/[id]/delete`（删除分类）
  - [ ] `PUT /api/admin/categories/reorder`（调整排序）
  - [ ] `POST /api/admin/categories/merge`（合并分类）
  - [ ] `PUT /api/admin/categories/[id]/migrate-resources`（迁移资源到新分类）

- [ ] 2.6.2 创建分类管理页面
  - [ ] `/admin/categories/page.tsx`
  - [ ] 双 Tab 切换（Skill 分类 / Rule 分类）
  - [ ] 分类列表（名称、图标、资源数量、排序）
  - [ ] 创建/编辑分类表单
    - [ ] 分类名称
    - [ ] 分类 Slug
    - [ ] 分类描述
    - [ ] 分类图标（可选）
    - [ ] 资源类型（Skill/Rule）
    - [ ] 排序序号

- [ ] 2.6.3 分类操作功能
  - [ ] 编辑分类
  - [ ] 删除分类（需确认无关联资源）
  - [ ] 拖拽调整排序
  - [ ] 批量导入分类（可选）
  - [ ] 合并分类（将多个分类合并为一个）

- [ ] 2.6.4 分类验证
  - [ ] Slug 唯一性验证（同 resourceType 内）
  - [ ] 名称唯一性验证（同 resourceType 内）
  - [ ] 删除前检查关联资源数量

- [ ] 2.6.5 已有资源分类维护
  - [ ] 删除分类时选择处理方式：
    - [ ] 方式 1：禁止删除（提示先迁移资源）
    - [ ] 方式 2：迁移到其他分类（选择目标分类）
    - [ ] 方式 3：删除分类及其所有资源（危险操作，需二次确认）
  - [ ] 批量修改资源分类
    - [ ] 勾选多个资源
    - [ ] 选择新分类
    - [ ] 批量更新
  - [ ] 分类合并功能
    - [ ] 选择源分类（可多选）
    - [ ] 选择目标分类
    - [ ] 将源分类的资源全部迁移到目标分类
    - [ ] 删除源分类

- [ ] 2.6.6 资源分类迁移 API
  - [ ] `POST /api/admin/categories/[fromId]/migrate-to/[toId]`
    - [ ] 参数：keepSourceCategory（布尔值，是否保留源分类）
    - [ ] 返回：迁移的资源数量、结果
  - [ ] `POST /api/admin/resources/bulk-update-category`
    - [ ] 参数：resourceIds[], targetCategoryId
    - [ ] 返回：成功数量、失败数量

- [ ] 2.6.7 分类删除保护
  - [ ] 有资源的分类删除前必须迁移资源
  - [ ] 删除操作记录审计日志
  - [ ] 支持撤销删除（24 小时内）

---

## Phase 3: 批量操作（Day 8-9）

### 3.1 批量上传

- [ ] 3.1.1 创建批量上传 API
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

- [ ] 4.1.1 创建 Notification 表
  ```prisma
  model Notification {
    id        String   @id @default(uuid())
    agentId   String
    agent     Agent    @relation(fields: [agentId], references: [id])
    type      String
    title     String
    content   String
    isRead    Boolean  @default(false)
    readAt    DateTime?
    createdAt DateTime @default(now())
  }
  ```

### 4.2 通知 API

- [ ] 4.2.1 创建通知 API
  - [ ] `GET /api/notifications`（列表）
  - [ ] `GET /api/notifications/unread-count`（未读数）
  - [ ] `POST /api/notifications/[id]/read`（标记已读）
  - [ ] `POST /api/notifications/read-all`（全部已读）

### 4.3 通知 UI

- [ ] 4.3.1 在导航栏增加通知铃铛图标
  - [ ] 未读数徽章
  - [ ] 下拉菜单显示通知列表

- [ ] 4.3.2 创建通知中心页面
  - [ ] `/notifications/page.tsx`
  - [ ] 按类型分组
  - [ ] 分页加载

### 4.4 通知触发

- [ ] 4.4.1 Skill 审核通过时发送通知
- [ ] 4.4.2 Skill 审核拒绝时发送通知
- [ ] 4.4.3 等级提升时发送通知
- [ ] 4.4.4 资源被下载时发送通知（作者）

---

## Phase 5: 数据看板（Day 12-13）

### 5.1 数据分析 API

- [ ] 5.1.1 创建总览 API
  - [ ] `GET /api/admin/analytics/overview`
  - [ ] 返回：总用户数、总资源数、总下载数等

- [ ] 5.1.2 创建趋势 API
  - [ ] `GET /api/admin/analytics/trends`
  - [ ] 参数：range（7d/30d/90d）
  - [ ] 返回：每日上传、下载、新用户

- [ ] 5.1.3 创建分类统计 API
  - [ ] `GET /api/admin/analytics/categories`
  - [ ] 返回：各分类资源数量

### 5.2 可视化组件

- [ ] 5.2.1 安装 Recharts
  ```bash
  npm install recharts
  ```

- [ ] 5.2.2 创建图表组件
  - [ ] `src/components/admin/charts/LineChart.tsx`
  - [ ] `src/components/admin/charts/BarChart.tsx`
  - [ ] `src/components/admin/charts/PieChart.tsx`

### 5.3 后台首页集成

- [ ] 5.3.1 设计后台首页布局
  - [ ] 关键指标卡片（总用户、总资源等）
  - [ ] 趋势图表（7 天上传/下载）
  - [ ] 热门资源榜单
  - [ ] 最新用户列表

- [ ] 5.3.2 实现数据刷新
  - [ ] 每 30 秒自动刷新
  - [ ] 手动刷新按钮

---

## Phase 6: SEO 优化（Day 14）

### 6.1 Sitemap

- [ ] 6.1.1 创建 `src/app/sitemap.ts`
  - [ ] 静态页面（首页、Skills、Rules）
  - [ ] 动态页面（Skill 详情、Rule 详情）

- [ ] 6.1.2 创建 `src/app/robots.ts`
  - [ ] 允许所有搜索引擎
  - [ ] 指定 Sitemap 位置

### 6.2 结构化数据

- [ ] 6.2.1 在 Skill 详情页添加 JSON-LD
  - [ ] SoftwareApplication schema
  - [ ] aggregateRating

- [ ] 6.2.2 在 Rule 详情页添加 JSON-LD
  - [ ] CreativeWork schema

### 6.3 Open Graph

- [ ] 6.3.1 优化首页 metadata
  - [ ] title
  - [ ] description
  - [ ] og:image

- [ ] 6.3.2 优化详情页 metadata
  - [ ] 动态生成 title/description
  - [ ] 生成 OG 图片（可选）

---

## Phase 7: PWA 支持（Day 15）

### 7.1 Manifest

- [ ] 7.1.1 创建 `public/manifest.json`
  - [ ] name、short_name
  - [ ] icons（192x192、512x512）
  - [ ] theme_color、background_color

- [ ] 7.1.2 在 layout.tsx 中引用 manifest
  ```tsx
  <link rel="manifest" href="/manifest.json" />
  ```

### 7.2 Service Worker

- [ ] 7.2.1 创建 `public/service-worker.js`
  - [ ] 缓存策略
  - [ ] 离线回退

- [ ] 7.2.2 在客户端注册 Service Worker
  - [ ] `src/components/pwa/ServiceWorkerRegistrar.tsx`

### 7.3 离线页面

- [ ] 7.3.1 创建离线页面
  - [ ] `/offline/page.tsx`
  - [ ] 友好的离线提示

---

---

## 验收标准

### 功能完整性

- ✅ 下载鉴权正常工作
- ✅ 后台管理系统完整（含分类管理）
- ✅ 批量操作可用
- ✅ 通知系统正常
- ✅ 数据看板可视化
- ✅ SEO 评分 > 90
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

*Total Tasks: 200+ | Estimated Time: 17 Days | Priority: Medium* 🔧✨
际化

- [ ] 8.4.1 迁移首页文案
- [ ] 8.4.2 迁移导航栏文案
- [ ] 8.4.3 迁移表单文案
- [ ] 8.4.4 迁移错误提示

---

## 验收标准

### 功能完整性

- ✅ 下载鉴权正常工作
- ✅ 后台管理系统完整（含分类管理）
- ✅ 批量操作可用
- ✅ 通知系统正常
- ✅ 数据看板可视化
- ✅ SEO 评分 > 90
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

*Total Tasks: 180+ | Estimated Time: 15 Days | Priority: Medium* 🔧✨
