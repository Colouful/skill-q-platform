import { describe, expect, it } from "vitest";
import {
  getHubProfileIds,
  normalizeSupportedProfilesList,
  readStoredSupportedProfiles,
} from "@/lib/profile-options";

describe("profile-options", () => {
  it("暴露当前支持的 profile 列表", () => {
    expect(getHubProfileIds()).toEqual(["react", "vue"]);
  });

  it("规范化输入时去重并过滤未知 profile", () => {
    const normalized = normalizeSupportedProfilesList([
      " react ",
      "vue",
      "react",
      "nest",
    ]);

    expect(normalized.profiles).toEqual(["react", "vue"]);
    expect(normalized.invalid).toEqual(["nest"]);
  });

  it("已存储的空数组表示显式 common", () => {
    const stored = readStoredSupportedProfiles([]);

    expect(stored.explicit).toBe(true);
    expect(stored.profiles).toEqual([]);
    expect(stored.invalid).toEqual([]);
  });

  it("null 视为未显式配置，供导出器走兼容推断", () => {
    const stored = readStoredSupportedProfiles(null);

    expect(stored.explicit).toBe(false);
    expect(stored.profiles).toEqual([]);
    expect(stored.invalid).toEqual([]);
  });
});
