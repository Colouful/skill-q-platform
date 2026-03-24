import { afterEach, describe, expect, it } from "vitest";
import { isBlockedAgentId, isBlockedIp } from "./hub-blocklist";

const savedIp = process.env.HUB_BLOCKLIST_IPS;
const savedAgent = process.env.HUB_BLOCKLIST_AGENT_IDS;

afterEach(() => {
  if (savedIp === undefined) delete process.env.HUB_BLOCKLIST_IPS;
  else process.env.HUB_BLOCKLIST_IPS = savedIp;
  if (savedAgent === undefined) delete process.env.HUB_BLOCKLIST_AGENT_IDS;
  else process.env.HUB_BLOCKLIST_AGENT_IDS = savedAgent;
});

describe("hub-blocklist", () => {
  it("isBlockedIp matches exact and string suffix", () => {
    process.env.HUB_BLOCKLIST_IPS = "10.0.0.1, .2.3";
    expect(isBlockedIp("10.0.0.1")).toBe(true);
    expect(isBlockedIp("192.168.2.3")).toBe(true);
    expect(isBlockedIp("8.8.8.8")).toBe(false);
    expect(isBlockedIp(null)).toBe(false);
    expect(isBlockedIp("unknown")).toBe(false);
  });

  it("isBlockedAgentId matches UUID list", () => {
    process.env.HUB_BLOCKLIST_AGENT_IDS = "a-1, b-2";
    expect(isBlockedAgentId("a-1")).toBe(true);
    expect(isBlockedAgentId("c-3")).toBe(false);
    expect(isBlockedAgentId(null)).toBe(false);
  });
});
