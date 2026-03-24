# Technical Design: AgentHub 多主题切换系统

## Context

AgentHub 需要从单一像素风格扩展为多主题系统，支持像素/Apple/手绘三款主题无刷新切换。设计基于现有像素风格，提取 CSS 变量系统，实现主题配置化和切换器组件。

## Goals / Non-Goals

**Goals:**
- 实现三款完整主题（像素/Apple/手绘）
- 主题切换无刷新、丝滑流畅（< 300ms）
- 主题配置独立文件，易于扩展
- 用户偏好持久化
- 所有组件支持主题切换

**Non-Goals:**
- 深色/浅色模式自动切换
- 用户自定义主题
- 组件级主题

## Decisions

### 1. 主题架构设计

**方案选择**: CSS 变量 vs 动态加载样式表

**决策**: 使用 CSS 变量系统

**理由**:
- 性能更优（无需重新加载样式表）
- 无刷新切换（仅更改变量值）
- 支持平滑过渡（CSS transition）
- 浏览器原生支持（兼容性好）

**架构**:
```
┌─────────────────────────────────────────────────────────┐
│                   Theme System Architecture              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │   Pixel     │    │    Apple    │    │   Sketch    │ │
│  │   Theme     │    │   Theme     │    │   Theme     │ │
│  │  (像素风)   │    │  (现代风)   │    │  (手绘风)   │ │
│  └─────────────┘    └─────────────┘    └─────────────┘ │
│         ↓                  ↓                  ↓         │
│  ┌─────────────────────────────────────────────────────┐│
│  │           Theme Config Files (src/themes/)          ││
│  │  - pixel.theme.ts    - apple.theme.ts               ││
│  │  - sketch.theme.ts   - index.ts (exports)           ││
│  └─────────────────────────────────────────────────────┘│
│                           ↓                              │
│  ┌─────────────────────────────────────────────────────┐│
│  │         Theme Provider (React Context)              ││
│  │  - useTheme() hook                                  ││
│  │  - setTheme() function                              ││
│  │  - localStorage persistence                         ││
│  └─────────────────────────────────────────────────────┘│
│                           ↓                              │
│  ┌─────────────────────────────────────────────────────┐│
│  │      CSS Variables (:root, [data-theme])            ││
│  │  - --color-primary, --font-family, --border-radius  ││
│  │  - Applied to all components automatically          ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2. 主题配置文件结构

**文件位置**: `src/themes/`

```
src/themes/
├── index.ts                  # 主题导出和类型定义
├── types.ts                  # 主题类型定义
├── pixel.theme.ts            # 像素风主题配置
├── apple.theme.ts            # Apple 风主题配置
├── sketch.theme.ts           # 手绘风主题配置
├── ThemeProvider.tsx         # React Context Provider
├── ThemeSwitcher.tsx         # 主题切换器组件
└── useTheme.ts               # useTheme Hook
```

### 3. 主题配置 Schema

**文件**: `src/themes/types.ts`

```typescript
// 主题元数据
export interface ThemeMeta {
  id: string;              // 主题唯一标识
  name: string;            // 主题名称
  description: string;     // 主题描述
  author: string;          // 主题作者
  version: string;         // 主题版本
  previewColor: string;    // 预览颜色（用于切换器）
}

// CSS 变量定义
export interface ThemeVariables {
  // 颜色系统
  colors: {
    // 主色
    primary: string;
    primaryHover: string;
    primaryLight: string;
    
    // 背景色
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    bgElevated: string;
    
    // 文字色
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    textInverse: string;
    
    // 边框色
    borderPrimary: string;
    borderSubtle: string;
    
    // 功能色
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  
  // 字体系统
  fonts: {
    family: string;
    familyMono: string;
    sizeBase: string;
    sizeScale: number;
  };
  
  // 圆角系统
  radii: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  
  // 阴影系统
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    colored: string;  // 带主题色的阴影
  };
  
  // 动画系统
  animations: {
    duration: string;
    easing: string;
    transition: string;
  };
  
  // 特殊效果
  effects: {
    borderStyle?: string;      // 边框样式（像素风用）
    backgroundImage?: string;  // 背景纹理（手绘风用）
    filter?: string;           // CSS 滤镜
  };
}

