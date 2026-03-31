---
name: project-init
description: 自动分析当前项目的技术栈与目录结构，生成 01-项目概述.md、03-项目结构.md 以及用户选择的自定义规则（04/05/06/07/09）。当需要初始化项目规范、生成项目概述、填写项目信息或根据项目生成自定义规则时使用本技能。
version: 2.0.0
---

# 项目规范初始化

## 触发条件

当用户输入以下类似指令时，调用此技能：

- "初始化项目规范"
- "生成项目概述"
- "填写 01 和 03"
- "分析项目技术栈"
- "生成项目结构文档"
- "根据项目生成自定义规则"
- "自定义 04/05/06/07/09"
- "生成项目规则"

## 前置要求

1. 当前工作区必须是一个前端项目（存在 `package.json`）。
2. `.agents/rules/` 目录已存在（通过 `install.sh` 或手动创建）。

## 执行步骤

### 第零步：确定规则生成范围

检查 `.agents/rules/` 目录下的规则文件，确定哪些规则需要生成：

**必定生成**：
- `01-项目概述.md` — 始终生成/更新
- `03-项目结构.md` — 始终生成/更新

**按需生成**（安装时用户选择了"根据项目自定义"的规则）：

| 编号 | 文件名 | 规则内容 |
|------|--------|----------|
| 04 | `04-组件规范.md` | 组件结构、目录组织、编写约定 |
| 05 | `05-API规范.md` | 接口目录、请求封装、命名、错误处理 |
| 06 | `06-路由规范.md` | 路由配置、懒加载、守卫、目录结构 |
| 07 | `07-状态管理.md` | Store 目录、模块划分、编写规范 |
| 09 | `09-样式规范.md` | 样式方案、主题变量、全局样式 |

**判断逻辑**：
- 如果上述规则文件在 `.agents/rules/` 中**不存在**，说明安装时被用户选为自定义规则，需要根据项目实际情况生成
- 如果已存在且内容非模板（已有实际内容），则跳过，不覆盖
- 将所有需要生成的自定义规则编号记入 `待生成列表`

### 第一步：采集项目信息

依次读取以下文件，提取关键信息：

**1.1 读取 `package.json`**

提取以下字段，构建技术栈清单：

| 提取目标 | 查找位置 | 示例 |
|----------|----------|------|
| UI 框架 | `dependencies` 中的 `react` / `vue` / `angular` | React ^18.3.1 |
| 类型系统 | `devDependencies` 或 `dependencies` 中的 `typescript` | 有 → TypeScript 5.x；无 → JavaScript 项目 |
| 构建工具 | `devDependencies` 中的 `vite` / `webpack` / `next` / `nuxt` | Vite 5.x |
| 路由管理 | `dependencies` 中的 `react-router*` / `vue-router` | React Router ^6.x |
| 状态管理 | `dependencies` 中的 `zustand` / `pinia` / `redux` / `mobx` | Zustand ^5.x |
| 组件库 | `dependencies` 中的 `antd` / `element-plus` / `@mui/*` | Ant Design 5.x |
| 样式方案 | 文件后缀（`.module.scss` / `.css` / `tailwind`） + `devDependencies` | SCSS Modules |
| HTTP 请求 | `dependencies` 中的 `axios` / `@tanstack/react-query` 或自有封装 | axios |
| Hooks 工具 | `dependencies` 中的 `ahooks` / `@vueuse/core` | ahooks 3.x |
| 工具函数 | `dependencies` 中的 `lodash*` / `ramda` / `date-fns` / `dayjs` | lodash-es |
| 时间工具 | `dependencies` 中的 `dayjs` / `moment` / `date-fns` | dayjs |

**1.2 扫描 `src/` 目录结构**

执行 `ls src/` 或读取文件树，记录：

- 顶层目录列表及各目录的用途推断
- 入口文件（按仓库实际：`main.tsx` / `main.ts` / `main.jsx` / `main.js`，以及 `App.tsx` / `App.jsx` / `App.vue` 等）
- 路由目录的组织模式（文件路由 vs 配置路由）

