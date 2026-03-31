# Tasks: Skill 便捷安装功能

> **实现记录（仓库已落地）**：Phase 1–4 已按本文实现；OpenSpec 若未识别勾选任务，以代码与本文「实现记录」为准。

## Phase 1: 基础设施

### Task 1.1: 创建环境变量配置
- **文件**: `.env.example`, `docs/deploy-checklist.md`
- **内容**: 
  - 添加 `SKILLHUB_INSTALL_BASE_URL` 环境变量说明
  - 添加 `SKILLHUB_CLI_NAME` 环境变量说明（可选）
  - 更新部署检查清单
- **验收**: 
  - `.env.example` 包含新环境变量
  - 部署文档说明如何配置

### Task 1.2: 实现 Install Info API
- **文件**: `src/app/api/skills/[slug]/install-info/route.ts`
- **内容**:
  - 实现 `GET /api/skills/[slug]/install-info` 接口
  - 从环境变量读取安装脚本 URL
  - 生成 Agent 提示文本和安装命令
  - 处理 Skill 不存在和未发布情况
- **验收**:
  - API 返回正确格式的安装信息
  - 环境变量缺失时使用默认值
  - 未发布 Skill 返回 404

### Task 1.3: 添加 API 类型定义
- **文件**: `src/lib/install-types.ts`
- **内容**:
  - 定义 `SkillInstallInfo` 接口
  - 定义相关子类型
- **验收**:
  - 类型定义完整
  - 被 API 和前端组件正确使用

---

## Phase 2: 前端组件

### Task 2.1: 创建 InstallModeTabs 组件
- **文件**: `src/components/skill/install-mode-tabs.tsx`
- **内容**:
  - 实现「我是 Agent」和「我是 Human」两个 Tab
  - 支持点击切换
  - 应用像素风格设计
- **验收**:
  - Tab 切换功能正常
  - 选中状态正确显示
  - 像素风格符合设计规范

### Task 2.2: 创建 AgentInstallPrompt 组件
- **文件**: `src/components/skill/agent-install-prompt.tsx`
- **内容**:
  - 显示 Agent 安装提示文本
  - 实现复制按钮功能
  - 复制成功后显示提示
- **验收**:
  - 提示文本正确显示
  - 复制功能正常
  - 成功提示 2 秒后消失

### Task 2.3: 创建 HumanInstallScript 组件
- **文件**: `src/components/skill/human-install-script.tsx`
- **内容**:
  - 显示标题和代码块
  - 实现复制按钮功能
  - 深色背景、等宽字体
- **验收**:
  - 代码块样式正确
  - 复制功能正常
  - 代码块支持横向滚动

### Task 2.4: 创建 SkillInstallSection 主组件
- **文件**: `src/components/skill/skill-install-section.tsx`
- **内容**:
  - 集成以上所有组件
  - 调用 API 获取安装信息
  - 管理组件状态（mode、loading、copied 等）
  - 处理加载和错误状态
- **验收**:
  - 组件正确加载安装信息
  - 模式切换功能正常
  - 所有复制功能正常
  - 加载状态正确显示

---

## Phase 3: 集成与测试

### Task 3.1: 集成到 Skill 详情页
- **文件**: `src/app/skills/[slug]/page.tsx`
- **内容**:
  - 在 Skill 详情页添加 `SkillInstallSection` 组件
  - 放在下载功能附近（通常在详情页底部）
- **验收**:
  - 安装模块在详情页正确显示
  - 位置合理，不影响现有功能

### Task 3.2: 添加加载骨架屏
- **文件**: `src/components/skill/skill-install-section.tsx`
- **内容**:
  - 加载时显示骨架屏动画
  - 使用 `animate-pulse` 效果
- **验收**:
  - 加载时显示骨架屏
  - 数据加载完成后替换为实际内容

### Task 3.3: 编写单元测试
- **文件**: `src/app/api/skills/[slug]/install-info/route.test.ts`, `src/components/skill/skill-install-section.test.tsx`
- **内容**:
  - API 返回格式测试
  - 环境变量处理测试
  - 组件渲染测试
  - 复制功能测试（mock clipboard）
