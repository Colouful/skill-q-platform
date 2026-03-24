import type { FontScaleId } from "./types";

export const FONT_SCALE_STORAGE_KEY = "preferred-font-scale";

export const FONT_SCALE_ORDER: FontScaleId[] = ["normal", "large", "extraLarge"];

export const FONT_SCALE_LABEL: Record<FontScaleId, string> = {
  normal: "正常",
  large: "大",
  extraLarge: "超大",
};

/**
 * 仅放大「文字」尺寸（Tailwind `--text-*`），不放大整页 rem 基准（间距、布局保持原样）。
 * 与任务书比例一致：1 / 1.125 / 1.25。
 */
export const FONT_SCALE_MULTIPLIER: Record<FontScaleId, number> = {
  normal: 1,
  large: 1.125,
  extraLarge: 1.25,
};

export function isFontScaleId(value: string | null | undefined): value is FontScaleId {
  return value === "normal" || value === "large" || value === "extraLarge";
}

/** 将档位写到 `<html data-font-scale>`；`globals.css` 用其设置 `--hub-text-multiplier` 并作用于 `--text-*` */
export function applyFontScaleToDocument(id: FontScaleId): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.fontScale = id;
}
