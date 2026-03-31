# Implementation Tasks: 虾球Hub — 像素风格龙虾主题 Skill 分享平台

## 1. 项目初始化与基础设施

- [x] 1.1 改造 Next.js 项目结构（从 markView 转为 虾球Hub）
- [x] 1.2 安装并配置 Tailwind CSS
- [x] 1.3 安装像素字体（Press Start 2P、VT323）
- [x] 1.4 配置像素风格 CSS 变量（配色、字体、边框）
- [x] 1.5 安装 Prisma ORM 并配置 PostgreSQL 连接
- [x] 1.6 配置 ESLint + Prettier 代码规范
- [x] 1.7 创建基础布局组件（像素导航、Footer）
- [x] 1.8 准备龙虾 Sprite 素材（走路、庆祝、空状态、404）

## 2. 数据库 Schema 与迁移

- [x] 2.1 编写 Prisma Schema（Category、Skill、Version、Review 四表）
- [x] 2.2 配置 utf8mb3 字符集
- [x] 2.3 执行数据库迁移（prisma migrate dev）
- [x] 2.4 生成 Prisma Client
- [x] 2.5 创建种子脚本（15+ 预定义分类、示例 Skill）

## 3. Skill 管理 API

- [x] 3.1 创建 GET /api/skills 接口（列出所有 Skill，支持筛选分页）
- [x] 3.2 创建 POST /api/skills 接口（上传/创建 Skill）
- [x] 3.3 创建 GET /api/skills/[slug] 接口（获取 Skill 详情）
- [x] 3.4 创建 POST /api/skills/[slug] 接口（更新 Skill 元数据）
- [x] 3.5 创建 POST /api/skills/[slug]/delete 接口（删除 Skill）
- [x] 3.6 创建 POST /api/skills/[slug]/fork 接口（Fork Skill）
- [x] 3.7 实现统一响应格式封装
- [x] 3.8 实现 API 错误处理中间件

## 4. Skill 管理前端

- [x] 4.1 创建 Skill 列表页（app/skills/page.tsx）
- [x] 4.2 实现像素风格 Skill 卡片组件
- [x] 4.3 实现 Skill 上传表单（像素风格）
- [x] 4.4 实现 Skill 搜索功能（实时过滤）
- [x] 4.5 实现 Skill 列表骨架屏加载（像素风格）
- [x] 4.6 创建 Skill 详情页（app/skills/[slug]/page.tsx）
- [x] 4.7 实现 Skill 编辑功能
- [x] 4.8 实现 Skill 删除二次确认（龙虾提示）
- [x] 4.9 添加 Skill 卡片 hover 像素动画
- [x] 4.10 实现响应式布局（移动端单列，桌面端 3-4 列）

## 5. 分类管理 API

- [x] 5.1 创建 GET /api/categories 接口（列出所有分类）
- [x] 5.2 创建 GET /api/categories/[slug] 接口（获取分类下 Skill 列表）

## 6. 分类管理前端

- [x] 6.1 创建分类筛选组件（像素图标 + 名称）
- [x] 6.2 实现分类页（app/categories/[slug]/page.tsx）
- [x] 6.3 实现分类卡片 hover 效果
- [x] 6.4 实现分类空状态（龙虾摊手插画）

## 7. 版本管理 API

- [x] 7.1 创建 GET /api/skills/[slug]/versions 接口（列出所有版本）
- [x] 7.2 创建 GET /api/skills/[slug]/versions/[ver] 接口（获取版本详情）
- [x] 7.3 创建 POST /api/skills/[slug]/versions 接口（创建新版本）
- [x] 7.4 创建 POST /api/skills/[slug]/versions/[ver]/download 接口（下载版本）

## 8. 版本管理前端

- [x] 8.1 创建版本列表组件
- [x] 8.2 实现版本详情页
- [x] 8.3 实现发布新版本功能
- [x] 8.4 实现下载按钮（像素风格）
- [x] 8.5 实现下载计数更新

## 9. 评测系统 API

- [x] 9.1 创建 GET /api/skills/[slug]/reviews 接口（列出评测）
- [x] 9.2 创建 POST /api/skills/[slug]/reviews 接口（创建评测）
- [x] 9.3 创建 POST /api/reviews/[id] 接口（更新评测）
- [x] 9.4 创建 POST /api/reviews/[id]/helpful 接口（标记有用）

## 10. 评测系统前端

