# AgentHub 改造规划完成报告

> 从 markView（文档管理系统）改造为 AgentHub（像素风格龙虾主题 Skill 分享平台）

---

## 📋 项目概览

**参考平台**: https://xiaping.coze.site/（虾评 Skill - 精品优质 Skill 分享评测平台）

**产品定位**: 
- ✅ Skill 上传：用户可上传自己开发的 OpenClaw Agent Skills
- ✅ Skill 下载：浏览、搜索、下载他人分享的优质 Skill
- ✅ 在线编辑：支持 Fork 他人 Skill，在线编辑后下载（不影响原始内容）
- ✅ Skill 分类：15+ 分类（开发辅助、办公效率、自媒体、IT 互联网等）
- ✅ 评分系统：用户对 Skill 打分（1-5 星）、写评测
- ✅ 热门榜单：按下载量、评分、更新时间排序

**设计风格**: 
- 🎨 像素艺术（Pixel Art）风格
- 🦞 龙虾主题吉祥物
- 🕹️ 复古游戏机配色（GameBoy 绿、NES 红蓝）

---

## 🏗️ 已完成的 OpenSpec 规划

### 变更名称：`agenthub-skill-platform`

**位置**: `openspec/changes/agenthub-skill-platform/`

**产物清单**:
```
agenthub-skill-platform/
├── proposal.md                 # 产品提案
├── design.md                   # 技术方案
├── tasks.md                    # 实现任务（19 个阶段，128 个任务）
└── specs/
    ├── skill-management/       # Skill 管理（上传、浏览、编辑、删除）
    ├── category-management/    # 分类管理（15+ 预定义分类）
    ├── version-management/     # 版本管理（多版本、下载指定版本）
    ├── review-system/          # 评测系统（评分、文字评测）
    ├── fork-editing/           # Fork 编辑（在线编辑、不影响原作）
    ├── search-discovery/       # 搜索与发现（搜索、榜单、推荐）
    ├── pixel-ui-system/        # 像素 UI 系统（字体、边框、图标、动画）
    ├── lobster-mascot/         # 龙虾吉祥物（加载、空状态、成功提示）
    ├── file-upload-download/   # 文件上传下载（ZIP 处理）
    └── user-auth/              # 用户认证（MVP 简化版）
```

---

## 📊 核心功能规划

### 1. 数据模型（四级结构）

```
Category (分类)
  └── Skill (Skill)
        └── Version (版本)
        └── Review (评测)
```

**Prisma Schema**:
- `Category`: 分类（name、slug、icon、sortOrder）
- `Skill`: Skill 元数据（name、slug、description、author、downloads、rating）
- `Version`: 版本（version、changelog、files、isLatest）
- `Review`: 评测（rating、content、author、isHelpful）

### 2. API 设计（20+ 接口）

| 模块 | 接口数 | 核心功能 |
|------|--------|----------|
| Skill 管理 | 6 | CRUD、Fork |
| 分类管理 | 2 | 列表、筛选 |
| 版本管理 | 4 | 列表、下载、发布 |
| 评测系统 | 4 | 评分、评测、有用 |
| 搜索发现 | 4 | 搜索、热门、高分、最新 |
| 文件处理 | 1 | 上传 |

**HTTP 约定**: 仅 GET/POST

### 3. 前端页面（10+ 页面）

| 页面 | 路由 | 功能 |
|------|------|------|
| 首页 | `/` | 推荐 Skill、热门榜单 |
| Skill 列表 | `/skills` | 筛选、搜索、分页 |
| Skill 详情 | `/skills/[slug]` | 详情、版本、评测 |
| Skill 上传 | `/skills/upload` | 上传表单 |
| Skill 编辑 | `/skills/[slug]/edit` | 在线编辑器 |
| 分类页 | `/categories/[slug]` | 分类下 Skill |
| 热门榜 | `/trending` | 下载量 Top20 |
| 高分榜 | `/top-rated` | 评分 Top20 |
| 最新上架 | `/new` | 时间排序 |

---

## 🎨 设计风格规范

### 像素风格系统

**字体**:
- 标题：Press Start 2P（Google Fonts 免费）
- 正文：VT323（Google Fonts 免费）

**配色**:
```css
--gameboy-green: #0f380f;      /* GameBoy 深绿 */
--lobster-red: #e74c3c;        /* 龙虾红 */
--pixel-pink: #ff6b9d;         /* 像素粉 */
--pixel-blue: #4ecdc4;         /* 像素蓝 */
--pixel-yellow: #ffe66d;       /* 像素黄 */
--bg-cream: #f7f3e8;           /* 米白背景 */
```

**边框**: 像素化边框（阶梯状，非圆角）

**动画**: CSS Sprite 帧动画（steps 函数）

### 龙虾元素应用场景

| 场景 | 龙虾元素 | 实现方式 |
|------|----------|----------|
| 首页 | 大龙虾吉祥物 | SVG 像素龙虾 |
| 加载 | 龙虾走路 | 4 帧 Sprite 动画 |
| 空状态 | 龙虾摊手 | 像素插画 |
| 成功 | 龙虾举旗 | 庆祝动画 |
| 错误 | 龙虾困惑 | 表情动画 |
| 404 | 龙虾迷路 | 场景插画 |
| 评分 | 龙虾钳子 | 代替星星 |

---

## 📦 新增 Skills

已创建 4 个配套 Skills：

