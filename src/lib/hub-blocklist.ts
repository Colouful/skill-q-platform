/**
 * 黑名单（环境变量，逗号分隔）。用于封禁恶意 IP / Agent。
 * `HUB_BLOCKLIST_IPS`：IP 或后缀（如 `10.0.0.1`、`192.168.1`）
 * `HUB_BLOCKLIST_AGENT_IDS`：Agent UUID
 */

function parseList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isBlockedIp(ip: string | null | undefined): boolean {
  if (!ip || ip === "unknown") return false;
  const list = parseList(process.env.HUB_BLOCKLIST_IPS);
  return list.some((b) => ip === b || ip.endsWith(b));
}

export function isBlockedAgentId(agentId: string | null | undefined): boolean {
  if (!agentId) return false;
  const list = parseList(process.env.HUB_BLOCKLIST_AGENT_IDS);
  return list.includes(agentId);
}
