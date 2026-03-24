# AgentHub 多主题切换系统项目总览

> 📅 创建时间：2026-03-24  
> 🎯 状态：**Pending**（等待执行）  
> 📋 依赖：`agenthub-dual-platform`（双轨制平台完成后执行）

---

## 🎯 项目目标

将 AgentHub 从单一像素风格扩展为**多主题系统**，支持三款主题无刷新丝滑切换：

| 主题 | 风格 | 描述 | 配色 |
|------|------|------|------|
| **Pixel** | 像素风 | 8-bit 游戏怀旧，龙虾元素 | 🔵 蓝色系 |
| **Apple** | 现代风 | 现代简约，类似 Apple 官网 | 💙 Apple 蓝 |
| **Sketch** | 手绘风 | 温馨创意，手绘纸张质感 | 🎨 珊瑚红 |

---

## 📁 项目文件结构

```
openspec/changes/theme-system/
├── .openspec.yaml          ✅ 已创建 - OpenSpec 配置
├── proposal.md             ✅ 已完成 - 项目提案
├── design.md               ✅ 已完成 - 技术设计（21KB）
├── tasks.md                ✅ 已创建 - 实施任务清单
└── PROJECT_OVERVIEW.md     ✅ 本文件 - 项目总览
```

---

## 🚀 核心特性

### 1. 三款完整主题

- **像素风（Pixel）**：保留现有风格，游戏怀旧
- **Apple 风（Modern）**：现代简约，极致优雅
- **手绘风（Sketch）**：温馨创意，纸张质感

### 2. 无刷新丝滑切换

- ✅ 使用 CSS 变量系统（高性能）
- ✅ View Transition API（现代浏览器）
- ✅ 降级方案（旧浏览器）
- ✅ 切换时间 < 300ms
- ✅ 无闪烁、无卡顿

### 3. 主题配置化

- ✅ 每个主题独立配置文件
- ✅ 统一类型定义（TypeScript）
- ✅ 易于扩展新主题
- ✅ 代码集中管理

### 4. 用户偏好持久化

- ✅ localStorage 存储
- ✅ 刷新后保持
- ✅ 多标签页同步

### 5. 美观的切换器 UI

- ✅ 下拉菜单设计
- ✅ 主题预览色块
- ✅ 选中指示器
- ✅ 移动端适配（底部弹窗）

---

## 📊 与已完成项目的关系

```
┌─────────────────────────────────────────────────────────┐
│              AgentHub 项目演进路线                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Phase 1: agenthub-skill-platform ✅ 已完成            │
│  └─ 单一 Skill 平台（像素风格）                          │
│                                                         │
│  Phase 2: agenthub-dual-platform 📋 待执行             │
│  └─ 双轨制平台（Skill + Rule）                          │
│                                                         │
│  Phase 3: theme-system 📋 待执行（本次）               │
│  └─ 多主题切换（像素/Apple/手绘）                       │
│                                                         │
│  Future: 深色模式、自定义主题 🔮 规划中                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**执行顺序：**
1. 先完成 `agenthub-dual-platform`（双轨制）
2. 再执行 `theme-system`（多主题）

---

## 📋 实施阶段总览

| Phase | 名称 | 预计时间 | 主要产出 |
|-------|------|---------|---------|
| **Phase 1** | 主题系统基础设施 | Day 1-2 | ThemeProvider、类型定义 |
| **Phase 2** | CSS 变量系统 | Day 3-4 | 变量系统、样式迁移 |
| **Phase 3** | Apple 风主题 | Day 5-6 | Apple 风配置和测试 |
| **Phase 4** | 手绘风主题 | Day 7-8 | 手绘风配置和测试 |
| **Phase 5** | 主题切换器 UI | Day 9-10 | 切换器组件、动画 |
| **Phase 6** | 测试与优化 | Day 11-12 | 全测试、性能优化 |

**总计：** 12 天，250+ 任务

---

## 🎨 主题设计预览

### 像素风（Pixel）- 保留现有

```css
--color-primary: #4ecdc4;        /* 像素蓝 */
--font-family: "Press Start 2P"; /* 像素字体 */
--border-style: 4px solid;       /* 像素边框 */
--shadow: 6px 6px 0px;           /* 硬阴影 */
```

### Apple 风（Modern）- 现代简约

```css
--color-primary: #0071e3;        /* Apple 蓝 */
--font-family: -apple-system;    /* 系统字体 */
--border-radius: 12px;           /* 大圆角 */
--shadow: 0 4px 12px rgba();     /* 柔和阴影 */
```

### 手绘风（Sketch）- 温馨创意

```css
--color-primary: #ff6b6b;        /* 珊瑚红 */
--font-family: "Comic Sans MS";  /* 手写字体 */
--bg-pattern: url(paper.svg);    /* 纸张纹理 */
--transition: cubic-bezier(1.56);/* 弹性动画 */
```

---

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────────┐
│                   Theme System                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Pixel   │  │  Apple   │  │  Sketch  │              │
│  │  Theme   │  │  Theme   │  │  Theme   │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│         ↓              ↓              ↓                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Theme Config Files (src/themes/)         │  │
│  │  - pixel.theme.ts  - apple.theme.ts              │  │
│  │  - sketch.theme.ts - index.ts                    │  │
│  └──────────────────────────────────────────────────┘  │
│                           ↓                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │         ThemeProvider (React Context)            │  │
│  │  - useTheme() hook                               │  │
│  │  - localStorage persistence                      │  │
│  │  - View Transition API                           │  │
│  └──────────────────────────────────────────────────┘  │
│                           ↓                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │      CSS Variables (:root, [data-theme])         │  │
│  │  - 所有组件使用变量，无硬编码颜色                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 如何执行（在 Cursor 中）

### 方式 1: 使用 OpenSpec 技能

```bash
# 1. 打开 Cursor
cd /Users/admin/markView
cursor .

