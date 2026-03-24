/** 主题 ID（与 data-theme、localStorage 一致） */
export type ThemeId = "pixel" | "apple" | "sketch" | "ink";

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  description: string;
  author: string;
  version: string;
  previewColor: string;
}

/**
 * 应用到 document.documentElement 的 Hub 变量（与 `globals.css` / 组件中的 var(--pixel-*) 对齐）
 */
export type HubCssVarName =
  | "--pixel-bg"
  | "--pixel-fg"
  | "--pixel-border"
  | "--pixel-accent"
  | "--pixel-muted"
  | "--pixel-cyan"
  | "--pixel-yellow"
  | "--rule-border"
  | "--rule-shadow"
  | "--rule-accent"
  | "--background"
  | "--foreground"
  | "--card"
  | "--muted-foreground"
  | "--border";

export type HubCssVars = Partial<Record<HubCssVarName, string>>;

/** 覆盖 Next/font 注入的 family 变量（切回像素风时 removeProperty） */
export interface ThemeFontOverride {
  /** 对应 `--font-pixel-heading` */
  heading: string;
  /** 对应 `--font-pixel-body` */
  body: string;
}

export interface HubThemeDefinition {
  meta: ThemeMeta;
  /**
   * 写入 `<html>` 行内样式：色板 + 形态 token（`--hub-border-width`、`--hub-shadow-*` 等）。
   * 允许任意 CSS 变量名，便于扩展手绘/苹果专用 token。
   */
  hubCss: Record<string, string>;
  /** 非像素主题时替换正文字体；像素风为 undefined 以沿用 layout 中的 Press Start 2P / VT323 */
  fontOverride?: ThemeFontOverride;
}
