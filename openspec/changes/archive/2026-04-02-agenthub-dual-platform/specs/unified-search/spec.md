# Unified Search Specification

## ADDED Requirements

### Requirement: 用户可以全局搜索 Skill 和 Rule
系统 SHALL 提供跨 Skill 和 Rule 的统一搜索功能。

#### Scenario: 全局搜索
- **WHEN** 用户在搜索框输入关键词
- **THEN** 系统同时搜索 Skill 和 Rule 的名称、描述、标签
- **THEN** 搜索结果分组显示（Skill 在上，Rule 在下）
- **THEN** 每组显示数量（如「Skills (15)」「Rules (8)"）

#### Scenario: 按类型筛选搜索
- **WHEN** 用户选择「仅搜索 Skill」或「仅搜索 Rule」
- **THEN** 系统仅搜索指定类型的资源
- **THEN** 搜索结果仅显示该类型资源

### Requirement: 搜索结果支持类型标签
搜索结果 SHALL 清晰标识资源类型。

#### Scenario: 搜索结果类型标签
- **WHEN** 用户查看搜索结果
- **THEN** 每个结果卡片显示类型标签（Skill 蓝色/Rules 紫色）
- **THEN** 卡片样式与类型一致（边框颜色、图标颜色）
