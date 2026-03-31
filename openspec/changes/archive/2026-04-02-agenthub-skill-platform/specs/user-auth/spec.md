# User Authentication Specification (MVP)

## ADDED Requirements

### Requirement: MVP 使用简化认证
MVP 版本 SHALL 使用基础会话认证（无需注册登录）。

#### Scenario: 识别作者
- **WHEN** 用户上传 Skill
- **THEN** 系统记录作者名（表单输入）
- **THEN** 后续编辑需匹配作者名

### Requirement: 作者权限验证
系统 SHALL 验证编辑/删除操作的用户权限。

#### Scenario: 编辑验证
- **WHEN** 用户尝试编辑 Skill
- **THEN** 系统验证作者名匹配
- **WHEN** 作者名不匹配
- **THEN** 系统显示无权限提示
