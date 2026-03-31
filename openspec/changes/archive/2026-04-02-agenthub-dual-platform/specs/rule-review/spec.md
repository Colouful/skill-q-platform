# Rule Review System Specification

## ADDED Requirements

### Requirement: 用户可以对 Rule 评分
系统 SHALL 允许用户对 Rule 进行 1-5 星评分（使用紫色龙虾钳子图标）。

#### Scenario: 提交 Rule 评分
- **WHEN** 用户点击星级评分
- **THEN** 系统显示 1-5 个紫色龙虾钳子（填充/空心）
- **WHEN** 用户确认评分
- **THEN** 系统更新 Rule 平均评分
- **THEN** 系统显示「评分成功」Toast

### Requirement: 用户可以写 Rule 评测
系统 SHALL 允许用户提交 Rule 文字评测。

#### Scenario: 提交 Rule 评测
- **WHEN** 用户点击「写评测」按钮
- **THEN** 系统弹出评测表单（评分 + 文字内容）
- **WHEN** 用户提交评测
- **THEN** 系统显示在评测列表中
- **THEN** Rule 评测数量 +1

### Requirement: 用户可以查看 Rule 评测列表
系统 SHALL 展示 Rule 的所有评测。

#### Scenario: 查看 Rule 评测
- **WHEN** 用户查看 Rule 详情页
- **THEN** 系统显示评测列表（最新在前）
- **THEN** 每个评测显示作者、评分、内容、时间、有用票数
