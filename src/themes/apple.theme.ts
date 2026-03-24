import type { HubThemeDefinition } from "./types";

/**
 * Apple 风（任务书 3.1 对齐说明）
 * - primary 蓝：`--pixel-accent` / `--pixel-cyan` ≈ #0071e3～#0077ed
 * - 浅灰底：`--pixel-bg` / `--background` ≈ #fbfbfd（接近 #f5f5f7）
 * - 正文黑：`--pixel-fg` / `--foreground` = #1d1d1f
 * - 圆角：`--hub-radius-sm` 8px、`--hub-radius-md` 12px、`--hub-radius-lg` 20px
 * - 阴影：弥散型，见各 `--hub-shadow-*`
 * - 动效：全局 `html` transition ~280ms；细粒度 duration 由组件侧决定
 */
export const appleTheme: HubThemeDefinition = {
  meta: {
    id: "apple",
    name: "Apple 风",
    description: "现代简约、大圆角与柔和阴影",
    author: "AgentHub",
    version: "1.0.0",
    previewColor: "#0077ed",
  },
  hubCss: {
    /* 页面底：略偏冷的「纸白」，比纯 #f5f5f7 更干净 */
    "--pixel-bg": "#fbfbfd",
    "--pixel-fg": "#1d1d1f",
    /* 边框：浅灰分隔，避免发闷 */
    "--pixel-border": "#e5e5ea",
    /* 主强调：Apple 蓝，hover 略亮用 cyan 位 */
    "--pixel-accent": "#0071e3",
    /* 次级文案：官方系灰色，比 #6e6e73 更顺眼看长文 */
    "--pixel-muted": "#86868b",
    "--pixel-cyan": "#0077ed",
    /* 原 yellow 位：用作浅高亮块/选中底（淡蓝灰，不脏） */
    "--pixel-yellow": "#e8f0fe",
    /* Rule 轨：靛紫系，与 Skill 青蓝区分，仍保持「现代」而非水泥灰 */
    "--rule-border": "#b0b0d0",
    "--rule-shadow": "#8a8aa8",
    "--rule-accent": "#5e5ce6",
    "--background": "#fbfbfd",
    "--foreground": "#1d1d1f",
    "--card": "#ffffff",
    "--muted-foreground": "#86868b",
    "--border": "#e5e5ea",
    /* 形态：细线、大圆角、柔和弥散阴影（Human Interface） */
    "--hub-border-width": "1px",
    "--hub-radius-sm": "8px",
    "--hub-radius-md": "12px",
    "--hub-radius-lg": "20px",
    "--hub-corner-dot-size": "0px",
    "--hub-surface-elevated": "#ffffff",
    "--hub-shadow-btn-primary":
      "0 1px 2px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.08)",
    "--hub-shadow-btn-cyan": "0 1px 2px rgba(0,0,0,0.06), 0 4px 14px rgba(0,119,237,0.22)",
    "--hub-shadow-btn-outline": "0 1px 3px rgba(0,0,0,0.06)",
    "--hub-shadow-btn-rule": "0 1px 2px rgba(0,0,0,0.05), 0 4px 12px rgba(94,92,230,0.18)",
    "--hub-shadow-card-skill": "0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.06)",
    "--hub-shadow-card-rule": "0 2px 8px rgba(0,0,0,0.05), 0 8px 24px rgba(94,92,230,0.1)",
    "--hub-shadow-dialog": "0 12px 48px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.06)",
    "--hub-shadow-btn-primary-hover": "0 4px 16px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.08)",
    "--hub-shadow-btn-cyan-hover": "0 4px 18px rgba(0,119,237,0.28), 0 8px 28px rgba(0,119,237,0.15)",
    "--hub-shadow-btn-outline-hover": "0 2px 8px rgba(0,0,0,0.08)",
    "--hub-shadow-btn-rule-hover": "0 4px 16px rgba(94,92,230,0.22), 0 8px 24px rgba(94,92,230,0.12)",
  },
  fontOverride: {
    heading:
      '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    body: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif',
  },
};
