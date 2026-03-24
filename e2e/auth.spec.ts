import { test, expect } from "@playwright/test";

test.describe("特工局认证页", () => {
  test("/me 未登录展示注册/登录", async ({ page }) => {
    await page.goto("/me");
    await expect(page.getByRole("heading", { name: /龙虾特工局/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "登录" })).toBeVisible();
  });

  test("/me?tab=login 显示登录表单", async ({ page }) => {
    await page.goto("/me?tab=login");
    await expect(page.locator('input[placeholder^="sk_"]')).toBeVisible();
  });
});