### 1. `pixel-art-generator`
- **功能**: AI 生成像素风格图标和插画
- **用途**: 生成分类图标、龙虾吉祥物、像素素材
- **输出**: PNG、CSS Sprite、SVG

### 2. `lobster-sprites`
- **功能**: 完整的龙虾吉祥物 Sprite 素材包
- **内容**: 走路、庆祝、空状态、404、成功、错误、加载
- **格式**: PNG + CSS keyframes

### 3. `skill-validator`
- **功能**: 验证 Skill 包结构与安全性
- **检查**: SKILL.md 格式、文件结构、敏感操作、凭证泄露
- **输出**: ValidationResult（valid、errors、riskLevel）

### 4. `zip-handler`
- **功能**: ZIP 文件打包与解压
- **用途**: Skill 上传（解压）、下载（打包）
- **API**: unzipSkill、zipSkill、downloadAsZip

---

## 🚀 实现任务清单

**总计**: 19 个阶段，128 个任务

### Phase 1-2: 基础设施（Day 1-2）
- 改造 Next.js 项目结构
- 配置像素字体与样式
- 数据库 Schema 与迁移

### Phase 3-4: Skill 核心（Day 3-6）
- Skill CRUD API
- Skill 列表页、详情页
- Skill 上传、编辑功能

### Phase 5-6: 分类与版本（Day 7-8）
- 分类筛选
- 版本管理
- 下载功能

### Phase 7-8: 评测与榜单（Day 9-10）
- 星级评分（龙虾钳子）
- 评测系统
- 热门/高分榜单

### Phase 9-11: Fork 编辑（Day 11-13）
- Fork 功能
- Monaco 编辑器
- 版本创建

### Phase 12-14: 像素 UI（Day 14-16）
- 像素组件库（Card、Button、Border）
- 像素图标集
- 像素动画系统

### Phase 15-16: 龙虾元素（Day 17-18）
- 龙虾吉祥物组件
- Sprite 动画
- 空状态/成功提示

### Phase 17-19: 测试部署（Day 19-21）
- 测试与优化
- 部署上线
- 文档编写

**预计工期**: 21 个工作日（约 1 个月）

---

## 🎯 与 markView 的差异

| 维度 | markView（旧） | AgentHub（新） |
|------|---------------|---------------|
| **业务模型** | 项目→分类→文档 | Skill→分类→版本→评测 |
| **核心功能** | 文档编辑、Markdown 渲染 | Skill 上传下载、Fork 编辑、评分 |
| **设计风格** | C 端现代极简 | 像素风格 + 龙虾主题 |
| **文件处理** | Markdown 文件 | ZIP Skill 包 |
| **用户系统** | 无（MVP） | 无（MVP 简化版） |
| **特色功能** | Markdown 编辑器 | 在线编辑（Monaco）、安全扫描 |

---

## ⚠️ 改造注意事项

### 需要保留的代码
- Next.js 基础架构
- API 响应格式封装
- 错误处理中间件
- 基础布局组件

### 需要重写的代码
- 数据模型（Prisma Schema）
- 所有业务页面
- 所有 API 接口
- UI 组件库（改为像素风格）

### 需要新增的代码
- 像素风格组件库
- 龙虾吉祥物组件
- ZIP 文件处理
- Skill 验证逻辑
- Monaco 编辑器集成

---

## 🛠️ 下一步行动

### 方式一：使用 Qwen Code 开始实现

```bash
cd /Users/admin/markView
# 在 Qwen Code 聊天中输入：
/opsx:apply agenthub-skill-platform
```

### 方式二：手动开始第一个任务

```bash
cd /Users/admin/markView

# 1. 备份现有代码（如需要）
git checkout -b markview-backup

# 2. 开始任务 1.1：改造 Next.js 项目结构
# 删除旧的 app 目录，创建新的 AgentHub 结构
rm -rf app/
mkdir -p app/skills app/categories app/api

# 3. 安装像素字体
npm install @fontsource/press-start-2p @fontsource/vt323

# 4. 继续后续任务...
```

### 方式三：继续使用当前 AI 助手

告诉我：「开始实现 AgentHub 任务 1.1」，我会帮你逐步实现。

---

## 📚 参考文档

- **Proposal**: `openspec/changes/agenthub-skill-platform/proposal.md`
- **Design**: `openspec/changes/agenthub-skill-platform/design.md`
- **Tasks**: `openspec/changes/agenthub-skill-platform/tasks.md`
- **Specs**: `openspec/changes/agenthub-skill-platform/specs/*/spec.md`
- **参考平台**: https://xiaping.coze.site/

---

## 🦞 吉祥物设计建议

### 龙虾角色设定
- **名字**: 小鳌（Aoli）
- **性格**: 热情、专业、乐于助人
- **口头禅**: 「这个 Skill 真钳（前）所未有！」
- **动作**: 
  - 走路：左右摇摆
  - 庆祝：举旗挥舞
  - 困惑：挠头
  - 成功：比耶

### 应用场景
- Logo：龙虾钳子夹着代码符号
- 加载：龙虾走路循环
- 空状态：龙虾摊手「空空如也」
- 404:龙虾迷路「这里没有 Skill」
- 成功：龙虾举旗「上传成功」

---

**规划完成时间**: 2026-03-23  
**预计开发周期**: 21 个工作日  
**下一步**: 开始实现任务 1.1（项目初始化）

准备好开始了吗？🦞✨
