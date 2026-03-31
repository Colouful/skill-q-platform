# Rule Category Management Specification

## ADDED Requirements

### Requirement: 系统预定义 10+ Rule 分类
系统 SHALL 预定义以下 Rule 分类：规则集、决策表、评分卡、流程模板、风控规则、业务规则、合规模板、数据验证、计算规则、其他。

#### Scenario: 查看 Rule 分类列表
- **WHEN** 用户访问 Rule 列表页或首页
- **THEN** 系统显示所有预定义 Rule 分类（像素图标 + 名称 + Rule 数量）
- **THEN** 分类按 Rule 数量降序排列

### Requirement: 用户可以按 Rule 分类筛选
系统 SHALL 允许用户点击 Rule 分类查看该分类下的 Rule。

#### Scenario: Rule 分类筛选
- **WHEN** 用户点击 Rule 分类卡片
- **THEN** 系统跳转到 Rule 分类页（`/categories/rules/[slug]`）
- **THEN** 页面显示该分类下的所有 Rule
- **THEN** 页面显示 Rule 分类描述和图标（紫色系像素风格）