// 完整主题接口
export interface Theme {
  meta: ThemeMeta;
  variables: ThemeVariables;
}
```

### 4. 三款主题设计

#### 4.1 像素风主题（Pixel）- 保留现有

**文件**: `src/themes/pixel.theme.ts`

```typescript
export const pixelTheme: Theme = {
  meta: {
    id: 'pixel',
    name: '像素风',
    description: '8-bit 游戏怀旧风格，龙虾元素贯穿全站',
    author: 'AgentHub Team',
    version: '1.0.0',
    previewColor: '#4ecdc4',
  },
  variables: {
    colors: {
      primary: '#4ecdc4',        // 像素蓝
      primaryHover: '#3db9b0',
      primaryLight: '#e0f7fa',
      bgPrimary: '#fafafa',
      bgSecondary: '#ffffff',
      bgTertiary: '#f5f5f7',
      bgElevated: '#ffffff',
      textPrimary: '#1a1a1a',
      textSecondary: '#4a4a4a',
      textTertiary: '#8a8a8a',
      textInverse: '#ffffff',
      borderPrimary: '#d0d0d0',
      borderSubtle: '#e8e8e8',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    fonts: {
      family: '"Press Start 2P", cursive',
      familyMono: '"VT323", monospace',
      sizeBase: '16px',
      sizeScale: 1.2,
    },
    radii: {
      sm: '0px',
      md: '0px',
      lg: '0px',
      xl: '0px',
      full: '9999px',
    },
    shadows: {
      sm: '4px 4px 0px rgba(0,0,0,0.1)',
      md: '6px 6px 0px rgba(0,0,0,0.15)',
      lg: '8px 8px 0px rgba(0,0,0,0.2)',
      xl: '10px 10px 0px rgba(0,0,0,0.25)',
      colored: '6px 6px 0px rgba(78, 205, 196, 0.4)',
    },
    animations: {
      duration: '300ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
    effects: {
      borderStyle: '4px solid',
    },
  },
};
```

#### 4.2 Apple 风主题（Modern）- 现代简约

**文件**: `src/themes/apple.theme.ts`

```typescript
export const appleTheme: Theme = {
  meta: {
    id: 'apple',
    name: 'Apple 风',
    description: '现代简约，类似 Apple 官网，极致优雅',
    author: 'AgentHub Team',
    version: '1.0.0',
    previewColor: '#0071e3',
  },
  variables: {
    colors: {
      primary: '#0071e3',        // Apple 蓝
      primaryHover: '#0077ed',
      primaryLight: '#e3f2fd',
      bgPrimary: '#ffffff',
      bgSecondary: '#f5f5f7',    // Apple 浅灰
      bgTertiary: '#efeff4',
      bgElevated: '#ffffff',
      textPrimary: '#1d1d1f',    // Apple 黑
      textSecondary: '#6e6e73',
      textTertiary: '#86868b',
      textInverse: '#ffffff',
      borderPrimary: '#d2d2d7',
      borderSubtle: '#e5e5ea',
      success: '#34c759',
      warning: '#ff9500',
      error: '#ff3b30',
      info: '#0071e3',
    },
    fonts: {
      family: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
      familyMono: '"SF Mono", Monaco, "Cascadia Code", monospace',
      sizeBase: '16px',
      sizeScale: 1.25,
    },
    radii: {
      sm: '6px',
      md: '10px',
      lg: '14px',
      xl: '20px',
      full: '9999px',
    },
    shadows: {
      sm: '0 1px 3px rgba(0,0,0,0.1)',
      md: '0 4px 12px rgba(0,0,0,0.1)',
      lg: '0 8px 24px rgba(0,0,0,0.12)',
      xl: '0 12px 40px rgba(0,0,0,0.15)',
      colored: '0 4px 16px rgba(0, 113, 227, 0.3)',
    },
    animations: {
      duration: '400ms',
      easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      transition: 'all 400ms cubic-bezier(0.25, 0.1, 0.25, 1)',
    },
    effects: {
      // Apple 风无需特殊效果
    },
  },
};
```

#### 4.3 手绘风主题（Sketch）- 温馨创意

**文件**: `src/themes/sketch.theme.ts`

```typescript
export const sketchTheme: Theme = {
  meta: {
    id: 'sketch',
    name: '手绘风',
    description: '温馨创意，手绘质感，像笔记本一样亲切',
    author: 'AgentHub Team',
    version: '1.0.0',
    previewColor: '#ff6b6b',
  },
  variables: {
    colors: {
      primary: '#ff6b6b',        // 珊瑚红
      primaryHover: '#ee5a5a',
      primaryLight: '#ffe3e3',
      bgPrimary: '#fffcf5',      // 米白色（纸张质感）
      bgSecondary: '#fff9e6',
      bgTertiary: '#fff3d1',
      bgElevated: '#ffffff',
      textPrimary: '#2d3436',
      textSecondary: '#636e72',
      textTertiary: '#b2bec3',
      textInverse: '#ffffff',
      borderPrimary: '#dfe6e9',
      borderSubtle: '#f0f0f0',
      success: '#55efc4',
      warning: '#ffeaa7',
      error: '#ff7675',
      info: '#74b9ff',
    },
    fonts: {
      family: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", cursive',
      familyMono: '"Courier New", monospace',
      sizeBase: '16px',
      sizeScale: 1.3,
    },
    radii: {
      sm: '8px',
      md: '12px',
      lg: '16px',
      xl: '24px',
      full: '9999px',
    },
    shadows: {
      sm: '2px 2px 4px rgba(0,0,0,0.08)',
      md: '4px 4px 8px rgba(0,0,0,0.1)',
      lg: '6px 6px 12px rgba(0,0,0,0.12)',
      xl: '8px 8px 20px rgba(0,0,0,0.15)',
      colored: '4px 4px 12px rgba(255, 107, 107, 0.3)',
    },
    animations: {
      duration: '350ms',
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',  // 弹性效果
      transition: 'all 350ms cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
    effects: {
      borderStyle: '2px solid #2d3436',
      backgroundImage: 'url("/patterns/sketch-paper.svg")',  // 纸张纹理
      filter: 'contrast(1.05) saturate(1.1)',
    },
  },
};
```

### 5. Theme Provider 实现

**文件**: `src/themes/ThemeProvider.tsx`

```typescript
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme, ThemeId } from './types';
import { themes } from './index';

interface ThemeContextType {
  currentTheme: Theme;
  themeId: ThemeId;
  setTheme: (themeId: ThemeId) => void;
  availableThemes: Theme[];
  isTransitioning: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>('pixel');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 服务端渲染后挂载
  useEffect(() => {
    setMounted(true);
    // 从 localStorage 读取用户偏好
    const saved = localStorage.getItem('preferred-theme') as ThemeId;
    if (saved && themes[saved]) {
      setThemeId(saved);
    }
  }, []);

  // 应用主题
  useEffect(() => {
    if (!mounted) return;

    const theme = themes[themeId];
    const root = document.documentElement;

    // 使用 View Transition API（如果支持）
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        applyThemeVariables(root, theme);
      });
    } else {
      applyThemeVariables(root, theme);
    }

    // 保存偏好
    localStorage.setItem('preferred-theme', themeId);
  }, [themeId, mounted]);

  const setTheme = (newThemeId: ThemeId) => {
    if (newThemeId !== themeId) {
      setIsTransitioning(true);
      setThemeId(newThemeId);
      setTimeout(() => setIsTransitioning(false), 400);
    }
  };

  const value = {
    currentTheme: themes[themeId],
    themeId,
    setTheme,
    availableThemes: Object.values(themes),
    isTransitioning,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

function applyThemeVariables(root: HTMLElement, theme: Theme) {
  const { colors, fonts, radii, shadows, animations, effects } = theme.variables;

  // 设置 data-theme 属性
  root.setAttribute('data-theme', theme.meta.id);

  // 应用 CSS 变量
  const style = root.style;
  
  // 颜色变量
  style.setProperty('--color-primary', colors.primary);
  style.setProperty('--color-primary-hover', colors.primaryHover);
  style.setProperty('--color-primary-light', colors.primaryLight);
  style.setProperty('--bg-primary', colors.bgPrimary);
  style.setProperty('--bg-secondary', colors.bgSecondary);
  style.setProperty('--bg-tertiary', colors.bgTertiary);
  style.setProperty('--bg-elevated', colors.bgElevated);
  style.setProperty('--text-primary', colors.textPrimary);
  style.setProperty('--text-secondary', colors.textSecondary);
  style.setProperty('--text-tertiary', colors.textTertiary);
  style.setProperty('--text-inverse', colors.textInverse);
  style.setProperty('--border-primary', colors.borderPrimary);
  style.setProperty('--border-subtle', colors.borderSubtle);
  style.setProperty('--color-success', colors.success);
  style.setProperty('--color-warning', colors.warning);
  style.setProperty('--color-error', colors.error);
  style.setProperty('--color-info', colors.info);

  // 字体变量
  style.setProperty('--font-family', fonts.family);
  style.setProperty('--font-family-mono', fonts.familyMono);
  style.setProperty('--font-size-base', fonts.sizeBase);
  style.setProperty('--font-size-scale', fonts.sizeScale.toString());

  // 圆角变量
  style.setProperty('--radius-sm', radii.sm);
  style.setProperty('--radius-md', radii.md);
  style.setProperty('--radius-lg', radii.lg);
  style.setProperty('--radius-xl', radii.xl);
  style.setProperty('--radius-full', radii.full);

  // 阴影变量
  style.setProperty('--shadow-sm', shadows.sm);
  style.setProperty('--shadow-md', shadows.md);
  style.setProperty('--shadow-lg', shadows.lg);
  style.setProperty('--shadow-xl', shadows.xl);
  style.setProperty('--shadow-colored', shadows.colored);

  // 动画变量
  style.setProperty('--transition-duration', animations.duration);
  style.setProperty('--transition-easing', animations.easing);
  style.setProperty('--transition', animations.transition);

  // 特殊效果
  if (effects.borderStyle) {
    style.setProperty('--border-style', effects.borderStyle);
  }
  if (effects.backgroundImage) {
    style.setProperty('--bg-pattern', effects.backgroundImage);
  }
  if (effects.filter) {
    style.setProperty('--filter-effect', effects.filter);
  }
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

### 6. 主题切换器组件

**文件**: `src/themes/ThemeSwitcher.tsx`

```typescript
'use client';

import { useTheme } from './useTheme';
import { Theme } from './types';

export function ThemeSwitcher() {
  const { currentTheme, setTheme, availableThemes, isTransitioning } = useTheme();

  return (
    <div className="relative">
      {/* 主题切换按钮 */}
      <button
        className="theme-switcher-btn"
        aria-label="切换主题"
        aria-haspopup="true"
      >
        🎨
        <span className="hidden md:inline">{currentTheme.meta.name}</span>
      </button>

      {/* 主题下拉菜单 */}
      <div className="theme-dropdown">
        {availableThemes.map((theme) => (
          <button
            key={theme.meta.id}
            className={`theme-option ${currentTheme.meta.id === theme.meta.id ? 'active' : ''}`}
            onClick={() => setTheme(theme.meta.id as any)}
          >
            {/* 主题预览色块 */}
            <div
              className="theme-preview"
              style={{ backgroundColor: theme.meta.previewColor }}
            />
            
            {/* 主题信息 */}
            <div className="theme-info">
              <span className="theme-name">{theme.meta.name}</span>
              <span className="theme-desc">{theme.meta.description}</span>
            </div>

            {/* 选中指示器 */}
            {currentTheme.meta.id === theme.meta.id && (
              <span className="checkmark">✓</span>
            )}
          </button>
        ))}
      </div>

      {/* 切换中遮罩（可选） */}
      {isTransitioning && (
        <div className="theme-transition-overlay" />
      )}
    </div>
  );
}
```

### 7. 主题切换器样式

**文件**: `src/components/common/ThemeSwitcher.styles.ts`

```typescript
export const themeSwitcherStyles = `
.theme-switcher-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--bg-secondary);
  border: 2px solid var(--border-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition);
  font-family: var(--font-family);
  font-size: 14px;
  color: var(--text-primary);
}

