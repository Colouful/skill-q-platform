import { jsonOk } from "@/lib/api-response";
import { getUploadRequiresLogin } from "@/lib/system-config";

export const dynamic = "force-dynamic";

/** 前台公开配置（无需登录）：上传是否强制登录等 */
export async function GET() {
  const uploadRequiresLogin = await getUploadRequiresLogin();
  return jsonOk({ uploadRequiresLogin });
}
