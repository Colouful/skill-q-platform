# Search & Discovery Specification

## ADDED Requirements

### Requirement: 用户可以搜索 Skill
系统 SHALL 提供关键词搜索功能。

#### Scenario: 关键词搜索
- **WHEN** 用户在搜索框输入关键词
- **THEN** 系统实时搜索名称、描述、标签匹配的 Skill
- **THEN** 搜索结果高亮显示关键词

### Requirement: 系统提供热门榜单
系统 SHALL 提供多个榜单：热门下载、高分评分、最新上架。

#### Scenario: 查看热门下载榜
- **WHEN** 用户点击「热门」标签
- **THEN** 系统显示下载量 Top 20 的 Skill
- **THEN** 榜单显示排名、名称、下载量

#### Scenario: 查看高分榜
- **WHEN** 用户点击「高分」标签
- **THEN** 系统显示评分 Top 20 的 Skill（至少 5 个评测）

### Requirement: 系统提供推荐 Skill
系统 SHALL 在首页展示推荐 Skill。

#### Scenario: 首页推荐
- **WHEN** 用户访问首页
- **THEN** 系统显示「编辑推荐」区域（isFeatured=true 的 Skill）
- **THEN** 系统显示「最新上架」区域（按时间排序）