- [x] 10.1 创建星级评分组件（龙虾钳子图标）
- [x] 10.2 实现评测表单（像素风格）
- [x] 10.3 实现评测列表页
- [x] 10.4 实现「有用」按钮
- [x] 10.5 实现评测排序（最新/最有用）

## 11. Fork 编辑功能

- [x] 11.1 创建 Fork 表单组件
- [x] 11.2 实现 Fork 逻辑（复制 Skill 内容）
- [x] 11.3 安装 Monaco Editor
- [x] 11.4 创建在线编辑器组件
- [x] 11.5 实现文件树展示
- [x] 11.6 实现代码编辑与保存
- [x] 11.7 实现版本创建逻辑

## 12. 搜索与发现

- [x] 12.1 创建搜索栏组件（像素风格）
- [x] 12.2 实现实时搜索功能
- [x] 12.3 实现搜索结果高亮
- [x] 12.4 创建热门榜单页（app/trending/page.tsx）
- [x] 12.5 实现高分榜单页（app/top-rated/page.tsx）
- [x] 12.6 实现最新上架页（app/new/page.tsx）
- [x] 12.7 实现首页推荐区域

## 13. 文件上传下载

- [x] 13.1 创建 POST /api/upload 接口
- [x] 13.2 实现文件上传组件（拖拽 + 点击）
- [x] 13.3 实现 ZIP 解压与校验
- [x] 13.4 实现 SKILL.md 解析
- [x] 13.5 实现文件格式校验
- [x] 13.6 实现安全扫描（agent-skills-tools）
- [x] 13.7 实现 ZIP 打包下载功能
- [x] 13.8 实现下载进度显示

## 14. 像素风格 UI 组件库

- [x] 14.1 创建 PixelCard 组件
- [x] 14.2 创建 PixelButton 组件
- [x] 14.3 创建 PixelBorder 组件
- [x] 14.4 创建 PixelIcon 组件
- [x] 14.5 创建 PixelFont 组件
- [x] 14.6 创建像素风格 Input 组件
- [x] 14.7 创建像素风格 Modal 组件
- [x] 14.8 创建像素风格 Table 组件
- [x] 14.9 创建像素风格 Pagination 组件
- [x] 14.10 实现像素图标集（32x32）

## 15. 龙虾元素组件

- [x] 15.1 创建 LobsterMascot 组件（SVG 像素龙虾）
- [x] 15.2 创建 LobsterLoading 组件（走路动画）
- [x] 15.3 创建 LobsterEmpty 组件（空状态插画）
- [x] 15.4 创建 LobsterSuccess 组件（庆祝动画）
- [x] 15.5 创建 LobsterError 组件（困惑表情）
- [x] 15.6 创建 Lobster404 组件（迷路插画）
- [x] 15.7 实现龙虾钳子评分图标
- [x] 15.8 实现龙虾脚印分页装饰

## 16. 像素动画系统

- [x] 16.1 创建 Sprite 动画 CSS（keyframes）
- [x] 16.2 实现按钮 hover 像素动画
- [x] 16.3 实现卡片 hover 像素动画
- [x] 16.4 实现列表项进入动画（steps）
- [x] 16.5 实现 Modal 打开动画（像素缩放）
- [x] 16.6 实现 Toast 滑入动画

## 17. 响应式适配

- [x] 17.1 实现移动端导航（汉堡菜单像素风格）
- [x] 17.2 实现移动端列表布局（单列）
- [x] 17.3 实现平板端列表布局（2 列）
- [x] 17.4 实现桌面端列表布局（3-4 列）
- [x] 17.5 实现移动端编辑器（全屏）
- [x] 17.6 测试主流设备尺寸（375px、768px、1024px、1440px）

## 18. 测试与优化

- [x] 18.1 编写 API 单元测试（Vitest）
- [x] 18.2 编写组件测试（React Testing Library）
- [x] 18.3 实现 E2E 测试（Playwright）
- [x] 18.4 性能优化（图片懒加载、虚拟滚动）
- [x] 18.5 SEO 优化（meta 标签、Open Graph）
- [x] 18.6 无障碍优化（ARIA 标签、键盘导航）
- [x] 18.7 浏览器兼容性测试

## 19. 部署与文档

- [x] 19.1 配置生产环境变量
- [x] 19.2 构建生产版本（npm run build）
- [x] 19.3 部署到 Vercel 或其他平台
- [x] 19.4 配置自定义域名（如有）
- [x] 19.5 编写用户使用说明
- [x] 19.6 编写 API 接口文档
- [x] 19.7 编写 Skill 上传指南
- [x] 19.8 编写 SKILL.md 模板文档
