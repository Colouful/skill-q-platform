# 主题系统（多主题切换）

## 概览

- **主题 ID**（`ThemeId`）：`pixel` | `apple` | `sketch` | `ink`
- **配置**：`src/themes/*.theme.ts`，在 `src/themes/index.ts` 注册并加入 `THEME_ORDER`（决定切换器顺序）。
- **应用**：客户端 `applyHubThemeToDocument` 写入 `<html data-theme="…">` 与行内 CSS 变量；切换前会清理 `ALL_THEME_INLINE_CSS_KEYS`，避免跨主题残留。
- **持久化**：`localStorage` 键 `preferred-theme`；**多标签**通过 `storage` 事件同步（见 `ThemeProvider`）。
- **字体**：像素风使用 `layout.tsx` 内 Press Start 2P / VT323；其余主题可通过 `fontOverride` 覆盖 `--font-pixel-heading` / `--font-pixel-body`。素描 `ink` 额外使用 `--font-ink`（Caveat）。

## 新增或修改主题

1. 复制 `pixel.theme.ts` 或 `ink.theme.ts` 为新文件，实现 `HubThemeDefinition`（`meta` + `hubCss` + 可选 `fontOverride`）。
2. 在 `src/themes/types.ts` 扩展 `ThemeId`。
3. 在 `src/themes/index.ts` 导入、`themes` 注册、`THEME_ORDER` 排序、`isThemeId` 分支。
4. 若需特殊全局样式，在 `src/app/globals.css` 使用 `html[data-theme="你的id"]` 选择器。
5. 为 `applyHubThemeToDocument` 增加或复用单测（`src/themes/apply-theme.test.ts`）。

## 主题切换器

- 组件：`src/themes/ThemeSwitcher.tsx`
- **键盘**：展开后 `↑/↓`、`Home`/`End` 移动高亮，`Esc` 关闭并焦点回按钮；折叠时 `↓` 可展开。
- **无障碍**：`role="listbox"` / `role="option"` / `aria-activedescendant` / `aria-busy`（切换中）。

## 预览页

- 路由：**`/theme-preview`**（`src/app/theme-preview/page.tsx`）
- 用于快速查看四主题色板与描述，无需业务数据。

## 相关文件

| 路径 | 说明 |
|------|------|
| `src/themes/ThemeProvider.tsx` | Context、`isTransitioning`、localStorage、storage 同步 |
| `src/components/theme/theme-transition-overlay.tsx` | 切换瞬间轻遮罩 |
| `public/patterns/sketch-paper.svg` | 仅 `ink` 主题画纸纹理 |

## FAQ

**Q：用户曾选 `sketch`，现在看到「手绘风」而不是黑白？**  
A：黑白素描主题为 `ink`，请在切换器中选「素描」。

**Q：生产构建是否包含预览页？**  
A：包含；若需隐藏，可加环境变量在中间件中拦截 `/theme-preview`。
