import * as React from "react";
import { act } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PixelInput } from "./pixel-input";
import { PixelTextarea } from "./pixel-textarea";

function ControlledPixelInput() {
  const [value, setValue] = React.useState("后台关键词");

  return (
    <PixelInput
      aria-label="关键词"
      clearable
      value={value}
      onChange={(event) => setValue(event.target.value)}
    />
  );
}

function ControlledPixelTextarea() {
  const [value, setValue] = React.useState("需要清空的多行内容");

  return (
    <PixelTextarea
      aria-label="说明"
      clearable
      value={value}
      onChange={(event) => setValue(event.target.value)}
    />
  );
}

async function expectNoHydrationMismatch(ui: React.ReactElement) {
  const container = document.createElement("div");
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  container.innerHTML = renderToString(ui);
  document.body.appendChild(container);

  let root: ReturnType<typeof hydrateRoot> | null = null;

  await act(async () => {
    root = hydrateRoot(container, ui);
    await Promise.resolve();
  });

  const messages = errorSpy.mock.calls.flat().join("\n");

  await act(async () => {
    root?.unmount();
  });

  errorSpy.mockRestore();
  container.remove();

  expect(messages).not.toContain("Hydration failed");
}

describe("PixelInput", () => {
  it("点击清空按钮后应清空输入框", () => {
    render(<ControlledPixelInput />);

    const input = screen.getByRole("textbox", { name: "关键词" }) as HTMLInputElement;
    expect(input.value).toBe("后台关键词");

    fireEvent.click(screen.getByRole("button", { name: "清空输入" }));

    expect(input.value).toBe("");
  });

  it("SSR 后 hydrate 时不应出现 hydration 报错", async () => {
    await expectNoHydrationMismatch(<ControlledPixelInput />);
  });
});

describe("PixelTextarea", () => {
  it("点击清空按钮后应清空多行输入框", () => {
    render(<ControlledPixelTextarea />);

    const textarea = screen.getByRole("textbox", { name: "说明" }) as HTMLTextAreaElement;
    expect(textarea.value).toBe("需要清空的多行内容");

    fireEvent.click(screen.getByRole("button", { name: "清空输入" }));

    expect(textarea.value).toBe("");
  });

  it("SSR 后 hydrate 时不应出现 hydration 报错", async () => {
    await expectNoHydrationMismatch(<ControlledPixelTextarea />);
  });
});
