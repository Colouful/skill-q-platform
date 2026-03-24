import { jsonErr } from "@/lib/api-response";

/** 业务/API 可预期的错误，映射为统一 JSON 响应 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly httpStatus = 400,
    public readonly code = 1,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** 将路由内异常转为 NextResponse.json（配合 try/catch） */
export function toApiResponse(e: unknown) {
  if (e instanceof ApiError) {
    return jsonErr(e.message, e.httpStatus, e.code);
  }
  console.error(e);
  return jsonErr("服务器错误", 500);
}
