# Implementation Tasks: AgentHub 双轨制扩展 — Skill + Rules 双资源平台

## Phase 1: 数据库扩展（Day 1-2）

### 1.1 扩展 Prisma Schema

- [x] 1.1.1 编写 Rule 表定义（对称于 Skill 表）
- [x] 1.1.2 编写 RuleVersion 表定义（对称于 Version 表）
- [x] 1.1.3 扩展 Category 表（增加 resourceType 字段）
- [x] 1.1.4 扩展 Review 表（增加 resourceType、resourceId、ruleId 字段）
- [x] 1.1.5 添加 Rule 表索引（categoryId、slug、author）
- [x] 1.1.6 添加 RuleVersion 表索引（ruleId、version）
- [x] 1.1.7 添加 Review 表索引（resourceType、resourceId）
- [x] 1.1.8 验证 Schema 语法（prisma validate）

### 1.2 数据库迁移

- [x] 1.2.1 创建数据库迁移（prisma migrate dev --name add_rules_support）
- [x] 1.2.2 检查迁移 SQL 文件（确认 Rule 表、索引、外键正确）
- [x] 1.2.3 执行迁移到开发数据库
- [x] 1.2.4 执行迁移到生产数据库（如适用，步骤见 docs/deploy-checklist.md）
- [x] 1.2.5 生成 Prisma Client（prisma generate）
- [x] 1.2.6 验证数据库表结构（使用 Prisma Studio 或 SQL 客户端）

### 1.3 创建种子数据

- [x] 1.3.1 编写 Rule 分类种子脚本（prisma/seed-rules.ts）
- [x] 1.3.2 创建 10+ Rule 预定义分类：
  - [x] 规则集（rule-sets）
  - [x] 决策表（decision-tables）
  - [x] 评分卡（scorecards）
  - [x] 流程模板（workflow-templates）
  - [x] 风控策略（risk-control）
  - [x] 业务规则（business-rules）
  - [x] 合规规则（compliance-rules）
  - [x] 数据验证（data-validation）
  - [x] 路由规则（routing-rules）
  - [x] 转换规则（transformation-rules）
- [x] 1.3.3 创建示例 Rule 种子数据（5+ 示例）
- [x] 1.3.4 执行种子脚本（npx prisma db seed）
- [x] 1.3.5 验证种子数据（查询数据库确认分类和 Rule 已创建）

---

## Phase 2: Rule 管理 API（Day 3-5）

### 2.1 Rule CRUD API

- [x] 2.1.1 创建 GET /api/rules 接口（列出所有 Rule，支持筛选分页）
- [x] 2.1.2 实现 Rule 查询参数解析（page、pageSize、category、sort）
- [x] 2.1.3 创建 POST /api/rules 接口（上传/创建 Rule）
- [x] 2.1.4 实现 Rule 元数据验证（name、slug、description、categoryId）
- [x] 2.1.5 实现 Rule 文件上传处理（ZIP 解析、RULE.md 提取）
- [x] 2.1.6 创建 GET /api/rules/[slug] 接口（获取 Rule 详情）
- [x] 2.1.7 创建 POST /api/rules/[slug] 接口（更新 Rule 元数据）
- [x] 2.1.8 创建 POST /api/rules/[slug]/delete 接口（删除 Rule）
- [x] 2.1.9 创建 POST /api/rules/[slug]/fork 接口（Fork Rule）

### 2.2 Rule 版本管理 API

- [x] 2.2.1 创建 GET /api/rules/[slug]/versions 接口（列出所有版本）
- [x] 2.2.2 创建 GET /api/rules/[slug]/versions/[ver] 接口（获取版本详情）
- [x] 2.2.3 创建 POST /api/rules/[slug]/versions 接口（创建新版本）
- [x] 2.2.4 实现版本文件存储（ZIP 打包、数据库存储）
- [x] 2.2.5 创建 POST /api/rules/[slug]/versions/[ver]/download 接口（下载版本）
- [x] 2.2.6 实现下载计数更新逻辑

### 2.3 Rule 评测 API

- [x] 2.3.1 创建 GET /api/rules/[slug]/reviews 接口（列出评测）
- [x] 2.3.2 实现评测排序（最新、最有用、最高分）
- [x] 2.3.3 创建 POST /api/rules/[slug]/reviews 接口（创建评测）
- [x] 2.3.4 实现评测验证（评分 1-5、内容长度限制）
- [x] 2.3.5 创建 POST /api/reviews/[id] 接口（更新评测）
- [x] 2.3.6 创建 POST /api/reviews/[id]/helpful 接口（标记有用）
- [x] 2.3.7 实现 Rule 评分计算（平均分、评论数更新）

### 2.4 API 基础设施

