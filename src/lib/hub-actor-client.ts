/** 浏览器端站点身份，随请求发送 X-Hub-Actor（与 Rule/Skill 的 author 对齐） */
const STORAGE_KEY = "xqhub_actor";

/**
 * Header 值只能是 ISO-8859-1；昵称可能含中文，发往 fetch/XHR 前须编码。
 * 服务端见 `getHubActor`（`hub-auth.ts`）成对解码。
 */
export function encodeHubActorForRequestHeader(actor: string): string {
  return encodeURIComponent(actor.trim());
}

export function getHubActorFromStorage(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(STORAGE_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

export function setHubActorToStorage(value: string): void {
  if (typeof window === "undefined") return;
  try {
    const v = value.trim();
    if (v) localStorage.setItem(STORAGE_KEY, v);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** 合并到 fetch 请求头（不覆盖调用方已设置的同名头） */
export function mergeHubActorHeaders(headers: Headers): void {
  const actor = getHubActorFromStorage();
  if (actor && !headers.has("X-Hub-Actor")) {
    headers.set("X-Hub-Actor", encodeHubActorForRequestHeader(actor));
  }
}
