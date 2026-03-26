# Install UI Specification

## ADDED Requirements

### Requirement: 用户可查看 Skill 安装方式
系统 SHALL 在 Skill 详情页展示安装方式模块。

#### Scenario: 查看安装方式
- **WHEN** 用户访问 Skill 详情页
- **THEN** 页面展示「安装方式」模块
- **THEN** 模块包含「我是 Agent」和「我是 Human」两个模式切换 Tab
- **THEN** 默认选中「我是 Agent」模式

### Requirement: 用户可切换安装模式
系统 SHALL 支持用户在 Agent 模式和 Human 模式之间切换。

#### Scenario: 切换到 Agent 模式
- **WHEN** 用户点击「我是 Agent」Tab
- **THEN** 显示 Agent 安装提示文本
- **THEN** 提示文本包含 SkillHub 商店安装指引
- **THEN** 提示文本包含具体 Skill 的安装命令

#### Scenario: 切换到 Human 模式
- **WHEN** 用户点击「我是 Human」Tab
- **THEN** 显示终端安装脚本
- **THEN** 显示 CLI 安装命令
- **THEN** 显示技能安装命令

### Requirement: Agent 安装提示可复制
系统 SHALL 支持复制 Agent 安装提示文本。

#### Scenario: 复制 Agent 提示
- **WHEN** 用户点击复制按钮
- **THEN** 提示文本复制到剪贴板
- **THEN** 显示「已复制」成功提示
- **THEN** 2 秒后成功提示自动消失

### Requirement: 终端安装命令可复制
系统 SHALL 支持复制所有终端安装命令。

#### Scenario: 复制 CLI 安装命令
- **WHEN** 用户点击 CLI 安装命令的复制按钮
- **THEN** 命令复制到剪贴板
- **THEN** 显示「已复制」成功提示

#### Scenario: 复制技能安装命令
- **WHEN** 用户点击技能安装命令的复制按钮
- **THEN** 命令复制到剪贴板
- **THEN** 显示「已复制」成功提示

### Requirement: 安装模块使用像素风格
系统 SHALL 对安装方式模块应用像素风格设计。

#### Scenario: 像素风格展示
- **THEN** 模块使用 4px 像素边框
- **THEN** 模块使用硬阴影效果
- **THEN** 标题使用像素字体
- **THEN** 代码块使用深色背景和等宽字体
- **THEN** 复制按钮使用像素风格设计

### Requirement: 安装模块响应式适配
系统 SHALL 支持移动端查看安装方式。

#### Scenario: 移动端查看
- **WHEN** 用户在 375px 宽度设备上查看
- **THEN** 安装模块完全可见
- **THEN** 代码块支持横向滚动
- **THEN** 复制按钮固定在右侧可见
