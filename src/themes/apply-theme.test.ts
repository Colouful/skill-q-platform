import { afterEach, describe, expect, it } from "vitest";
import { applyHubThemeToDocument } from "./apply-theme";
import { THEME_ORDER } from "./index";

describe("applyHubThemeToDocument", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("style");
  });

  it("sets data-theme and CSS variables for pixel", () => {
    applyHubThemeToDocument("pixel", { useViewTransition: false });
    expect(document.documentElement.getAttribute("data-theme")).toBe("pixel");
    expect(document.documentElement.style.getPropertyValue("--pixel-bg")).toMatch(/^#/);
  });

  it("applies font override for apple", () => {
    applyHubThemeToDocument("apple", { useViewTransition: false });
    expect(document.documentElement.style.getPropertyValue("--font-pixel-body")).toMatch(
      /-apple-system|Segoe UI|system-ui/,
    );
  });

  it("removes font override when switching back to pixel", () => {
    applyHubThemeToDocument("apple", { useViewTransition: false });
    applyHubThemeToDocument("pixel", { useViewTransition: false });
    expect(document.documentElement.style.getPropertyValue("--font-pixel-body")).toBe("");
  });

  it("sets data-theme and variables for ink (monochrome sketch)", () => {
    applyHubThemeToDocument("ink", { useViewTransition: false });
    expect(document.documentElement.getAttribute("data-theme")).toBe("ink");
    expect(document.documentElement.style.getPropertyValue("--pixel-bg")).toMatch(/^#/);
  });

  it("applies every registered theme id", () => {
    for (const id of THEME_ORDER) {
      applyHubThemeToDocument(id, { useViewTransition: false });
      expect(document.documentElement.getAttribute("data-theme")).toBe(id);
    }
  });

  it("single theme apply completes quickly (jsdom)", () => {
    const t0 = performance.now();
    applyHubThemeToDocument("apple", { useViewTransition: false });
    expect(performance.now() - t0).toBeLessThan(100);
  });
});
