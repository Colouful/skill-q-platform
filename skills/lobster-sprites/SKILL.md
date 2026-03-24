---
name: lobster-sprites
description: 提供完整的龙虾吉祥物 Sprite 素材包（走路、庆祝、空状态、404 等）。
version: 1.0.0
author: AgentHub Team
category: 图像与设计
tags: [lobster, sprite, mascot, pixel-art, animation]
license: MIT
---

## 功能描述

提供一套完整的像素风格龙虾吉祥物 Sprite 素材，包括：
- 走路动画（4 帧循环）
- 庆祝动画（举旗）
- 空状态（摊手）
- 404 迷路插画
- 成功提示
- 错误提示
- 加载动画

## 素材清单

```
lobster-sprites/
├── lobster-walk.png        # 走路动画（4 帧，32x32）
├── lobster-celebrate.png   # 庆祝动画（6 帧，64x64）
├── lobster-empty.png       # 空状态插画（128x128）
├── lobster-404.png         # 404 插画（128x128）
├── lobster-success.png     # 成功提示（64x64）
├── lobster-error.png       # 错误提示（64x64）
├── lobster-loading.gif     # 加载动画（循环）
└── claws-rating.png        # 钳子评分图标（5 个，16x16）
```

## 使用方法

### CSS Sprite 动画

```css
@keyframes lobster-walk {
  0% { background-position: 0 0; }
  25% { background-position: -32px 0; }
  50% { background-position: -64px 0; }
  75% { background-position: -96px 0; }
  100% { background-position: 0 0; }
}

.lobster-loading {
  width: 32px;
  height: 32px;
  background-image: url('/sprites/lobster-walk.png');
  background-size: 128px 32px;
  animation: lobster-walk 0.8s steps(4) infinite;
}
```

### React 组件

```tsx
import { LobsterLoading } from '@/components/lobster';

function MyComponent() {
  return <LobsterLoading size="32px" />;
}
```

## 配色方案

- 龙虾红：#e74c3c
- 米白背景：#f7f3e8
- 深灰边框：#34495e
- 像素粉：#ff6b9d
- 像素蓝：#4ecdc4
