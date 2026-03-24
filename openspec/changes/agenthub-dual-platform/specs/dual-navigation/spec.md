# Dual Navigation Specification

## ADDED Requirements

### Requirement: 顶部导航栏显示双轨入口
系统顶部导航栏 SHALL 显示「首页」「Skills」「Rules」三个主入口。

#### Scenario: 查看导航栏
- **WHEN** 用户访问任意页面
- **THEN** 系统显示顶部导航栏
- **THEN** 导航栏显示 Logo、首页、Skills（带下拉）、Rules（带下拉）、搜索框

#### Scenario: Skills 下拉菜单
- **WHEN** 用户点击或悬停「Skills」菜单
- **THEN** 系统显示 Skills 分类下拉（15+ 分类）
- **THEN** 菜单使用蓝色系配色

#### Scenario: Rules 下拉菜单
- **WHEN** 用户点击或悬停「Rules」菜单
- **THEN** 系统显示 Rules 分类下拉（10+ 分类）
- **THEN** 菜单使用紫色系配色

### Requirement: 当前激活菜单高亮
导航栏 SHALL 高亮当前激活的主菜单。

#### Scenario: 激活状态显示
- **WHEN** 用户访问 Skills 相关页面
- **THEN** 「Skills」菜单高亮（蓝色下划线或背景）
- **WHEN** 用户访问 Rules 相关页面
- **THEN** 「Rules」菜单高亮（紫色下划线或背景）

### Requirement: 移动端导航适配
移动端导航栏 SHALL 支持双轨切换。

#### Scenario: 移动端导航
- **WHEN** 屏幕宽度 < 768px
- **THEN** 导航栏折叠为汉堡菜单
- **THEN** 汉堡菜单展开后显示「首页」「Skills」「Rules」
- **THEN** Skills 和 Rules 分别展开显示分类
