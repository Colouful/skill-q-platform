# Skill Management Specification

## ADDED Requirements

### Requirement: 用户可以上传 Skill
系统 SHALL 允许用户上传 OpenClaw Agent Skill 包（ZIP 格式或单文件）。

#### Scenario: 成功上传 Skill
- **WHEN** 用户点击「上传 Skill」按钮
- **THEN** 系统弹出上传表单（名称、描述、分类、标签、文件）
- **WHEN** 用户填写必填字段并上传 SKILL.md + 代码文件
- **THEN** 系统校验文件格式与结构
- **THEN** 系统创建 Skill 和第一个版本（v1.0.0）
- **THEN** 系统跳转到 Skill 详情页并显示「上传成功」Toast（龙虾庆祝动画）

#### Scenario: Skill 名称重复
- **WHEN** 用户上传的 Skill 名称已存在
- **THEN** 系统显示「该 Skill 名称已存在，请使用其他名称」错误提示
- **THEN** 上传按钮禁用

#### Scenario: 文件格式错误
- **WHEN** 用户上传的文件不包含 SKILL.md 或格式错误
- **THEN** 系统显示「Skill 包格式错误，缺少 SKILL.md 文件」错误提示
- **THEN** 系统提供 SKILL.md 模板下载链接

### Requirement: 用户可以浏览 Skill 列表
系统 SHALL 以像素卡片网格形式展示所有 Skill，支持分类筛选和分页。

#### Scenario: 查看 Skill 列表
- **WHEN** 用户访问 Skill 列表页
- **THEN** 系统以像素卡片网格展示所有 Skill
- **THEN** 每个卡片显示名称、描述、分类、评分（龙虾钳子）、下载量
- **THEN** 卡片 hover 有像素动画效果（边框闪烁、轻微上浮）

#### Scenario: 分类筛选
- **WHEN** 用户点击分类筛选按钮
- **THEN** 系统仅显示该分类下的 Skill
- **THEN** URL 更新为 `/skills?category=dev-tools`

#### Scenario: 空状态
- **WHEN** 没有任何 Skill 或筛选结果为空
- **THEN** 系统显示龙虾空状态插画和「第一个上传 Skill」引导按钮

### Requirement: 用户可以查看 Skill 详情
系统 SHALL 展示 Skill 完整信息、版本列表、评测区。

#### Scenario: 查看 Skill 详情
- **WHEN** 用户点击 Skill 卡片
- **THEN** 系统跳转到 Skill 详情页（`/skills/[slug]`）
- **THEN** 页面显示名称、描述、作者、分类、标签、评分、下载量
- **THEN** 页面显示版本列表（最新版置顶）
- **THEN** 页面显示评测列表（最新在前）
- **THEN** 页面右侧显示下载按钮、Fork 按钮、分享按钮

#### Scenario: Skill 不存在
- **WHEN** 用户访问不存在的 Skill slug
- **THEN** 系统显示 404 页面（龙虾迷路插画）并引导返回首页

### Requirement: 用户可以编辑 Skill
系统 SHALL 允许作者编辑自己上传的 Skill 元数据。

#### Scenario: 成功编辑 Skill
- **WHEN** 作者点击 Skill 详情页的「编辑」按钮
- **THEN** 系统弹出编辑表单，预填充当前值
- **WHEN** 作者修改信息并保存
- **THEN** 系统更新 Skill 元数据并刷新页面
- **THEN** 系统显示「更新成功」Toast（龙虾举旗动画）

#### Scenario: 非作者编辑
- **WHEN** 非作者用户尝试编辑他人 Skill
- **THEN** 系统显示「无权限编辑他人 Skill」错误提示
- **THEN** 引导用户使用 Fork 功能

### Requirement: 用户可以删除 Skill
系统 SHALL 允许作者删除自己的 Skill，删除前需二次确认。

#### Scenario: 成功删除 Skill
- **WHEN** 作者点击 Skill 详情页的「删除」按钮
- **THEN** 系统弹出二次确认对话框，提示「删除 Skill 将同时删除所有版本和评测」
- **WHEN** 作者确认删除
- **THEN** 系统删除 Skill 及其关联数据
- **THEN** 系统跳转到列表页并显示「Skill 已删除」Toast（龙虾挥手告别动画）

### Requirement: Skill 支持标签系统
系统 SHALL 允许用户为 Skill 添加多个标签。

#### Scenario: 添加标签
- **WHEN** 用户上传或编辑 Skill
- **THEN** 系统提供标签输入框（支持输入多个标签，逗号分隔）
- **THEN** 系统自动去重并转换为小写

#### Scenario: 标签筛选
- **WHEN** 用户点击标签
- **THEN** 系统跳转到标签筛选页，显示所有包含该标签的 Skill

## UI Interaction Requirements

### Requirement: 像素风格 Skill 卡片
Skill 卡片 SHALL 采用像素风格设计。

#### Scenario: 卡片样式
- **WHEN** 用户查看 Skill 卡片
- **THEN** 卡片使用像素边框（非圆角，阶梯状边缘）
- **THEN** 卡片字体使用像素字体（VT323）
- **THEN** 卡片背景为米白色（#f7f3e8）
- **THEN** 卡片阴影为硬边阴影（无模糊）

#### Scenario: 卡片 hover 效果
- **WHEN** 鼠标悬停在 Skill 卡片上
- **THEN** 卡片边框颜色闪烁（GameBoy 绿 → 龙虾红）
- **THEN** 卡片轻微上浮（translateY -4px）
- **THEN** 过渡时间 200ms，steps 动画（像素感）

### Requirement: 龙虾元素反馈
Skill 操作反馈 SHALL 使用龙虾吉祥物。

#### Scenario: 上传成功
- **WHEN** Skill 上传成功
- **THEN** 系统显示龙虾举旗庆祝动画（2 秒）
- **THEN** Toast 文字为「Skill 上传成功！龙虾为你点赞🦞」

#### Scenario: 下载成功
- **WHEN** Skill 下载完成
- **THEN** 系统显示龙虾投递包裹动画
- **THEN** Toast 文字为「下载完成！开始探索吧🦞」
