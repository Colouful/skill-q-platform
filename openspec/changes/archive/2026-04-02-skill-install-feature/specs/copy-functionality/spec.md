# Copy to Clipboard Specification

## ADDED Requirements

### Requirement: 支持复制安装提示文本
系统 SHALL 支持复制 Agent 安装提示文本到剪贴板。

#### Scenario: 复制成功
- **WHEN** 用户点击复制按钮
- **WHEN** 浏览器支持 Clipboard API
- **THEN** 提示文本写入系统剪贴板
- **THEN** 显示「已复制」成功提示（toast）
- **THEN** 成功提示 2 秒后自动消失

#### Scenario: 复制失败
- **WHEN** 用户点击复制按钮
- **WHEN** 浏览器不支持 Clipboard API
- **THEN** 显示「复制失败」错误提示
- **THEN** 提供手动复制指引（可选）

#### Scenario: 权限被拒绝
- **WHEN** 用户点击复制按钮
- **WHEN** 用户拒绝了剪贴板权限
- **THEN** 显示「复制失败」错误提示
- **THEN** 提示用户手动授权或手动复制

### Requirement: 支持复制终端安装命令
系统 SHALL 支持复制所有终端安装命令到剪贴板。

#### Scenario: 复制 CLI 安装命令
- **WHEN** 用户点击 CLI 安装命令的复制按钮
- **THEN** 命令写入系统剪贴板
- **THEN** 显示「已复制」成功提示

#### Scenario: 复制加速安装命令
- **WHEN** 用户点击加速安装命令的复制按钮
- **THEN** 命令写入系统剪贴板
- **THEN** 显示「已复制」成功提示

#### Scenario: 复制技能安装命令
- **WHEN** 用户点击技能安装命令的复制按钮
- **THEN** 命令写入系统剪贴板
- **THEN** 显示「已复制」成功提示

### Requirement: 复制按钮状态反馈
系统 SHALL 提供复制按钮的状态反馈。

#### Scenario: 默认状态
- **THEN** 复制按钮显示📋图标
- **THEN** 按钮可点击

#### Scenario: 复制中状态
- **WHEN** 用户点击复制按钮
- **THEN** 按钮显示加载动画（可选）
- **THEN** 按钮暂时禁用防止重复点击

#### Scenario: 复制成功状态
- **WHEN** 复制成功
- **THEN** 按钮显示「已复制」文字（可选）
- **THEN** 2 秒后恢复为📋图标

### Requirement: 复制功能跨浏览器兼容
系统 SHALL 支持主流浏览器的复制功能。

#### Scenario: Chrome/Edge
- **THEN** 使用 `navigator.clipboard.writeText()` API
- **THEN** 复制功能正常工作

#### Scenario: Firefox
- **THEN** 使用 `navigator.clipboard.writeText()` API
- **THEN** 复制功能正常工作

#### Scenario: Safari
- **THEN** 使用 `navigator.clipboard.writeText()` API
- **THEN** 复制功能正常工作

#### Scenario: 旧版浏览器
- **WHEN** 浏览器不支持 Clipboard API
- **THEN** 降级使用 `document.execCommand('copy')`（可选）
- **THEN** 或显示手动复制指引

### Requirement: 复制功能移动端兼容
系统 SHALL 支持移动端的复制功能。

#### Scenario: iOS Safari
- **THEN** 复制功能正常工作
- **THEN** 成功提示在移动端正确显示

#### Scenario: Android Chrome
- **THEN** 复制功能正常工作
- **THEN** 成功提示在移动端正确显示

#### Scenario: 移动端 UI 适配
- **THEN** 复制按钮在移动端可见且可点击
- **THEN** 代码块支持横向滚动不遮挡复制按钮
