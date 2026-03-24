import { getAuthFromRequest } from "@/lib/agent-auth";
import { getUploadRequiresLogin } from "@/lib/system-config";

/** 创建 Skill/Rule、分叉、发版等写操作：若站点要求登录上传且未登录则拒绝 */
export async function enforceUploadLoginPolicy(req: Request): Promise<
  | { denied: true; message: string }
  | { denied: false; auth: Awaited<ReturnType<typeof getAuthFromRequest>> }
> {
  const auth = await getAuthFromRequest(req);
  if (await getUploadRequiresLogin() && !auth.agent) {
    return {
      denied: true,
      message: "请先登录后再上传（当前站点要求登录后创建或更新资源）",
    };
  }
  return { denied: false, auth };
}
