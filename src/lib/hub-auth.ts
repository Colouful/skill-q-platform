import { ApiError } from "@/lib/api-errors";

/** 是否开启 Hub 身份校验（作者 / 管理员）。未设置或 off 时为关闭，便于现有环境兼容。 */
export function isHubAuthEnabled(): boolean {
  const v = process.env.HUB_AUTH?.trim().toLowerCase();
  return v === "on" || v === "1" || v === "true";
}

/** 请求中的操作者身份（与 Rule/Skill 的 author 字符串对齐） */
export function getHubActor(req: Request): string | null {
  const raw = req.headers.get("x-hub-actor")?.trim();
  return raw && raw.length > 0 ? raw : null;
}

/** 管理员：请求头 X-Hub-Admin-Secret 或 Authorization: Bearer <secret> 与 HUB_ADMIN_SECRET 一致 */
export function isHubAdmin(req: Request): boolean {
  const secret = process.env.HUB_ADMIN_SECRET?.trim();
  if (!secret) return false;
  const h = req.headers.get("x-hub-admin-secret")?.trim();
  const bearer = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  return h === secret || bearer === secret;
}

/** 资源作者或管理员可写（Skill / Rule 等） */
export function assertHubAuthForResourceAuthor(req: Request, resourceAuthor: string): void {
  if (!isHubAuthEnabled()) return;
  if (isHubAdmin(req)) return;
  const actor = getHubActor(req);
  if (!actor) {
    throw new ApiError("需要身份校验：请设置请求头 X-Hub-Actor 与资源作者一致，或由管理员操作", 401);
  }
  if (actor !== resourceAuthor.trim()) {
    throw new ApiError("无权操作（仅作者或管理员）", 403);
  }
}

/** 创建资源时：声明的 author 须与 X-Hub-Actor 一致（管理员除外） */
export function assertHubAuthForDeclaredAuthor(req: Request, declaredAuthor: string): void {
  if (!isHubAuthEnabled()) return;
  if (isHubAdmin(req)) return;
  const actor = getHubActor(req);
  if (!actor) {
    throw new ApiError("需要身份校验：请设置 X-Hub-Actor，且须与表单中的作者一致", 401);
  }
  if (actor !== declaredAuthor.trim()) {
    throw new ApiError("作者须与当前站点身份（X-Hub-Actor）一致", 403);
  }
}

/** 评测作者须与身份一致（管理员可改任意评测） */
export function assertHubAuthForReviewAuthor(req: Request, reviewAuthor: string): void {
  if (!isHubAuthEnabled()) return;
  if (isHubAdmin(req)) return;
  const actor = getHubActor(req);
  if (!actor) {
    throw new ApiError("需要身份校验：请设置 X-Hub-Actor", 401);
  }
  if (actor !== reviewAuthor.trim()) {
    throw new ApiError("无权操作此评测", 403);
  }
}
