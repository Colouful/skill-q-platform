import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    env: {
      // 纯函数单测不连库；Prisma Client 初始化需合法连接串
      DATABASE_URL:
        process.env.DATABASE_URL ?? "mysql://vitest:vitest@127.0.0.1:3306/vitest?charset=utf8mb3",
    },
    environment: "jsdom",
    globals: true,
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/e2e/**",
      "**/.{idea,git,cache,output,temp}/**",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
