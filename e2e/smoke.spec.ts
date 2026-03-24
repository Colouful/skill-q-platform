import { test, expect } from "@playwright/test";

/** 17.6 多视口冒烟；需 dev 服务：PLAYWRIGHT_BASE_URL 或 npx playwright test --pass-with-no-tests */
test.describe("虾球Hub 冒烟", () => {
  test("首页可打开", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });

  test("Skills 列表可打开", async ({ page }) => {
    await page.goto("/skills");
    await expect(page.getByRole("heading", { name: "Skills" })).toBeVisible();
  });
});
