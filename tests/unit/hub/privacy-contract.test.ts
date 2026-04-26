import { describe, expect, it } from "vitest";
import { createHubRepository } from "@/server/hub/repository";
import { InstallRecordService, RuntimeFeedbackService } from "@/server/hub/telemetry-service";

describe("Hub 隐私契约", () => {
  it("Install Record 应拒绝 sourceCode", () => {
    const service = new InstallRecordService(createHubRepository());

    expect(() =>
      service.record({
        projectId: "project-1",
        manifest: { slug: "frontend-vue-vite-standard", version: "1.0.0" },
        sourceCode: "secret",
      }),
    ).toThrow("请求中不允许包含 sourceCode");
  });

  it("Runtime Feedback 应拒绝 rawPrompt", () => {
    const service = new RuntimeFeedbackService(createHubRepository());

    expect(() =>
      service.record({
        projectId: "project-1",
        runId: "run-1",
        manifest: { slug: "frontend-vue-vite-standard", version: "1.0.0" },
        result: { status: "failed", success: false, durationMs: 1 },
        rawPrompt: "prompt",
      }),
    ).toThrow("请求中不允许包含 rawPrompt");
  });

  it("Runtime Feedback 应拒绝 rawResponse", () => {
    const service = new RuntimeFeedbackService(createHubRepository());

    expect(() =>
      service.record({
        projectId: "project-1",
        runId: "run-1",
        manifest: { slug: "frontend-vue-vite-standard", version: "1.0.0" },
        result: { status: "failed", success: false, durationMs: 1 },
        rawResponse: "response",
      }),
    ).toThrow("请求中不允许包含 rawResponse");
  });

  it("Runtime Feedback 应拒绝绝对路径", () => {
    const service = new RuntimeFeedbackService(createHubRepository());

    expect(() =>
      service.record({
        projectId: "project-1",
        runId: "run-1",
        manifest: { slug: "frontend-vue-vite-standard", version: "1.0.0" },
        result: { status: "failed", success: false, durationMs: 1 },
        issues: [{ file: "/Users/lizhenwei/workspace/private.ts" }],
      }),
    ).toThrow("请求中包含绝对路径");
  });

  it("Runtime Feedback 应拒绝 sourceCode", () => {
    const service = new RuntimeFeedbackService(createHubRepository());

    expect(() =>
      service.record({
        projectId: "project-1",
        runId: "run-1",
        manifest: { slug: "frontend-vue-vite-standard", version: "1.0.0" },
        result: { status: "failed", success: false, durationMs: 1 },
        sourceCode: "const token = 'secret'",
      }),
    ).toThrow("请求中不允许包含 sourceCode");
  });

  it("合法 Runtime Feedback 应标记 privacyChecked", () => {
    const service = new RuntimeFeedbackService(createHubRepository());

    const record = service.record({
      projectId: "project-1",
      runId: "run-1",
      manifest: { slug: "frontend-vue-vite-standard", version: "1.0.0" },
      assetsUsed: [{ slug: "planner-role", version: "1.0.0" }],
      executor: "codex",
      result: { status: "succeeded", success: true, durationMs: 12 },
      issues: [],
    });

    expect(record.privacyChecked).toBe(true);
    expect(record.assetSlugs).toEqual(["planner-role"]);
  });
});
