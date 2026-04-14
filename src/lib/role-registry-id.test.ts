import { describe, expect, it } from "vitest";
import { toRoleProtocolId } from "@/lib/role-registry-id";

describe("role registry id helper", () => {
  it("prefers explicit manifestId over registryId and slug", () => {
    expect(
      toRoleProtocolId({
        slug: "task-orchestrator",
        registryId: "task-orchestrator",
        manifestId: "opsx-task-orchestrator",
      }),
    ).toBe("opsx-task-orchestrator");
  });

  it("falls back to registryId, then slug", () => {
    expect(
      toRoleProtocolId({
        slug: "frontend-implementer",
        registryId: "frontend-implementer",
      }),
    ).toBe("frontend-implementer");

    expect(
      toRoleProtocolId({
        slug: "code-guardian",
      }),
    ).toBe("code-guardian");
  });
});
