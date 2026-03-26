# Proposal: Skill 便捷安装功能

## Why

当前 Skill 详情页仅提供 ZIP 下载功能，用户需要手动解压、配置才能使用 Skill。这增加了使用门槛，尤其是对非技术用户。参考 SkillHub 等平台的成功经验，提供一键安装脚本和 Agent 直接安装能力可以显著提升用户体验和 Skill 采用率。

核心痛点：
- **手动安装繁琐**：用户需要下载 ZIP → 解压 → 移动到正确目录 → 配置环境变量
- **Agent 无法自主安装**：Agent 无法直接获取安装指令，需要人类手动操作
- **缺少统一安装入口**：不同 Skill 安装方式不一致，用户难以记忆

## What Changes

- **新增安装方式切换 UI**：Skill 详情页增加「安装方式」模块，支持「我是 Agent」和「我是 Human」两种模式切换
- **Agent 安装提示**：提供可直接复制发送给 Agent 的安装提示文本（含 SkillHub 商店安装 + 技能安装两步指引）
- **终端脚本安装**：提供 curl 安装脚本命令，一键安装 SkillHub CLI
- **CLI 安装技能**：提供 `skillhub install <skill-slug>` 命令示例
- **一键复制功能**：所有安装指令支持一键复制到剪贴板
- **安装状态检测**（后续）：可选检测是否已安装 CLI，提供差异化指引

## Capabilities

### New Capabilities

- `skill-install-ui`: Skill 详情页安装方式 UI 组件，支持 Agent/Human 模式切换
- `install-script-api`: 安装脚本生成与下发 API，支持动态生成安装命令
- `cli-install-command`: CLI 安装命令生成能力，根据 Skill 信息生成 `skillhub install` 命令
- `copy-to-clipboard`: 一键复制功能，支持安装指令、提示文本复制
- `agent-install-prompt`: Agent 安装提示生成能力，生成可发送给 Agent 的安装指引

### Modified Capabilities

- `skill-detail-page`: Skill 详情页增加安装方式模块（在现有下载功能基础上）

## Impact

- **数据库**: 无需修改（安装信息从 Skill 现有字段生成）
- **API**: 新增 `GET /api/skills/[slug]/install-info` 接口，返回安装所需信息
- **前端**: 
  - Skill 详情页新增「安装方式」模块
  - 新增安装指令组件（带复制按钮）
  - 新增 Agent/Human 模式切换组件
- **外部依赖**: 
  - 需要 SkillHub CLI 安装脚本托管在可访问的 URL
  - 需要 SkillHub 商店支持通过 URL 安装技能
- **后续影响**: 
  - 为安装统计、安装转化率分析预留数据埋点
  - 为自动检测安装状态预留接口

## Non-Goals（本次不做）

- 安装状态检测（检测用户是否已安装 CLI）
- 安装成功回调与统计
- 多平台安装脚本（本次仅支持 macOS/Linux，Windows 后续支持）
- 私有 Skill 安装权限控制
- 批量安装多个 Skill

## Success Criteria

- ✅ Skill 详情页展示「安装方式」模块
- ✅ 支持「我是 Agent」和「我是 Human」两种模式切换
- ✅ Agent 模式提供可复制的安装提示文本（含 SkillHub 商店安装指引）
- ✅ Human 模式提供终端安装脚本（curl 命令）和 CLI 安装技能命令
- ✅ 所有安装指令支持一键复制，复制后有成功提示
- ✅ 安装指令中的 Skill 名称/Slug 自动填充
- ✅ 移动端（375px 宽度）安装模块完全可用
- ✅ 复制功能在所有主流浏览器正常工作
- ✅ 页面加载时间增加 < 100ms

## Open Questions

1. **SkillHub CLI 安装脚本 URL**：需要确认托管地址（COS、GitHub Releases 或其他）
2. **SkillHub 商店 URL**：需要确认 SkillHub 商店的安装页面 URL 格式
3. **安装指令格式**：是否需要支持自定义 CLI 名称（如 `skillhub` vs `shub`）
4. **加速安装选项**：是否需要区分「普通安装」和「加速安装」两种模式
