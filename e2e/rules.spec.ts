import { test, expect } from "@playwright/test";

test.describe("Rule 流程", () => {
  test("Rules 列表可打开并展示标题", async ({ page }) => {
    await page.goto("/rules");
    await expect(page.getByRole("heading", { name: "Rules" })).toBeVisible();
  });

  test("Rule 上传页可打开", async ({ page }) => {
    await page.goto("/rules/upload");
    await expect(page.getByRole("heading", { name: "上传 Rule" })).toBeVisible();
  });

  test("搜索页可筛选类型", async ({ page }) => {
    await page.goto("/search?q=test&type=rule");
    await expect(page.getByRole("heading", { name: "搜索" })).toBeVisible();
  });
});
