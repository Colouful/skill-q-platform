import type { HubThemeDefinition } from "./types";

/**
 * 素描（铅笔感）：暖灰画纸 + 石墨色阶（非纯黑）、错位阴影模拟笔触/擦痕；
 * 拉丁文用 Caveat（`--font-ink`），中文衬线回退。
 */
export const inkTheme: HubThemeDefinition = {
  meta: {
    id: "ink",
    name: "素描",
    description: "铅笔线稿、画纸纹理与手绘笔迹",
    author: "AgentHub",
    version: "2.0.0",
    previewColor: "#6b6560",
  },
  hubCss: {
    /* 画纸：偏暖 Bristol，避免冷白 */
    "--pixel-bg": "#ebe6dc",
    /* 线稿主色：2B～4B 石墨，非纯黑 */
    "--pixel-fg": "#353330",
    "--pixel-border": "#5a5652",
    "--pixel-accent": "#4a4642",
    "--pixel-muted": "#7a7670",
    "--pixel-cyan": "#5c5854",
    "--pixel-yellow": "#ddd8cf",
    "--rule-border": "#6a6560",
    "--rule-shadow": "#4a4540",
    "--rule-accent": "#5a5550",
    "--background": "#ebe6dc",
    "--foreground": "#353330",
    "--card": "#f2ede4",
    "--muted-foreground": "#7a7670",
    "--border": "#6a6560",
    "--hub-border-width": "2px",
    "--hub-radius-sm": "11px",
    "--hub-radius-md": "15px 13px 17px 14px",
    "--hub-radius-lg": "19px 17px 21px 18px",
    "--hub-corner-dot-size": "3px",
    "--hub-surface-elevated": "#f2ede4",
    /* 多层软阴影：模拟铅笔侧锋与纸面摩擦，而非纯硬黑块 */
    "--hub-shadow-btn-primary":
      "3px 4px 0 rgba(62,58,54,0.2), 5px 6px 0 rgba(62,58,54,0.08), 0 2px 10px rgba(50,48,44,0.08)",
    "--hub-shadow-btn-cyan":
      "3px 4px 0 rgba(72,68,64,0.16), 0 0 0 1px rgba(90,86,80,0.08)",
    "--hub-shadow-btn-outline": "2px 3px 0 rgba(72,68,64,0.12), 0 1px 3px rgba(72,68,64,0.06)",
    "--hub-shadow-btn-rule":
      "3px 4px 0 rgba(74,70,66,0.18), 5px 5px 0 rgba(74,70,66,0.05)",
    "--hub-shadow-card-skill":
      "4px 5px 0 rgba(68,64,60,0.14), 7px 8px 14px rgba(55,52,48,0.08), 0 0 0 1px rgba(90,86,80,0.06)",
    "--hub-shadow-card-rule":
      "4px 5px 0 rgba(72,68,64,0.15), 0 0 0 1px rgba(90,86,82,0.05)",
    "--hub-shadow-dialog":
      "6px 8px 0 rgba(58,54,50,0.16), 12px 14px 28px rgba(45,42,40,0.1)",
    "--hub-shadow-btn-primary-hover":
      "2px 3px 0 rgba(62,58,54,0.18), 4px 5px 12px rgba(55,52,48,0.1)",
    "--hub-shadow-btn-cyan-hover":
      "2px 3px 0 rgba(72,68,64,0.14), 4px 5px 0 rgba(72,68,64,0.06)",
    "--hub-shadow-btn-outline-hover": "1px 2px 0 rgba(72,68,64,0.12)",
    "--hub-shadow-btn-rule-hover":
      "2px 3px 0 rgba(74,70,66,0.16), 4px 5px 8px rgba(55,52,48,0.08)",
  },
  fontOverride: {
    heading:
      'var(--font-ink), "Noto Serif SC", "Songti SC", "STSong", "KaiTi", Georgia, ui-serif, serif',
    body: 'var(--font-ink), "Noto Serif SC", "Songti SC", "STSong", Georgia, ui-serif, serif',
  },
};
