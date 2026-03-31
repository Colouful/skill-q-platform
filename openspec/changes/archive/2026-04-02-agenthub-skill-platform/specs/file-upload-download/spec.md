# File Upload & Download Specification

## ADDED Requirements

### Requirement: 用户可以上传 Skill 包
系统 SHALL 支持上传 ZIP 格式的 Skill 包。

#### Scenario: 上传 ZIP 包
- **WHEN** 用户上传 ZIP 文件
- **THEN** 系统自动解压并校验文件结构
- **THEN** 系统提取 SKILL.md 中的元数据

### Requirement: 系统校验上传文件
系统 SHALL 对上传文件进行格式和安全校验。

#### Scenario: 格式校验
- **WHEN** 用户上传的文件不包含 SKILL.md
- **THEN** 系统拒绝上传并显示错误提示
- **THEN** 系统提供 SKILL.md 模板下载

#### Scenario: 安全校验
- **WHEN** 系统检测到 Skill 包包含敏感操作（文件读写、网络请求）
- **THEN** 系统标记为「需人工审核」
- **THEN** 系统通知管理员

### Requirement: 用户可以下载 Skill
系统 SHALL 支持下载 Skill 为 ZIP 包。

#### Scenario: 下载 Skill
- **WHEN** 用户点击下载按钮
- **THEN** 系统打包 Skill 文件为 ZIP
- **THEN** 系统触发浏览器下载
- **THEN** 系统增加下载计数
