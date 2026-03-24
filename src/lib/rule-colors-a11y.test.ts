import { describe, expect, it } from "vitest";

/** sRGB 0–255 → 相对亮度（WCAG） */
function relLuminance(hex: string): number {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = ((n >> 16) & 0xff) / 255;
  const g = ((n >> 8) & 0xff) / 255;
  const b = (n & 0xff) / 255;
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a: string, b: string): number {
  const L1 = relLuminance(a);
  const L2 = relLuminance(b);
  const hi = Math.max(L1, L2);
  const lo = Math.min(L1, L2);
  return (hi + 0.05) / (lo + 0.05);
}

/** 7.1.5：Rule 紫系主色与浅色背景的对比度（正文建议 ≥ 4.5:1） */
describe("rule color contrast (globals.css tokens)", () => {
  it("rule-accent on cream bg 约满足 WCAG AA 大文字或 UI 组件", () => {
    const ratio = contrast("#5d4f6e", "#fffef8");
    expect(ratio).toBeGreaterThan(3);
  });
});