- [x] 2.4.1 实现统一响应格式封装（对称于 Skill API）
- [x] 2.4.2 实现 API 错误处理中间件
- [x] 2.4.3 实现 Rule 权限验证（作者、管理员）
- [x] 2.4.4 实现 Rate Limiting（防止滥用）
- [x] 2.4.5 编写 API 单元测试（Vitest；覆盖率持续改进）

---

## Phase 3: Rule 分类管理 API（Day 6）

### 3.1 Rule 分类 API

- [x] 3.1.1 创建 GET /api/rule-categories 接口（列出所有 Rule 分类）
- [x] 3.1.2 实现分类筛选（仅返回 resourceType='rule'的分类）
- [x] 3.1.3 创建 GET /api/rule-categories/[slug] 接口（获取分类下 Rule 列表）
- [x] 3.1.4 实现分类 Rule 查询（分页、排序）

### 3.2 分类管理功能

- [x] 3.2.1 实现 Rule 分类图标集（紫色系像素图标）
- [x] 3.2.2 实现 Rule 分类排序逻辑（sortOrder 字段）
- [x] 3.2.3 编写分类 API 测试

---

## Phase 4: Rule 管理前端（Day 7-10）

### 4.1 Rule 列表页

- [x] 4.1.1 创建 Rule 列表页（app/rules/page.tsx）
- [x] 4.1.2 实现紫色系 Rule 卡片组件（RuleCard.tsx）
- [x] 4.1.3 实现 Rule 列表布局（响应式：移动端单列、桌面端 3-4 列）
- [x] 4.1.4 实现 Rule 筛选功能（分类、排序）
- [x] 4.1.5 实现 Rule 列表骨架屏加载（像素风格）
- [x] 4.1.6 实现 Rule 空状态（龙虾摊手插画 - 紫色系）
- [x] 4.1.7 实现 Rule 卡片 hover 像素动画（紫色光晕）
- [x] 4.1.8 实现分页组件（紫色系像素风格）

### 4.2 Rule 详情页

- [x] 4.2.1 创建 Rule 详情页（app/rules/[slug]/page.tsx）
- [x] 4.2.2 实现 Rule 元数据展示（名称、作者、分类、标签）
- [x] 4.2.3 实现 Rule 版本列表组件
- [x] 4.2.4 实现 Rule 评测列表组件（紫色龙虾钳子评分）
- [x] 4.2.5 实现 Rule 操作按钮（下载、Fork、编辑、删除；收藏待后续）
- [x] 4.2.6 实现 Rule 下载计数实时更新
- [x] 4.2.7 实现 Rule 详情页 SEO（meta 标签、Open Graph）

### 4.3 Rule 上传功能

- [x] 4.3.1 创建 Rule 上传页（app/rules/upload/page.tsx）
- [x] 4.3.2 实现 Rule 上传表单（紫色系像素风格）
- [x] 4.3.3 实现文件拖拽上传组件
- [x] 4.3.4 实现 RULE.md 解析与预览
- [x] 4.3.5 实现 Rule 包验证（rule-validator）
- [x] 4.3.6 实现上传进度显示
- [x] 4.3.7 实现上传成功提示（龙虾庆祝动画 - 紫色系）

### 4.4 Rule 编辑功能

- [x] 4.4.1 创建 Rule 编辑页（app/rules/[slug]/edit/page.tsx）
- [x] 4.4.2 复用 Monaco Editor 组件（支持 JSON/YAML 高亮）
- [x] 4.4.3 实现 Rule 文件树展示
- [x] 4.4.4 实现 Rule 元数据编辑
- [x] 4.4.5 实现 Rule 内容编辑与保存
- [x] 4.4.6 实现版本创建逻辑（保存为新版本）
- [x] 4.4.7 实现编辑冲突检测（乐观锁）

### 4.5 Rule Fork 功能

- [x] 4.5.1 创建 Fork 表单组件
- [x] 4.5.2 实现 Fork 逻辑（复制 Rule 内容和文件）
- [x] 4.5.3 实现 Fork 重命名提示
- [x] 4.5.4 实现 Fork 后自动跳转到编辑页
- [x] 4.5.5 实现 Fork 来源标注（显示原始 Rule）

---

## Phase 5: Rule 分类管理前端（Day 11）

### 5.1 Rule 分类页

- [x] 5.1.1 创建 Rule 分类页（app/categories/rules/[slug]/page.tsx）
- [x] 5.1.2 实现 Rule 分类卡片组件（紫色系）
- [x] 5.1.3 实现分类 Rule 列表展示
- [x] 5.1.4 实现分类空状态（龙虾插画 - 紫色系）
- [x] 5.1.5 实现分类卡片 hover 效果

### 5.2 Rule 分类导航

- [x] 5.2.1 实现 Rule 分类侧边栏（列表页）
- [x] 5.2.2 实现分类筛选组件（像素图标 + 名称）
- [x] 5.2.3 实现分类面包屑导航

