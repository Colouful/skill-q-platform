---
name: pixel-art-generator
description: 生成像素风格图标和插画，支持龙虾等吉祥物创作。
version: 1.0.0
author: AgentHub Team
category: 图像与设计
tags: [pixel-art, generator, ai, design]
license: MIT
---

## 功能描述

使用 AI 生成像素风格的艺术作品，适用于：
- 像素图标（32x32、64x64）
- 吉祥物设计（如龙虾）
- 游戏 Sprite 素材
- 像素风格插画

## 使用方法

```typescript
// 生成像素图标
const icon = await generatePixelArt({
  prompt: "像素风格龙虾图标，8-bit，复古游戏风格",
  size: "32x32",
  colors: ["#e74c3c", "#f7f3e8", "#2c3e50"],
  style: "gameboy"
});

// 生成 Sprite 序列帧
const sprite = await generateSpriteSheet({
  prompt: "龙虾走路动画，4 帧循环",
  frames: 4,
  size: "32x32"
});
```

## 输出格式

- PNG（透明背景）
- CSS Sprite（含 keyframes 动画）
- SVG（可缩放像素艺术）

## 示例

### 生成龙虾吉祥物

```
输入：像素风格龙虾，红色，举旗庆祝，32x32
输出：lobster-celebrate.png
```

### 生成分类图标

```
输入：像素风格代码图标，开发辅助分类，16x16
输出：category-dev-tools.png
```