**1.3 检测项目类型**

根据采集结果判断项目类型：

- SPA（单页应用）：存在 `react-router` / `vue-router` + 无 SSR 框架
- SSR/SSG：存在 `next` / `nuxt` / `remix`
- 微前端子应用：存在 `qiankun` / `micro-app` / `wujie`
- 组件库/工具库：`main` 字段指向 lib 产物
- Monorepo：存在 `workspaces` 或 `pnpm-workspace.yaml`

**1.4 判定 TypeScript 与 JavaScript**

- 若 `package.json` 的 `devDependencies` 或 `dependencies` 中存在 **`typescript`** → **TypeScript 项目**。
- 否则 → **JavaScript 项目**（仅全局安装 `tsc`、未在 package.json 声明依赖时，仍按 JavaScript 处理，除非用户手动改 01）。

**1.5 针对自定义规则的深度采集**

仅对 `待生成列表` 中的规则执行对应的深度扫描：

**若 04（组件规范）在待生成列表中**：
- 扫描 `src/components/` 目录，记录组件目录组织方式（扁平 / 按名称分目录 / 其他）
- 随机读取 2-3 个 `.vue` / `.tsx` / `.jsx` 文件，检测：
  - SFC 写法：`<script setup>` / `<script setup lang="ts">` / Options API / JSX
  - Props 定义方式：`defineProps<>()` / `defineProps({})` / `interface` / `PropTypes`
  - Emits 定义方式：`defineEmits` / `$emit` / 回调函数
- 检测组件层级：是否存在 `src/views/*/components/` 模式
- 检测组件库：从 `package.json` 的 `dependencies` 推断（`element-plus` / `antd` / `@mui/*` 等）

**若 05（API 规范）在待生成列表中**：
- 扫描 `src/api/` 或 `src/services/` 或 `src/request/` 目录是否存在
- 读取 2-3 个接口文件，检测：
  - HTTP 库：`axios` / `fetch` / 自有封装（如 `@koi-design/vix-tools` 的 `request`）
  - 函数命名模式：`getXxxApi` / `fetchXxx` / `xxxService` 等
  - 是否存在类型定义目录（`types/` / `models/`）
  - 错误处理模式：统一拦截 / 业务内处理
- 检测全局请求配置位置

**若 06（路由规范）在待生成列表中**：
- 扫描 `src/router/` 目录结构
- 检测路由组织模式：
  - 是否存在 `modules/` 子目录（按模块拆分）
  - 是否使用文件路由（Next.js / Nuxt 约定）
  - 入口文件名：`index.ts` / `index.js`
- 读取路由配置文件，检测：
  - 懒加载方式：`() => import()` / `React.lazy()` / 静态导入
  - 是否使用 `meta` 字段
  - 是否有全局守卫
- 扫描页面目录：`src/views/` / `src/pages/` 的组织方式

**若 07（状态管理）在待生成列表中**：
- 扫描 `src/store/` 或 `src/stores/` 目录
- 从 `package.json` 确认状态库：`pinia` / `vuex` / `zustand` / `redux` / `mobx`
- 读取 2-3 个 store 文件，检测：
  - 编写方式：Setup Store / Options Store / Slice / createStore
  - 命名约定：`useXxxStore` / `xxxStore` / `xxxSlice`
  - 是否有类型定义文件
  - 是否使用持久化插件
- 检测 store 模块拆分方式

**若 09（样式规范）在待生成列表中**：
- 统计 `src/` 下样式文件后缀分布：`.css` / `.scss` / `.less` / `.module.scss` / `.module.css`
- 检测 Vue SFC 中 `<style>` 的使用：`scoped` / `module` / 无限定
- 检测 CSS 变量/主题使用：
  - 是否存在 `src/styles/` 目录
  - 是否使用 CSS 变量（`var(--xxx)`）
  - 是否引入组件库主题覆盖
- 检测是否使用 Tailwind CSS（`tailwind.config.*` 是否存在）

### 第二步：生成 01-项目概述.md