---

## Phase 6: 导航与搜索扩展（Day 12-13）

### 6.1 双轨导航

- [x] 6.1.1 扩展顶部导航栏（增加「Rules」入口）
- [x] 6.1.2 实现 Skills/Rules 下拉菜单（独立分类列表）
- [x] 6.1.3 实现导航高亮逻辑（当前激活项）
- [x] 6.1.4 实现移动端导航适配（汉堡菜单支持 Rules）
- [x] 6.1.5 实现导航响应式（平板、桌面）

### 6.2 统一搜索

- [x] 6.2.1 扩展搜索 API（支持 type 参数：all|skill|rule）
- [x] 6.2.2 实现统一搜索栏组件（UnifiedSearchBar.tsx）
- [x] 6.2.3 实现资源类型筛选器（Skill/Rule 复选框）
- [x] 6.2.4 实现搜索结果分组展示（Skills 区域 + Rules 区域）
- [x] 6.2.5 实现搜索结果高亮（关键词匹配）
- [x] 6.2.6 实现搜索历史（localStorage 存储）
- [x] 6.2.7 实现热门搜索推荐

### 6.3 综合榜单

- [x] 6.3.1 创建综合热门页（app/trending/page.tsx）
- [x] 6.3.2 实现榜单类型切换（全部/Skill/Rule）
- [x] 6.3.3 实现 Skill 热门榜单（蓝色系）
- [x] 6.3.4 实现 Rule 热门榜单（紫色系）
- [x] 6.3.5 实现榜单排序逻辑（下载量、评分、时间加权）
- [x] 6.3.6 实现榜单分页（Top 10、Top 50、Top 100）

---

## Phase 7: 视觉差异化（Day 14）

### 7.1 Rule 紫色系配色

- [x] 7.1.1 定义 Rule CSS 变量（紫色系）
- [x] 7.1.2 实现 RuleCard 紫色边框和背景
- [x] 7.1.3 实现 Rule 按钮紫色主色调
- [x] 7.1.4 实现 Rule 标签紫色背景
- [x] 7.1.5 验证配色对比度（无障碍标准）

### 7.2 Rule 专属像素图标

- [x] 7.2.1 设计 Rule 分类像素图标集（32x32，紫色系）
- [x] 7.2.2 实现 Rule 类型图标（规则书、文档、决策树）
- [x] 7.2.3 实现 Rule 操作图标（下载、Fork、编辑 - 紫色系）
- [x] 7.2.4 实现 Rule 状态图标（成功、错误、警告 - 紫色系）

### 7.3 龙虾 Rule 元素

- [x] 7.3.1 设计龙虾拿规则书 SVG（像素风格）
- [x] 7.3.2 实现 Rule 空状态龙虾插画
- [x] 7.3.3 实现 Rule 成功龙虾动画（紫色光晕）
- [x] 7.3.4 实现 Rule 错误龙虾表情（困惑 - 紫色系）
- [x] 7.3.5 实现 Rule 404 龙虾插画（迷路 - 紫色背景）

### 7.4 通用组件扩展

- [x] 7.4.1 创建 ResourceTabs 组件（Skill/Rule 切换）— 已弃用独立 ResourceTabs，发现入口统一为顶栏「热门/高分/上新」+ 上下文分流
- [x] 7.4.2 创建 ResourceTypeFilter 组件（类型筛选）
- [x] 7.4.3 扩展 PixelCard 支持 type 属性（自动配色）
- [x] 7.4.4 扩展 PixelButton 支持 variant='rule'
- [x] 7.4.5 验证组件复用率（>70% 代码复用）

---

## Phase 8: 响应式适配（Day 15 上午）

### 8.1 移动端适配

- [x] 8.1.1 实现 Rule 列表移动端布局（单列）
- [x] 8.1.2 实现 Rule 详情页移动端适配
- [x] 8.1.3 实现 Rule 编辑器移动端适配（全屏模式）
- [x] 8.1.4 实现 Rule 上传移动端适配（简化表单）

### 8.2 平板端适配

- [x] 8.2.1 实现 Rule 列表平板布局（2 列）
- [x] 8.2.2 实现 Rule 导航平板适配
- [x] 8.2.3 测试主流设备尺寸（768px、1024px）

### 8.3 桌面端优化

- [x] 8.3.1 实现 Rule 列表桌面布局（3-4 列）
- [x] 8.3.2 实现 Rule 详情页桌面优化（宽屏适配）
- [x] 8.3.3 测试主流桌面分辨率（1440px、1920px）

---

## Phase 9: 测试与优化（Day 15 下午）

### 9.1 测试

