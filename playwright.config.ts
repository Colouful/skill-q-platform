import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  /* 17.6：多视口；18.7：Chromium / Firefox / WebKit */
  projects: [
    { name: "chromium-w375", use: { ...devices["Desktop Chrome"], viewport: { width: 375, height: 800 } } },
    { name: "chromium-w768", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 900 } } },
    { name: "chromium-w1024", use: { ...devices["Desktop Chrome"], viewport: { width: 1024, height: 900 } } },
    { name: "chromium-w1440", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "firefox-w1024", use: { ...devices["Desktop Firefox"], viewport: { width: 1024, height: 900 } } },
    { name: "webkit-w1024", use: { ...devices["Desktop Safari"], viewport: { width: 1024, height: 900 } } },
  ],
});
