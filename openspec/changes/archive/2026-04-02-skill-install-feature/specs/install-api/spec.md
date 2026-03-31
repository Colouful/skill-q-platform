# Install Info API Specification

## ADDED Requirements

### Requirement: 获取 Skill 安装信息
系统 SHALL 提供 API 接口获取 Skill 安装信息。

#### Scenario: 获取安装信息
- **WHEN** 客户端请求 `GET /api/skills/[slug]/install-info`
- **THEN** 系统返回 Skill 基本信息（slug、name、description）
- **THEN** 系统返回安装脚本 URL 和命令
- **THEN** 系统返回 Agent 安装提示文本
- **THEN** 系统返回 CLI 安装技能命令

#### Scenario: Skill 不存在
- **WHEN** 请求的 Skill 不存在
- **THEN** 系统返回 404 错误
- **THEN** 错误信息为「Skill 不存在」

#### Scenario: Skill 未发布
- **WHEN** 请求的 Skill 未发布（moderationStatus != published）
- **THEN** 系统返回 404 错误
- **THEN** 未发布 Skill 不提供安装信息

### Requirement: 安装信息从环境变量读取
系统 SHALL 从环境变量读取安装脚本基础 URL。

#### Scenario: 环境变量配置
- **WHEN** 配置了 `SKILLHUB_INSTALL_BASE_URL` 环境变量
- **THEN** 使用配置的值作为安装脚本基础 URL
- **THEN** 生成的安装命令包含正确的 URL

#### Scenario: 环境变量缺失
- **WHEN** 未配置 `SKILLHUB_INSTALL_BASE_URL` 环境变量
- **THEN** 使用默认值 `https://skillhub-1388575217.cos.ap-guangzhou.myqcloud.com/install`
- **THEN** 系统正常返回安装信息

### Requirement: 安装命令格式正确
系统 SHALL 生成格式正确的安装命令。

#### Scenario: CLI 安装命令
- **THEN** 命令格式为 `curl -fsSL <URL>/install.sh | bash -s -- --no-skills`
- **THEN** URL 来自环境变量或默认值

#### Scenario: 加速安装命令
- **THEN** 命令格式为 `curl -fsSL <URL>/install.sh | bash`
- **THEN** 不包含 `--no-skills` 参数

#### Scenario: 技能安装命令
- **THEN** 命令格式为 `skillhub install <slug>`
- **THEN** slug 为当前 Skill 的 slug 字段

### Requirement: Agent 提示文本完整
系统 SHALL 生成完整的 Agent 安装提示文本。

#### Scenario: 基础安装提示
- **THEN** 提示包含 SkillHub 商店安装检查指引
- **THEN** 提示包含 SkillHub 商店安装 URL
- **THEN** 提示说明只安装 CLI
- **THEN** 提示包含具体 Skill 的安装命令

#### Scenario: 加速安装提示
- **THEN** 提示包含 SkillHub 商店安装检查指引
- **THEN** 提示说明使用加速安装
- **THEN** 提示包含具体 Skill 的安装命令
