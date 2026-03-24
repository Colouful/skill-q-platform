import type { AuthAgent } from "@/lib/agent-auth";

/** 与 Prisma `downloadPolicy` 字段一致：public | login | author */
export const DOWNLOAD_POLICY = {
  PUBLIC: "public",
  LOGIN: "login",
  AUTHOR: "author",
} as const;

export type DownloadPolicyValue = (typeof DOWNLOAD_POLICY)[keyof typeof DOWNLOAD_POLICY];

export function normalizeDownloadPolicy(raw: string | null | undefined): DownloadPolicyValue {
  if (raw === DOWNLOAD_POLICY.LOGIN || raw === DOWNLOAD_POLICY.AUTHOR) {
    return raw;
  }
  return DOWNLOAD_POLICY.PUBLIC;
}

/**
 * 校验下载策略；`authorAgentId` 为空时「仅作者」策略始终拒绝非作者（含未绑定作者的旧资源）。
 */
export function assertDownloadAllowed(
  policyRaw: string | null | undefined,
  downloader: AuthAgent | null,
  authorAgentId: string | null,
):
  | { ok: true }
  | { ok: false; status: 401 | 403; message: string } {
  const policy = normalizeDownloadPolicy(policyRaw);
  if (policy === DOWNLOAD_POLICY.PUBLIC) {
    return { ok: true };
  }
  if (policy === DOWNLOAD_POLICY.LOGIN) {
    if (!downloader) {
      return { ok: false, status: 401, message: "需要登录后才能下载" };
    }
    return { ok: true };
  }
  if (policy === DOWNLOAD_POLICY.AUTHOR) {
    if (!downloader) {
      return { ok: false, status: 401, message: "该资源仅作者可下载，请先登录" };
    }
    if (!authorAgentId || downloader.id !== authorAgentId) {
      return { ok: false, status: 403, message: "仅作者可下载此资源" };
    }
    return { ok: true };
  }
  return { ok: true };
}