在 `.agents/rules/` 下生成（或覆盖）`01-项目概述.md`，严格使用以下模板：

```markdown
---
alwaysApply: false
description: 项目定位与技术栈概览。当需要了解项目背景、使用的技术栈时读取此规则。
---

# 项目概述

## 项目定位

<!-- 一句话描述，格式："一个基于 [框架] + [语言] 的 [类型]。" -->
一个基于 {框架} + {语言} 的{项目类型}。

## 技术栈

| 领域 | 技术 | 说明 |
|------|------|------|
| UI 框架 | {名称} {版本} | {约束说明} |
| 类型系统 | {名称} {版本} | {约束说明} |
| 构建工具 | {名称} {版本} | {说明} |
| 路由管理 | {名称} {版本} | - |
| 状态管理 | {名称} {版本} | {约束说明} |
| 组件库 | {名称} {版本} | {说明} |
| 样式方案 | {方案名称} | {约束说明} |
| HTTP 请求 | {库名称} | {说明} |
| ... | ... | ... |
```

**填写规则**：

- 版本号从 `package.json` 中取实际值，保留前缀（`^` / `~`）
- "说明"列：核心强制依赖标注"强制使用"，辅助工具标注"优先使用"或用途说明
- 只列出项目**实际使用**的技术，不要猜测或补全未安装的依赖
- 如果检测到私有包（如 `@company/*`），单独列出并标注用途

**TypeScript 与 JavaScript 分支（1.4）**：

- **TypeScript 项目**：`## 项目定位` 中 `{语言}` 填 **TypeScript**；技术栈表「类型系统」写实际版本与约束（与 profile 默认一致时可写「强制使用；详见 02-编码规范」）。
- **JavaScript 项目**：`## 项目定位` 中 `{语言}` 填 **JavaScript**；「类型系统」行写 **JavaScript**，说明列写「无本地 TypeScript 依赖；类型意图通过 JSDoc、运行时校验等表达，见 02-编码规范」；**技术约束**须改写为引用 02 的 JavaScript 小节，禁止写「必须 `<script setup lang="ts">`」类强制 TS 表述或「禁止 JavaScript」。

### 第三步：生成 03-项目结构.md

在 `.agents/rules/` 下生成（或覆盖）`03-项目结构.md`，严格使用以下模板：

```markdown
---
alwaysApply: false
description: 项目的目录结构规范，定义了 src 目录下各目录的用途与约束。当需要确定代码应放在哪个目录时读取此规则。
---

# 项目结构（NON-NEGOTIABLE）

## 目录结构

\```
src/
├── {目录名}/      # {用途描述}
├── {目录名}/      # {用途描述}
└── 根级文件        # {入口文件列表}
\```

## 结构约束

| 类型 | 目录 | 规范 |
|------|------|------|
| {类型} | `src/{目录}/` | {该目录的组织规范} |
| ... | ... | ... |
```

**填写规则**：

- 目录树必须反映 `src/` 下的**实际目录**，不要添加不存在的目录
- 每个目录的用途从其内部文件推断（读取 2-3 个文件确认）
- 如果存在路由目录，附加「路由目录内的组件放置规则」章节
- 如果项目有 Mock 数据约定，附加「Mock 数据策略」章节
- **脚本扩展名**：目录树「根级文件」、表格中的示例文件名、Mock/API/types 等段落，须与 `src/` 中**实际使用的扩展名**一致（`.ts` / `.tsx` / `.js` / `.jsx`）；勿写死为 `.ts`。若同一目录混用多种扩展名，以占比最高或入口文件为准，并在文末注明「以仓库实际文件为准」。

### 第三步续：生成自定义规则

仅对 `待生成列表` 中的规则执行此步骤。每个规则都保持与标准规范相同的 frontmatter 结构和章节骨架，但内容替换为项目实际使用的模式。

#### 3A. 生成 04-组件规范.md

使用以下模板，根据 1.5 采集结果填充：

