import { describe, expect, it } from "vitest";
import { applyFontScaleToDocument, isFontScaleId } from "./font-scale";

describe("font-scale", () => {
  it("isFontScaleId", () => {
    expect(isFontScaleId("normal")).toBe(true);
    expect(isFontScaleId("large")).toBe(true);
    expect(isFontScaleId("extraLarge")).toBe(true);
    expect(isFontScaleId("huge")).toBe(false);
    expect(isFontScaleId(null)).toBe(false);
  });

  it("applyFontScaleToDocument sets data-font-scale on html", () => {
    applyFontScaleToDocument("large");
    expect(document.documentElement.dataset.fontScale).toBe("large");
  });
});