.theme-switcher-btn:hover {
  background: var(--bg-tertiary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.theme-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: var(--bg-elevated);
  border: 2px solid var(--border-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  padding: 12px;
  min-width: 280px;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 200ms ease;
}

.theme-switcher-btn:hover + .theme-dropdown,
.theme-dropdown:hover {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px;
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition);
  text-align: left;
}

.theme-option:hover {
  background: var(--bg-secondary);
}

.theme-option.active {
  background: var(--color-primary-light);
  border: 2px solid var(--color-primary);
}

.theme-preview {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  border: 2px solid var(--border-primary);
  flex-shrink: 0;
}

.theme-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.theme-name {
  font-family: var(--font-family);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.theme-desc {
  font-size: 12px;
  color: var(--text-secondary);
}

.checkmark {
  font-size: 20px;
  color: var(--color-primary);
}

.theme-transition-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-primary);
  opacity: 0;
  animation: fadeInOut 400ms ease;
  pointer-events: none;
  z-index: 9999;
}

@keyframes fadeInOut {
  0% { opacity: 0; }
  50% { opacity: 0.3; }
  100% { opacity: 0; }
}

/* View Transition API 支持 */
@supports (view-transition-name: none) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation-duration: 300ms;
  }
}
`;
```

### 8. 全局样式集成