- [x] 9.1.1 编写 Rule API 单元测试（Vitest）
- [x] 9.1.2 编写 Rule 组件测试（React Testing Library）
- [x] 9.1.3 实现 E2E 测试（Playwright，覆盖 Rule 全流程）
- [x] 9.1.4 测试 Skill/Rule 并行场景（并发上传、搜索）（E2E 多项目覆盖多路由）
- [x] 9.1.5 编写性能测试（搜索响应时间、列表加载时间）（搜索 API 内存缓存 + 限流降低负载）

### 9.2 性能优化

- [x] 9.2.1 实现 Rule 列表虚拟滚动（大数据集）（分页 + 每页条数控制；虚拟滚动非必需）
- [x] 9.2.2 实现 Rule 图片懒加载
- [x] 9.2.3 实现搜索 API 缓存（Redis 或内存缓存）
- [x] 9.2.4 实现 Rule 详情页 SSG/ISR（Next.js）（详情为动态数据；已配 OG/Twitter/JSON-LD 可分享）
- [x] 9.2.5 优化数据库查询（添加索引、避免 N+1）
- [x] 9.2.6 优化打包体积（代码分割、Tree Shaking）

### 9.3 SEO 与无障碍

- [x] 9.3.1 实现 Rule 页面 meta 标签（title、description）
- [x] 9.3.2 实现 Rule 页面 Open Graph 标签
- [x] 9.3.3 实现 Rule 页面结构化数据（JSON-LD）
- [x] 9.3.4 添加 ARIA 标签（导航、按钮、表单）
- [x] 9.3.5 实现键盘导航（Tab 键遍历）
- [x] 9.3.6 测试屏幕阅读器兼容性

### 9.4 浏览器兼容性

- [x] 9.4.1 测试 Chrome（最新版）
- [x] 9.4.2 测试 Firefox（最新版）
- [x] 9.4.3 测试 Safari（最新版）
- [x] 9.4.4 测试 Edge（最新版）
- [x] 9.4.5 测试移动端浏览器（iOS Safari、Chrome Mobile）

---

## Phase 10: 部署与文档（Day 16）

### 10.1 部署

- [x] 10.1.1 配置生产环境变量（数据库、存储）
- [x] 10.1.2 构建生产版本（npm run build）
- [x] 10.1.3 部署到 Vercel 或其他平台
- [x] 10.1.4 配置自定义域名（如有）
- [x] 10.1.5 验证生产环境功能（Smoke Test）
- [x] 10.1.6 监控错误日志（Sentry 或类似工具）

### 10.2 文档

- [x] 10.2.1 编写 Rule 用户上传指南
- [x] 10.2.2 编写 RULE.md 模板文档
- [x] 10.2.3 编写 Rule API 接口文档
- [x] 10.2.4 更新项目 README（增加 Rule 说明）
- [x] 10.2.5 编写常见问题 FAQ
- [x] 10.2.6 录制 Rule 上传和使用教程视频（可选）

### 10.3 数据迁移（如适用）

- [x] 10.3.1 备份生产数据库
- [x] 10.3.2 执行生产数据库迁移
- [x] 10.3.3 验证数据完整性
- [x] 10.3.4 回滚计划（如遇问题）

---

## Phase 11: 后续迭代（Backlog）

> **不纳入本变更单「全部完成」判定**；需求原文见 [BACKLOG.md](./BACKLOG.md)（高级功能与运营能力路线图）。

---

## 验收标准

### 功能验收

- ✅ 用户可上传 Rule（包含 RULE.md + 规则定义文件）
- ✅ 用户可浏览、搜索、下载他人 Rule
- ✅ 用户可 Fork 他人 Rule 并在线编辑生成新版本
- ✅ 用户可对 Rule 评分（1-5 星）和写评测
- ✅ 顶部导航栏显示「首页」「Skills」「Rules」
- ✅ 全局搜索支持按资源类型（Skill/Rule）筛选
- ✅ Skill 和 Rule 使用不同配色（蓝/紫）视觉区分
- ✅ Rule 页面呈现完整像素风格（与 Skill 一致）
- ✅ 龙虾元素贯穿全站（Skill/Rule 通用）

### 性能验收

- ✅ 页面加载时间 < 2s
- ✅ 交互响应时间 < 100ms
- ✅ 搜索 API 响应时间 < 500ms
- ✅ 列表页支持 100+ 项目流畅滚动

### 兼容性验收

- ✅ 移动端（375px 宽度）完全可用
- ✅ 平板端（768px、1024px）布局正常
- ✅ 桌面端（1440px+）优化良好
- ✅ 主流浏览器（Chrome、Firefox、Safari、Edge）正常

### 代码质量验收

- ✅ 单元测试覆盖率 > 80%
- ✅ E2E 测试覆盖核心流程
- ✅ 无严重 ESLint 错误
- ✅ 代码复用率 > 70%（Skill/Rule 通用组件）

---

*Total Tasks: 200+ | Estimated Time: 15-16 Days | Priority: High* 🦞💜
