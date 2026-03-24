# Pixel UI System Specification

## ADDED Requirements

### Requirement: 系统使用像素字体
系统 SHALL 在所有文本中使用像素字体。

#### Scenario: 标题字体
- **WHEN** 用户查看页面标题
- **THEN** 系统使用 Press Start 2P 字体
- **THEN** 字体大小为 16px（实际显示较大）

#### Scenario: 正文字体
- **WHEN** 用户查看页面正文
- **THEN** 系统使用 VT323 字体
- **THEN** 字体大小为 20px

### Requirement: 系统使用像素边框
所有卡片、按钮、输入框 SHALL 使用像素化边框。

#### Scenario: 像素边框样式
- **WHEN** 用户查看卡片或按钮
- **THEN** 边框为阶梯状（非圆角）
- **THEN** 边框使用 box-shadow 或 SVG 实现
- **THEN** 边框颜色为深色（#34495e）

### Requirement: 系统使用像素动画
所有动画 SHALL 采用帧动画（Sprite-based）。

#### Scenario: 按钮 hover 动画
- **WHEN** 鼠标悬停在按钮上
- **THEN** 按钮颜色变化使用 steps 动画（非平滑过渡）
- **THEN** 动画时间为 200ms，steps(4)

### Requirement: 系统使用像素图标
所有图标 SHALL 为 8-bit 像素风格。

#### Scenario: 分类图标
- **WHEN** 用户查看分类列表
- **THEN** 每个分类显示像素图标（32x32）
- **THEN** 图标风格统一（像素艺术）
