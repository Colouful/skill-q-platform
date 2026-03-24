# Category Management Specification

## ADDED Requirements

### Requirement: 系统预定义 15+ 分类
系统 SHALL 预定义以下分类：开发辅助、办公与效率、自媒体、IT/互联网、金融、图像与设计、生活方式、教育、法律、资讯阅读、专业咨询、社交聊天、科研、娱乐、音视频、医疗。

#### Scenario: 查看分类列表
- **WHEN** 用户访问首页或列表页
- **THEN** 系统显示所有预定义分类（像素图标 + 名称 + Skill 数量）
- **THEN** 分类按 Skill 数量降序排列

### Requirement: 用户可以按分类筛选
系统 SHALL 允许用户点击分类查看该分类下的 Skill。

#### Scenario: 分类筛选
- **WHEN** 用户点击分类卡片
- **THEN** 系统跳转到分类页（`/categories/[slug]`）
- **THEN** 页面显示该分类下的所有 Skill
- **THEN** 页面显示分类描述和图标（像素风格）