```markdown
---
alwaysApply: false
globs: {根据框架设定，Vue 用 ["**/*.vue", "**/components/**"]，React 用 ["**/*.tsx", "**/*.jsx", "**/components/**"]}
description: 项目的组件规范，包括组件结构、Props/Emits 定义、组件目录结构、组件层级规划。当创建、修改、重写、重构或拆分组件时读取此规则。
---

# 组件规范

## 组件结构（NON-NEGOTIABLE）

{根据检测到的组件写法描述，例如：}
{Vue + script setup: 描述 SFC 约定、defineProps/defineEmits 模式}
{React + TSX: 描述函数组件、Props 接口定义模式}
{如果是 JavaScript 项目，调整为 JSDoc 或 PropTypes 表述}

## 组件目录结构

{根据实际 src/components/ 目录组织方式描述}
{包含实际的目录树示例}

## 组件层级规划

{根据是否存在 src/views/*/components/ 等模式描述}
{包含组件放置决策树}

## 组件编写要点

{根据检测到的组件库和编写模式描述}
```

**填写原则**：
- 所有约定必须反映项目**实际使用**的模式，不要套用标准规范的硬编码内容
- 如果项目使用 JavaScript 而非 TypeScript，Props/Emits 的类型描述改为 JSDoc 或 `PropTypes`
- 组件库名称使用项目**实际安装**的库名
- 文件扩展名使用项目**实际使用**的扩展名

#### 3B. 生成 05-API规范.md

使用以下模板：

```markdown
---
alwaysApply: false
description: 项目的 API 规范，包括接口目录结构、请求封装、函数命名约定、类型定义、错误处理原则。当新增、修改、重构或重写接口时读取此规则。
---

# API 规范

## 目录结构

{根据实际 src/api/ 或 src/services/ 目录生成树形结构}

## 接口请求规范

{根据检测到的 HTTP 库和封装方式描述}
{包含实际使用的请求函数示例代码}

## 接口函数命名（NON-NEGOTIABLE）

{根据检测到的命名模式生成命名规则表格}
| 操作 | 命名规则 | 示例 |
|------|----------|------|
{填入项目实际使用的命名模式}

## 接口错误处理

{根据检测到的错误处理模式描述}
```

**填写原则**：
- HTTP 库写项目**实际使用**的库名（axios / fetch / 自有封装等）
- 命名规则从现有接口文件中**归纳**，而非硬编码
- 如果项目使用 JavaScript，类型定义部分改为 JSDoc 或省略
- 目录路径和文件扩展名使用实际值

#### 3C. 生成 06-路由规范.md

使用以下模板：

```markdown
---
alwaysApply: false
description: 项目的路由规范，包括路由配置结构、懒加载、导航守卫、路由 meta 定义。当新增、修改页面或配置路由时读取此规则。
---

# 路由规范（NON-NEGOTIABLE）

## 路由结构

{根据实际路由目录组织描述}
{包含路由目录树}

## 懒加载（NON-NEGOTIABLE）

{根据检测到的懒加载方式描述}
{包含实际使用的懒加载代码示例}

## 路由 Meta 规范

{如果项目使用了 meta 字段，描述其类型和用途}

## 导航守卫

{根据检测到的守卫使用方式描述}

## 约束

{根据项目实际的路由约束描述}
```

**填写原则**：
- 路由库使用项目**实际安装**的库（`vue-router` / `react-router` / 文件路由等）
- 页面目录使用项目**实际使用**的目录名（`views` / `pages` 等）
- 懒加载示例使用项目**实际使用**的语法

#### 3D. 生成 07-状态管理.md

使用以下模板：

```markdown
---
alwaysApply: false
description: 项目的状态管理规范，定义全局状态管理方案与编写约定。当新增、修改或重构状态管理时读取此规则。
---

# 状态管理规范（NON-NEGOTIABLE）

## 基础规范

{根据检测到的状态库描述，例如：仅 Pinia / Zustand / Redux 等}
{包含目录约束}

## 目录结构

{根据实际 src/store/ 或 src/stores/ 目录生成树形结构}

## Store 编写规范

{根据检测到的编写方式描述}
{包含实际使用的 store 代码示例}

## 在组件中使用

{描述 store 在组件中的使用方式}

## 持久化

{如果检测到持久化插件，描述其用法}

## Store 拆分原则

{根据实际模块拆分方式描述}
```

