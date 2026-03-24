import { describe, expect, it } from "vitest";
import { canViewUnpublishedResource, MODERATION_STATUS } from "@/lib/moderation";

describe("canViewUnpublishedResource", () => {
  it("allows published to anyone", () => {
    expect(
      canViewUnpublishedResource(MODERATION_STATUS.PUBLISHED, null, null),
    ).toBe(true);
  });

  it("denies pending to guests", () => {
    expect(canViewUnpublishedResource(MODERATION_STATUS.PENDING, "a1", null)).toBe(false);
  });

  it("allows pending to author", () => {
    expect(canViewUnpublishedResource(MODERATION_STATUS.PENDING, "a1", "a1")).toBe(true);
  });
});
