# Proposal: AgentHub — 像素风格龙虾主题 Skill 分享平台

## Why

当前 OpenClaw 生态缺乏统一的 Skill 分享与发现平台。用户开发的优质 Skill 散落在各处，难以被发现、复用和改进。现有平台（如 xiaping.coze.site）证明了 Skill 分享市场的强烈需求。本变更构建一个具有独特像素风格 + 龙虾主题的 AgentHub，提供 Skill 上传、下载、在线编辑（Fork 模式）、评分评测等核心功能，打造 OpenClaw 生态的 Skill 集散地。

## What Changes

- **新增 Skill 实体**：支持上传、浏览、搜索、下载 OpenClaw Agent Skills
- **新增分类系统**：15+ 预定义分类（开发辅助、办公效率、自媒体、IT 互联网等）
- **新增版本管理**：每个 Skill 支持多版本，用户可下载指定版本
- **新增评测系统**：用户对 Skill 打分（1-5 星）、写文字评测
- **新增 Fork 编辑**：支持在线编辑他人 Skill，生成新版本（不影响原始内容）
- **新增热门榜单**：按下载量、评分、更新时间排序
- **像素风格 UI**：复古游戏机风格，像素字体、像素图标、帧动画
- **龙虾元素**：吉祥物、加载动画、空状态、成功提示

## Capabilities

### New Capabilities

- `skill-management`: Skill CRUD 能力，包括上传、详情、编辑、删除、下载
- `category-management`: 分类浏览能力，支持 15+ 预定义分类筛选
- `version-management`: 版本管理能力，支持多版本查看、下载指定版本
- `review-system`: 评测系统能力，支持评分（1-5 星）、文字评测、评测列表
- `fork-editing`: Fork 编辑能力，支持在线编辑他人 Skill 并生成新版本
- `search-discovery`: 搜索与发现能力，支持关键词搜索、热门榜单、分类筛选
- `pixel-ui-system`: 像素风格 UI 系统，包括像素字体、边框、图标、动画
- `lobster-mascot`: 龙虾吉祥物系统，包括加载动画、空状态、成功提示
- `file-upload-download`: 文件上传下载能力，支持 Skill 包上传、ZIP 下载
- `user-auth`: 用户认证能力（MVP 简化版：单用户或基础会话）

### Modified Capabilities

<!-- 无现有能力修改，此为首次实现 -->

## Impact

- **数据库**: 新增 `skills`、`categories`、`versions`、`reviews` 四张表，需编写 Prisma Schema 与迁移脚本
- **API**: 新增 20+ 个 RESTful 接口（仅 GET/POST）
- **前端**: 新增 10+ 个页面组件，使用像素风格设计（Tailwind CSS + 自定义组件）
- **技能依赖**: frontend-design-ultimate（样式）、ui-ux-pro-max-2（UI/UX 设计）、新增 pixel-art-generator（像素图生成）
- **素材资源**: 需准备像素字体、龙虾 Sprite 图、像素图标集
- **后续影响**: 为多用户、权限控制、Skill 依赖管理、自动更新等功能预留扩展点

## Non-Goals（本次不做）

- 多用户系统与权限控制（MVP 使用单用户或基础会话）
- Skill 依赖管理与自动安装（后续迭代）
- Skill 自动更新通知（后续迭代）
- 付费 Skill 与支付系统（后续迭代）
- Skill 使用统计与分析（后续迭代）
- 移动端原生 App（仅响应式 Web）

## Success Criteria

- ✅ 用户可上传 Skill（包含 SKILL.md + 代码文件）
- ✅ 用户可浏览、搜索、下载他人 Skill
- ✅ 用户可 Fork 他人 Skill 并在线编辑生成新版本
- ✅ 用户可对 Skill 评分（1-5 星）和写评测
- ✅ 页面呈现完整像素风格（字体、边框、图标、动画）
- ✅ 龙虾元素贯穿全站（吉祥物、加载、空状态、成功提示）
- ✅ 页面加载时间 < 2s，交互响应时间 < 100ms
- ✅ 移动端（375px 宽度）完全可用
- ✅ 所有表单提交有加载态与成功/错误反馈（龙虾主题）
