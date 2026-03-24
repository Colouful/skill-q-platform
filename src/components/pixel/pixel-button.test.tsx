import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PixelButton } from "./pixel-button";

describe("PixelButton", () => {
  it("渲染可访问的按钮", () => {
    render(<PixelButton>测试</PixelButton>);
    expect(screen.getByRole("button", { name: "测试" })).toBeInstanceOf(
      HTMLButtonElement,
    );
  });

  it("支持 variant=rule（7.4.4）", () => {
    render(<PixelButton variant="rule">Rule</PixelButton>);
    expect(screen.getByRole("button", { name: "Rule" })).toBeInstanceOf(HTMLButtonElement);
  });
});