# 2. 在 Cursor 聊天中执行
/opsx apply theme-system

# 或直接执行：
npx openclaw-skill openspec-apply-change theme-system
```

### 方式 2: 手动执行任务

```bash
# 1. 查看任务清单
cat openspec/changes/theme-system/tasks.md

# 2. 按 Phase 逐个执行
# Phase 1: 主题系统基础设施
# Phase 2: CSS 变量系统
# ...
```

---

## 📈 成功标准

### 功能完整性

- ✅ 三款主题完整实现
- ✅ 切换器 UI 美观易用
- ✅ 无刷新丝滑切换
- ✅ 用户偏好持久化
- ✅ 所有组件支持主题

### 性能指标

- ✅ 切换时间 < 300ms
- ✅ 动画帧率 > 50fps
- ✅ 配置总大小 < 10KB
- ✅ Lighthouse > 90

### 用户体验

- ✅ 移动端完全可用
- ✅ 无闪烁、无卡顿
- ✅ 主题风格明显区分
- ✅ 视觉一致性好

### 代码质量

- ✅ 类型定义完整
- ✅ 单元测试覆盖率 > 80%
- ✅ 代码复用率 > 80%
- ✅ 文档完整清晰

---

## 🔧 技术栈

| 层级 | 技术 |
|------|------|
| **核心** | React Context + CSS Variables |
| **动画** | View Transition API + CSS Transition |
| **存储** | localStorage |
| **类型** | TypeScript |
| **样式** | TailwindCSS + CSS Modules |
| **测试** | Vitest + Playwright |

---

## 📚 相关文档

### OpenSpec 文档

- [Proposal](./proposal.md) - 项目提案
- [Design](./design.md) - 技术设计（21KB 详细）
- [Tasks](./tasks.md) - 实施任务清单
- [.openspec.yaml](./.openspec.yaml) - 配置

### 前置项目

- [agenthub-dual-platform](../agenthub-dual-platform/) - 双轨制平台（依赖）
- [agenthub-skill-platform](../agenthub-skill-platform/) - Skill 平台（基础）

---

## 🆘 常见问题

### Q: 为什么要等双轨制完成后再执行？

**A:** 主题系统会影响所有页面和组件。双轨制完成后，页面结构稳定，主题系统可以一次性覆盖所有页面，避免重复工作。

### Q: 主题切换真的无刷新吗？

**A:** 是的。使用 CSS 变量系统，仅更改变量值，无需重新加载页面或样式表。

### Q: 旧浏览器支持吗？

**A:** 支持。View Transition API 有降级方案，旧浏览器直接更改变量（无动画）。

### Q: 用户可以自定义主题吗？

**A:** MVP 不支持。预留了扩展接口，后续迭代可实现。

### Q: 如何添加新主题？

**A:** 创建新的主题配置文件（如 `custom.theme.ts`），在 `index.ts` 注册即可。

---

## 🎯 执行建议

### 开发顺序

1. **先完成双轨制**（`agenthub-dual-platform`）
   - 确保 Skill 和 Rule 功能完整
   - 确保所有页面正常

2. **再执行主题系统**（`theme-system`）
   - 在稳定基础上添加主题
   - 一次性覆盖所有页面

### 开发技巧

- **使用 Cursor AI 辅助**：生成主题配置、迁移样式
- **分阶段测试**：每个 Phase 完成后测试
- **性能优先**：始终关注切换速度和动画流畅度
- **用户反馈**：上线后收集反馈，持续优化

---

## 📞 项目联系人

- **项目负责人：** 哞哞🐮
- **技术栈：** Next.js + React + CSS Variables
- **项目地址：** `/Users/admin/markView`

---

*等双轨制完成后，在 Cursor 中执行 `/opsx apply theme-system` 开始主题开发！* 🎨✨🚀