- **验收**:
  - 所有测试通过
  - 测试覆盖率达标

### Task 3.4: 编写 E2E 测试
- **文件**: `e2e/skill-install.spec.ts`
- **内容**:
  - 访问 Skill 详情页，验证安装模块加载
  - 测试模式切换功能
  - 测试复制功能（验证剪贴板内容）
- **验收**:
  - E2E 测试通过
  - 关键用户流程覆盖

---

## Phase 4: 优化与文档

### Task 4.1: 添加错误处理
- **文件**: `src/components/skill/skill-install-section.tsx`
- **内容**:
  - API 请求失败时显示错误提示
  - 提供重试按钮
- **验收**:
  - 错误状态正确显示
  - 重试功能正常

### Task 4.2: 优化移动端体验
- **文件**: `src/components/skill/skill-install-section.tsx`, CSS
- **内容**:
  - 确保移动端代码块可横向滚动
  - 确保复制按钮在移动端可见
  - 测试 375px 宽度设备
- **验收**:
  - 移动端完全可用
  - 无 UI 溢出或遮挡

### Task 4.3: 更新用户文档
- **文件**: `docs/user-guide.md`
- **内容**:
  - 添加安装方式功能说明
  - 说明如何使用 Agent 安装提示
  - 说明如何使用终端安装脚本
- **验收**:
  - 文档完整清晰
  - 包含使用示例

### Task 4.4: 更新 API 文档
- **文件**: `docs/api.md`
- **内容**:
  - 添加 `GET /api/skills/[slug]/install-info` 接口文档
  - 说明请求参数、响应格式、错误码
- **验收**:
  - API 文档完整
  - 包含请求/响应示例

---

## Task Dependencies

```
1.1 ─┬─→ 1.2 ─→ 1.3 ─┬─→ 2.1 ─→ 2.2 ─┐
     │               │       │       │
     │               │       └─→ 2.3 ─┼─→ 2.4 ─→ 3.1 ─→ 3.2 ─→ 3.3
     │               │               │                    │
     └───────────────┴───────────────┘                    └─→ 3.4
                                                              │
                                                              └─→ 4.1 ─→ 4.2 ─→ 4.3
                                                                     │
                                                                     └─→ 4.4
```

## Estimated Effort

- **Phase 1**: 4 小时（基础设施）
- **Phase 2**: 8 小时（前端组件）
- **Phase 3**: 6 小时（集成与测试）
- **Phase 4**: 4 小时（优化与文档）
- **总计**: 约 22 小时（约 11 个任务单元，每单元 2 小时）

## 实现记录（已完成）

- [x] 1.1 `.env.example`、`docs/deploy-checklist.md` 已补充 `SKILLHUB_*`
- [x] 1.2 `GET /api/skills/[slug]/install-info` + `src/lib/skill-install-info.ts`
- [x] 1.3 `src/lib/install-types.ts`
- [x] 2.1–2.4 `src/components/skills/install/*`
- [x] 3.1 Skill 详情页集成（仅已上架展示）
- [x] 3.2 骨架屏 `skill-install-skeleton`
- [x] 3.3 Vitest：`skill-install-info`、`install-info` API、`skill-install-section`
- [x] 3.4 E2E：`e2e/skill-install.spec.ts`（无种子时 skip）
- [x] 4.1 错误 + 重试
- [x] 4.2 代码块 `overflow-x-auto`、复制按钮绝对定位
- [x] 4.3 `docs/user-guide.md`
- [x] 4.4 `docs/api.md`

## Notes

1. **环境变量优先级**: 生产环境使用 `.env.production` 或 SRE 平台注入，预发环境使用 `.env.pre`
2. **Clipboard API 兼容性**: 现代浏览器均支持，如需支持旧版浏览器需添加降级方案
3. **安装脚本 URL**: 当前使用 SkillHub 的 COS 地址，后续可能需要迁移到项目自己的存储
4. **埋点预留**: 复制按钮点击事件可添加埋点，用于后续分析安装转化率