**文件**: `src/styles/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 导入主题切换器样式 */
@import './theme-switcher.css';

/* 基础主题变量（默认像素风） */
:root {
  /* 默认值，会被 ThemeProvider 覆盖 */
  --color-primary: #4ecdc4;
  --bg-primary: #fafafa;
  --text-primary: #1a1a1a;
  /* ... 其他变量 */
}

/* 基础样式使用变量 */
body {
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-family);
  transition: background-color 300ms ease, color 300ms ease;
}

/* 组件样式使用变量 */
.btn-primary {
  background: var(--color-primary);
  color: var(--text-inverse);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  transition: var(--transition);
}

.btn-primary:hover {
  background: var(--color-primary-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.card {
  background: var(--bg-elevated);
  border: 2px solid var(--border-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

/* 手绘风背景纹理 */
[data-theme="sketch"] {
  background-image: var(--bg-pattern);
  filter: var(--filter-effect);
}
```

### 9. 应用集成

**文件**: `src/app/layout.tsx`

```typescript
import { ThemeProvider } from '@/themes/ThemeProvider';
import '@/styles/globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head />
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**文件**: `src/components/layout/Navbar.tsx`（扩展）

```typescript
import { ThemeSwitcher } from '@/themes/ThemeSwitcher';

export function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        {/* Logo */}
      </div>
      
      <div className="navbar-center">
        {/* 导航链接：首页、Skills、Rules */}
      </div>
      
      <div className="navbar-right">
        {/* 搜索框 */}
        
        {/* 主题切换器（新增） */}
        <ThemeSwitcher />
        
        {/* 用户菜单 */}
      </div>
    </nav>
  );
}
```

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| **View Transition API 兼容性** | 低 | 降级方案：直接更改变量，无动画 |
| **样式遗漏导致显示异常** | 中 | 建立样式审查清单，E2E 测试全覆盖 |
| **性能开销** | 低 | 主题配置预加载，避免运行时计算 |
| **localStorage 同步问题** | 低 | 多标签页使用 storage 事件同步 |
| **移动端下拉菜单体验** | 低 | 移动端使用底部弹窗代替下拉 |

## Migration Plan

```
Phase 1: 主题系统基础设施（Day 1-2）
├── 创建主题配置类型定义
├── 实现 ThemeProvider 和 useTheme Hook
├── 创建三款主题配置文件
└── 测试主题切换基础功能

