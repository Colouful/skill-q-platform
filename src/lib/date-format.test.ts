import { describe, expect, it } from "vitest";
import { formatDateShanghai, formatDateTimeShanghai } from "@/lib/date-format";

describe("date-format", () => {
  it("按上海时区输出日期时间", () => {
    expect(formatDateTimeShanghai("2026-04-10T08:30:00.000Z")).toBe("2026-04-10 16:30");
  });

  it("按上海时区输出日期", () => {
    expect(formatDateShanghai("2026-04-10T16:30:00.000Z")).toBe("2026-04-11");
  });

  it("无效输入返回占位符", () => {
    expect(formatDateTimeShanghai("not-a-date")).toBe("-");
    expect(formatDateShanghai(undefined)).toBe("-");
  });
});
