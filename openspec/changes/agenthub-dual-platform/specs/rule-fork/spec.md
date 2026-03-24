# Rule Fork Editing Specification

## ADDED Requirements

### Requirement: 用户可以 Fork 他人 Rule
系统 SHALL 允许用户 Fork 他人 Rule 创建自己的版本。

#### Scenario: Fork Rule
- **WHEN** 用户点击 Rule 详情页的「Fork」按钮
- **THEN** 系统弹出 Fork 表单（新名称、描述）
- **WHEN** 用户填写并提交
- **THEN** 系统创建新 Rule（复制原 Rule 内容）
- **THEN** 新 Rule 作者为当前用户
- **THEN** 新 Rule 关联到原 Rule（显示 Fork 自 XXX）

### Requirement: 用户可以在线编辑 Rule
系统 SHALL 提供在线编辑器修改 Rule 文件。

#### Scenario: 在线编辑 Rule
- **WHEN** 用户点击「在线编辑」按钮
- **THEN** 系统打开 JSON/YAML 编辑器
- **THEN** 编辑器显示 Rule 文件树和文件内容
- **WHEN** 用户修改并保存
- **THEN** 系统创建新版本
- **THEN** 系统显示「保存成功」Toast

### Requirement: Fork 不影响原 Rule
系统 SHALL 确保 Fork 的修改不影响原始 Rule。

#### Scenario: Rule Fork 隔离
- **WHEN** 用户修改 Fork 的 Rule
- **THEN** 原 Rule 内容保持不变
- **THEN** 原 Rule 作者不受影响