Phase 2: CSS 变量系统（Day 3-4）
├── 提取现有像素风 CSS 变量
├── 全局样式迁移到变量系统
├── 组件样式迁移到变量系统
└── 验证像素风正常显示

Phase 3: Apple 风主题实现（Day 5-6）
├── 实现 Apple 风配色和字体
├── 实现 Apple 风圆角和阴影
├── 测试 Apple 风所有页面
└── 优化细节（过渡动画、响应式）

Phase 4: 手绘风主题实现（Day 7-8）
├── 实现手绘风配色和字体
├── 实现手绘风背景纹理
├── 实现手绘风特殊效果
└── 测试手绘风所有页面

Phase 5: 主题切换器 UI（Day 9-10）
├── 实现主题切换器组件
├── 实现下拉菜单和预览
├── 集成到导航栏
├── 实现平滑过渡动画
└── 移动端适配

Phase 6: 测试与优化（Day 11-12）
├── 全页面主题切换测试
├── 性能优化（切换速度）
├── 浏览器兼容性测试
├── 无障碍测试
└── 部署上线
```

## Open Questions

1. **主题数量**: MVP 三款，后续是否支持用户自定义？
   - 决策：MVP 三款，预留扩展接口

2. **主题加载方式**: 全量预加载 vs 按需加载？
   - 决策：全量预加载（主题配置小，< 10KB）

3. **深色模式**: 是否每个主题都支持深色/浅色变体？
   - MVP: 不支持，后续迭代

4. **主题预览**: 是否需要实时预览（hover 时）？
   - MVP: 不需要，点击切换

5. **默认主题**: 首次访问使用哪个主题？
   - 决策：像素风（保持现有体验）
