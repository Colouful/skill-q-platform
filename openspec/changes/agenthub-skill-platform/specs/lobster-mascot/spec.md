# Lobster Mascot Specification

## ADDED Requirements

### Requirement: 系统使用龙虾加载动画
所有加载状态 SHALL 显示龙虾走路动画。

#### Scenario: 页面加载
- **WHEN** 页面正在加载数据
- **THEN** 系统显示龙虾走路 Sprite 动画
- **THEN** 动画为 4 帧循环，0.8 秒

### Requirement: 系统使用龙虾空状态
所有空状态 SHALL 显示龙虾插画。

#### Scenario: Skill 列表为空
- **WHEN** Skill 列表为空
- **THEN** 系统显示龙虾摊手插画
- **THEN** 文字为「空空如也，来上传第一个 Skill 吧！」

### Requirement: 系统使用龙虾成功提示
所有成功操作 SHALL 显示龙虾庆祝动画。

#### Scenario: 上传成功
- **WHEN** Skill 上传成功
- **THEN** 系统显示龙虾举旗庆祝动画
- **THEN** Toast 文字包含龙虾 emoji🦞

### Requirement: 系统使用龙虾 404 页面
404 页面 SHALL 显示龙虾迷路插画。

#### Scenario: 访问不存在的页面
- **WHEN** 用户访问 404 页面
- **THEN** 系统显示龙虾迷路插画
- **THEN** 文字为「哎呀，龙虾迷路了...」
- **THEN** 提供返回首页按钮
