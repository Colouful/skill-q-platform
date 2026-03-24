import type { HubThemeDefinition, ThemeId } from "./types";
import { appleTheme } from "./apple.theme";
import { inkTheme } from "./ink.theme";
import { pixelTheme } from "./pixel.theme";
import { sketchTheme } from "./sketch.theme";

export const themes: Record<ThemeId, HubThemeDefinition> = {
  pixel: pixelTheme,
  apple: appleTheme,
  sketch: sketchTheme,
  ink: inkTheme,
};

export const THEME_ORDER: ThemeId[] = ["pixel", "apple", "sketch", "ink"];

export const THEME_STORAGE_KEY = "preferred-theme";

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return value === "pixel" || value === "apple" || value === "sketch" || value === "ink";
}

/** 切换主题前从 `<html>` 行内样式移除，避免 Apple 变量残留在像素风上 */
export const ALL_THEME_INLINE_CSS_KEYS: string[] = (() => {
  const s = new Set<string>();
  for (const t of Object.values(themes)) {
    for (const k of Object.keys(t.hubCss)) s.add(k);
  }
  return [...s];
})();
