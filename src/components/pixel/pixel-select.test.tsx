import * as React from "react";
import { act } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PixelSelect } from "./pixel-select";

function ControlledPixelSelect() {
  const [value, setValue] = React.useState("draft");

  return (
    <PixelSelect
      aria-label="发布状态"
      clearable
      value={value}
      onChange={(event) => setValue(event.target.value)}
    >
      <option value="draft">草稿</option>
      <option value="published">已发布</option>
    </PixelSelect>
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

describe("PixelSelect", () => {
  it("点击清空按钮后应清空下拉选择", () => {
    render(<ControlledPixelSelect />);

    const select = screen.getByRole("combobox", { name: "发布状态" }) as HTMLSelectElement;
    expect(select.value).toBe("draft");

    fireEvent.click(screen.getByRole("button", { name: "清空选择" }));

    expect(select.value).toBe("");
  });

  it("SSR 后 hydrate 时不应出现 hydration 报错", async () => {
    await expectNoHydrationMismatch(<ControlledPixelSelect />);
  });
});
