import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "@/components/hub/status-badge";

describe("StatusBadge", () => {
  it("应正确展示 published 状态", () => {
    render(<StatusBadge status="published" />);
    expect(screen.getByText("已发布")).toBeTruthy();
  });

  it("未知状态应直接展示原始值", () => {
    render(<StatusBadge status="custom" />);
    expect(screen.getByText("custom")).toBeTruthy();
  });
});
