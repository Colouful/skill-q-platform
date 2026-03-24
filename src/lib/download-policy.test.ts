import { describe, expect, it } from "vitest";
import { assertDownloadAllowed, DOWNLOAD_POLICY } from "@/lib/download-policy";

const agent = { id: "a1" } as import("@/lib/agent-auth").AuthAgent;

describe("assertDownloadAllowed", () => {
  it("allows public without login", () => {
    expect(assertDownloadAllowed(DOWNLOAD_POLICY.PUBLIC, null, null)).toEqual({ ok: true });
    expect(assertDownloadAllowed(DOWNLOAD_POLICY.PUBLIC, agent, null)).toEqual({ ok: true });
  });

  it("requires login for login policy", () => {
    const r = assertDownloadAllowed(DOWNLOAD_POLICY.LOGIN, null, "x");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.status).toBe(401);
    }
    expect(assertDownloadAllowed(DOWNLOAD_POLICY.LOGIN, agent, "x")).toEqual({ ok: true });
  });

  it("author policy: guest denied", () => {
    const r = assertDownloadAllowed(DOWNLOAD_POLICY.AUTHOR, null, agent.id);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(401);
  });

  it("author policy: non-author denied", () => {
    const r = assertDownloadAllowed(DOWNLOAD_POLICY.AUTHOR, agent, "other");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(403);
  });

  it("author policy: author allowed", () => {
    expect(assertDownloadAllowed(DOWNLOAD_POLICY.AUTHOR, agent, agent.id)).toEqual({ ok: true });
  });

  it("author policy without bound author: logged-in user denied", () => {
    const r = assertDownloadAllowed(DOWNLOAD_POLICY.AUTHOR, agent, null);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(403);
  });
});
