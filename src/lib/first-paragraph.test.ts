import { describe, expect, it } from "vitest";
import { takeFirstParagraph, takeHeadingAndFirstParagraph } from "@/lib/first-paragraph";

describe("takeFirstParagraph", () => {
  it("空串", () => {
    expect(takeFirstParagraph("")).toBe("");
    expect(takeFirstParagraph("  \n  ")).toBe("");
  });

  it("无空行时返回全文 trim", () => {
    expect(takeFirstParagraph("a\nb")).toBe("a\nb");
  });

  it("双换行后只取第一段", () => {
    expect(takeFirstParagraph("第一段\n\n第二段很长\n\n第三")).toBe("第一段");
  });

  it("多段空行", () => {
    expect(takeFirstParagraph("A\n\n\nB")).toBe("A");
  });
});

describe("takeHeadingAndFirstParagraph", () => {
  it("标题 + 空行 + 第一段，遇第二段前停止", () => {
    expect(
      takeHeadingAndFirstParagraph("## 概述\n\n这是第一段。\n\n这是第二段。"),
    ).toBe("## 概述\n\n这是第一段。");
  });

  it("标题后无空行，单换行仍属同一段直至空行", () => {
    expect(
      takeHeadingAndFirstParagraph("# 标题\n行二\n行三\n\n下一段"),
    ).toBe("# 标题\n\n行二\n行三");
  });

  it("遇下一标题则停止", () => {
    expect(
      takeHeadingAndFirstParagraph("# A\n\n正文\n## B\n\n不纳入"),
    ).toBe("# A\n\n正文");
  });

  it("仅标题无正文", () => {
    expect(takeHeadingAndFirstParagraph("# 只有标题\n\n## 别的")).toBe("# 只有标题");
  });

  it("无 ATX 标题时退回第一段逻辑", () => {
    expect(takeHeadingAndFirstParagraph("前言\n\n后文")).toBe("前言");
  });
});
