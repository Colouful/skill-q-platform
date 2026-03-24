# Rule Management Specification

## ADDED Requirements

### Requirement: 用户可以上传 Rule
系统 SHALL 允许用户上传 OpenClaw Rule 包（ZIP 格式，包含 RULE.md + 规则定义文件）。

#### Scenario: 成功上传 Rule
- **WHEN** 用户点击「上传 Rule」按钮
- **THEN** 系统弹出上传表单（名称、描述、Rule 分类、标签、文件）
- **WHEN** 用户填写必填字段并上传 RULE.md + rules.json
- **THEN** 系统校验文件格式与结构
- **THEN** 系统创建 Rule 和第一个版本（v1.0.0）
- **THEN** 系统跳转到 Rule 详情页并显示「上传成功」Toast（龙虾举规则书庆祝）

#### Scenario: Rule 名称重复
- **WHEN** 用户上传的 Rule 名称已存在
- **THEN** 系统显示「该 Rule 名称已存在，请使用其他名称」错误提示

#### Scenario: 文件格式错误
- **WHEN** 用户上传的文件不包含 RULE.md 或 rules.json
- **THEN** 系统显示「Rule 包格式错误，缺少 RULE.md 或 rules.json 文件」错误提示
- **THEN** 系统提供 RULE.md 和 rules.json 模板下载链接

### Requirement: 用户可以浏览 Rule 列表
系统 SHALL 以像素卡片网格形式展示所有 Rule，支持分类筛选和分页。

#### Scenario: 查看 Rule 列表
- **WHEN** 用户访问 Rule 列表页（`/rules`）
- **THEN** 系统以紫色系像素卡片网格展示所有 Rule
- **THEN** 每个卡片显示名称、描述、Rule 分类、评分（紫色龙虾钳子）、下载量
- **THEN** 卡片 hover 有紫色像素动画效果

### Requirement: 用户可以查看 Rule 详情
系统 SHALL 展示 Rule 完整信息、版本列表、评测区。

#### Scenario: 查看 Rule 详情
- **WHEN** 用户点击 Rule 卡片
- **THEN** 系统跳转到 Rule 详情页（`/rules/[slug]`）
- **THEN** 页面显示名称、描述、作者、Rule 分类、标签、评分、下载量
- **THEN** 页面显示规则预览（JSON/YAML 格式高亮）
- **THEN** 页面显示版本列表（最新版置顶）
- **THEN** 页面显示评测列表
- **THEN** 页面右侧显示下载按钮、Fork 按钮、分享按钮（紫色系）

### Requirement: 用户可以编辑 Rule
系统 SHALL 允许作者编辑自己上传的 Rule 元数据。

#### Scenario: 成功编辑 Rule
- **WHEN** 作者点击 Rule 详情页的「编辑」按钮
- **THEN** 系统弹出编辑表单，预填充当前值
- **WHEN** 作者修改信息并保存
- **THEN** 系统更新 Rule 元数据并刷新页面
- **THEN** 系统显示「更新成功」Toast（紫色龙虾庆祝）

### Requirement: 用户可以删除 Rule
系统 SHALL 允许作者删除自己的 Rule。

#### Scenario: 成功删除 Rule
- **WHEN** 作者点击 Rule 详情页的「删除」按钮
- **THEN** 系统弹出二次确认对话框
- **WHEN** 作者确认删除
- **THEN** 系统删除 Rule 及其关联数据
- **THEN** 系统跳转到 Rule 列表页并显示「Rule 已删除」Toast

## UI Interaction Requirements

### Requirement: Rule 卡片使用紫色系
Rule 卡片 SHALL 使用紫色系配色，与 Skill 蓝色系区分。

#### Scenario: Rule 卡片样式
- **WHEN** 用户查看 Rule 卡片
- **THEN** 卡片边框为紫色（#c44cf3）
- **THEN** 卡片图标为紫色系像素图标
- **THEN** 卡片标签背景为浅紫色（#f3e5f5）

#### Scenario: Rule 卡片 hover 效果
- **WHEN** 鼠标悬停在 Rule 卡片上
- **THEN** 卡片边框颜色闪烁（紫色 → 深紫）
- **THEN** 卡片轻微上浮（translateY -4px）
- **THEN** 过渡时间 200ms，steps 动画

### Requirement: Rule 类型标签
所有 Rule 资源 SHALL 显示「Rule」类型标签。

#### Scenario: 类型标签显示
- **WHEN** 用户查看 Rule 卡片或详情
- **THEN** 系统显示紫色「Rule」标签
- **THEN** 标签使用像素字体