**填写原则**：
- 状态库名称使用项目**实际安装**的库
- 编写方式（Setup Store / Options Store / Slice 等）从实际代码中**归纳**
- 如果项目使用 JavaScript，类型定义部分改为 JSDoc 或省略

#### 3E. 生成 09-样式规范.md

使用以下模板：

```markdown
---
alwaysApply: false
globs: {根据实际样式文件类型设定，例如 ["**/*.vue", "**/*.scss", "**/*.css"]}
description: 项目的样式规范，包括样式方案选型、主题变量、全局样式管理。当编写、修改组件样式或主题适配时读取此规则。
---

# 样式规范

## 基础原则

{根据检测到的样式方案描述，例如：}
{CSS Modules / Scoped / Tailwind / CSS-in-JS 等}

## 主题/CSS 变量

{如果项目使用了 CSS 变量，列出变量命名规范}
{如果使用组件库主题，描述主题覆盖方式}
{如果使用 Tailwind，描述自定义配置}

## 暗色/浅色模式

{如果项目支持主题切换，描述切换机制}
{如果不支持，可省略此章节}

## 全局样式

{描述 src/styles/ 目录的用途与文件组织}
```

**填写原则**：
- 样式方案使用项目**实际使用**的方案
- CSS 变量名从 `src/styles/` 中**实际存在的变量**归纳
- 如果项目使用 Tailwind，替换 CSS 变量相关章节为 Tailwind 配置说明
- 组件库主题覆盖使用项目**实际使用**的组件库名

### 第四步：同步 openspec/project.md

如果项目中存在 `openspec/project.md`，将其 `## 项目概述` 下方的描述同步更新为第二步中生成的「项目定位」一句话描述，保持与 `01-项目概述.md` 中的 `## 项目定位` 一致。

**操作规则**：

- 仅替换 `## 项目概述` 与下一个 `##` 标题之间的描述文本
- 不修改 `project.md` 中的其他内容（技能与规范表格、规则索引等）
- 如果 `openspec/project.md` 不存在，跳过此步骤

### 第五步：用户确认

生成完毕后，输出简要总结并询问用户：

1. 展示检测到的技术栈（表格）
2. 展示检测到的目录结构（树形图）
3. 展示将写入 `openspec/project.md` 的项目概述描述
4. 如果有自定义规则，展示每个自定义规则的关键检测结果：
   - 04：检测到的组件模式（如 "SFC + script setup + defineProps 泛型"）
   - 05：检测到的 API 模式（如 "axios + getXxxApi 命名 + 统一错误拦截"）
   - 06：检测到的路由模式（如 "vue-router + modules 拆分 + 动态导入懒加载"）
   - 07：检测到的状态模式（如 "Pinia + Setup Store + useXxxStore 命名"）
   - 09：检测到的样式模式（如 "SCSS Modules + CSS 变量主题 + scoped 备选"）
5. 询问："以上信息是否准确？是否需要补充或修改？"

等待用户确认后再写入文件。

---

## 注意事项

- 如果 `01-项目概述.md` 或 `03-项目结构.md` 已存在且内容非模板（已被用户编辑过），应先展示差异，由用户决定是覆盖还是合并。
- 自定义规则（04/05/06/07/09）仅在文件**不存在**时才生成。如果文件已存在，说明用户选择了标准规范或已手动编辑，不应覆盖。
- 本技能生成 `01-项目概述.md`、`03-项目结构.md`、用户选择的自定义规则，并同步 `openspec/project.md` 的项目概述。其他规范文件保持原样不动。
- 如果项目不是前端项目（无 `package.json`），应提示用户手动填写，并提供空白模板。
- 自定义规则生成时，**严禁**照搬标准规范的内容。所有约定必须从项目实际代码中归纳，确保规则与项目实际使用方式一致。
