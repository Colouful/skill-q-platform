import type { HubThemeDefinition, ThemeId } from "./types";
import { ALL_THEME_INLINE_CSS_KEYS, themes } from "./index";

const FONT_HEADING = "--font-pixel-heading";
const FONT_BODY = "--font-pixel-body";

function runWithOptionalViewTransition(fn: () => void) {
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => { finished: Promise<void> };
  };
  if (typeof doc.startViewTransition === "function") {
    doc.startViewTransition(fn);
  } else {
    fn();
  }
}

/** 将主题写入 `<html>`，与现有 `--pixel-*` / shadcn 变量对齐 */
export function applyHubThemeToDocument(themeId: ThemeId, opts?: { useViewTransition?: boolean }) {
  const root = document.documentElement;
  const theme = themes[themeId] as HubThemeDefinition;
  const apply = () => {
    for (const key of ALL_THEME_INLINE_CSS_KEYS) {
      root.style.removeProperty(key);
    }
    root.setAttribute("data-theme", themeId);
    for (const [key, value] of Object.entries(theme.hubCss)) {
      if (value != null) {
        root.style.setProperty(key, value);
      }
    }
    if (theme.fontOverride) {
      root.style.setProperty(FONT_HEADING, theme.fontOverride.heading);
      root.style.setProperty(FONT_BODY, theme.fontOverride.body);
    } else {
      root.style.removeProperty(FONT_HEADING);
      root.style.removeProperty(FONT_BODY);
    }
  };

  if (opts?.useViewTransition) {
    runWithOptionalViewTransition(apply);
  } else {
    apply();
  }
}

export function getThemeDefinition(id: ThemeId): HubThemeDefinition {
  return themes[id] as HubThemeDefinition;
}
