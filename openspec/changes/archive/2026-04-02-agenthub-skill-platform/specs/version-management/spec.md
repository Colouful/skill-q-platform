# Version Management Specification

## ADDED Requirements

### Requirement: Skill 支持多版本
系统 SHALL 允许每个 Skill 有多个版本，使用语义化版本号（MAJOR.MINOR.PATCH）。

#### Scenario: 查看版本列表
- **WHEN** 用户查看 Skill 详情页
- **THEN** 系统显示版本列表（最新版置顶）
- **THEN** 每个版本显示版本号、发布日期、下载量、更新日志

### Requirement: 用户可以下载指定版本
系统 SHALL 允许用户下载 Skill 的任意版本。

#### Scenario: 下载最新版本
- **WHEN** 用户点击「下载」按钮
- **THEN** 系统下载最新版本 ZIP 包
- **THEN** 系统增加下载计数

#### Scenario: 下载历史版本
- **WHEN** 用户点击版本列表中的某个版本
- **THEN** 系统显示该版本详情
- **THEN** 用户可点击「下载此版本」按钮

### Requirement: 作者可以发布新版本
系统 SHALL 允许作者为 Skill 发布新版本。

#### Scenario: 发布新版本
- **WHEN** 作者点击「发布新版本」按钮
- **THEN** 系统弹出上传表单（版本号、更新日志、文件）
- **WHEN** 作者填写并提交
- **THEN** 系统创建新版本并标记为最新版
- **THEN** 系统显示「版本发布成功」Toast
