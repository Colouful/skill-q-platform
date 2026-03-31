---
name: rules-index
description: 规范目录索引。安装到目标项目后此目录为扁平结构（common + profile 合并），此处为源仓库的分层结构。
---

# 规范目录结构

本目录采用 **common + profiles** 分层组织：

## common/ — 技术栈无关的通用规范

| 文件 | 用途 |
|------|------|
| `02-编码规范.md` | TypeScript / JavaScript、命名、函数命名 |
| `05-API规范.md` | 接口命名、错误处理（通用原则） |
| `08-通用约束.md` | 中文注释、可观测性、占位元素 |
| `10-文档规范.md` | 注释与 JSDoc |
| `11-测试规范.md` | 测试覆盖与质量门禁 |
| `12-Superpowers执行规范.md` | 实现阶段的 Superpowers Loop |
| `13-代码格式化与检查.md` | ESLint、Prettier、Stylelint、husky（提交校验可选） |
| `14-审计汇报规范.md` | 执行审计报告格式与约束 |

## profiles/ — 技术栈特定规范

### profiles/react/

| 文件 | 用途 |
|------|------|
| `01-项目概述.md` | React + TS + Vite + Antd + Zustand |
| `03-项目结构.md` | src 目录约束 |
| `04-组件规范.md` | TSX 组件、SCSS Modules |
| `06-路由规范.md` | React.lazy 懒加载、集中管理 |
| `07-状态管理.md` | Zustand（推荐）或 Redux |
| `09-样式规范.md` | SCSS Modules + Antd 主题变量 |

### profiles/vue/

| 文件 | 用途 |
|------|------|
| `01-项目概述.md` | Vue 3 + TS + Vite + Pinia + Vue Router |
| `03-项目结构.md` | views/composables/stores 目录约束 |
| `04-组件规范.md` | SFC、script setup、props/emits |
| `06-路由规范.md` | Vue Router + 页面目录 |
| `07-状态管理.md` | Pinia |
| `09-样式规范.md` | 组件库主题 token |

## 安装后的目标项目结构

`install.sh --profile react` 会将 `common/` + `profiles/react/` 合并为扁平目录：

```
目标项目/.agents/rules/
├── 01-项目概述.md      ← profiles/react/
├── 02-编码规范.md      ← common/
├── 03-项目结构.md      ← profiles/react/
├── ...
├── 12-Superpowers执行规范.md  ← common/
├── 13-代码格式化与检查.md      ← common/
└── 14-审计汇报规范.md          ← common/
```

---

## 快速查找

| 需求 | 规范文件 |
|------|----------|
| 项目背景是什么？使用哪些技术栈？ | 01-项目概述 |
| 如何命名函数/变量？ | 02-编码规范 |
| 代码放在哪个目录？ | 03-项目结构 |
| 如何创建/拆分组件？ | 04-组件规范 |
| 如何调用接口？ | 05-API规范 |
| 如何配置路由？ | 06-路由规范 |
| 如何管理全局状态？ | 07-状态管理 |
| 有哪些通用约束？ | 08-通用约束 |
| 如何使用主题变量？ | 09-样式规范 |
| 如何写注释？ | 10-文档规范 |
| 有何测试要求？ | 11-测试规范 |
| 开始执行 tasks.md 的编码执行模式？ | 12-Superpowers执行规范 |
| 如何配置代码格式化与检查？ | 13-代码格式化与检查 |
| AI 执行后的审计报告格式？ | 14-审计汇报规范 |

## 当前项目规则索引（扁平目录）

以下索引对应当前项目 `.agents/rules/` 的实际文件，适合直接检索与跳转：

| 规则文件 | 何时查看 | 一句话说明 |
|------|------|------|
| `01-项目概述.md` | 新成员入项、方案评审前 | 项目定位与技术栈总览（Next.js + TypeScript + App Router） |
| `02-编码规范.md` | 编码前、Code Review 时 | 命名、类型、函数写法等基础编码约束 |
| `03-项目结构.md` | 新增模块/文件时 | `src/` 目录职责与放置规则 |
| `04-组件规范.md` | 新建/拆分 React 组件时 | 组件导出方式、分层策略与目录组织 |
| `05-API规范.md` | 新增 API 或客户端请求时 | `app/api` 路由处理与 `fetchApi` 调用约定 |
| `06-路由规范.md` | 新增页面、动态路由时 | App Router 文件路由与 Server/Client 边界 |
| `07-状态管理.md` | 设计跨组件状态时 | Context/Provider 状态组织与持久化约束 |
| `08-通用约束.md` | 任意实现任务开始前 | 跨模块通用红线与协作约束 |
| `09-样式规范.md` | 编写样式与主题适配时 | Tailwind v4 + CSS 变量 + 多主题规则 |
| `10-文档规范.md` | 增加注释、说明文档时 | 注释层级、JSDoc 与文档清晰度要求 |
| `11-测试规范.md` | 编写单测/集成测试时 | 测试分层、覆盖率与质量门禁 |
| `12-Superpowers执行规范.md` | 执行 `tasks.md` 时 | Superpowers Loop 执行流程规范 |
| `13-代码格式化与检查.md` | 提交前自检时 | lint/format/check 的执行顺序与标准 |
| `14-审计汇报规范.md` | 任务完成准备交付时 | 变更审计报告结构与输出要求 |

### 推荐查阅顺序

`01 → 03 → 02 →（按任务类型阅读 04/05/06/07/09）→ 11 → 13 → 14`

## 使用说明

1. 根据需要的规范类型，查找对应的模块文件
2. 所有规范文件均为 `alwaysApply: false`，按需读取而非自动加载
3. 详细示例与落地步骤见 `.agents/skills/` 目录下的技能文件
