import { NextResponse } from "next/server";

export type HubApiCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "ASSET_NOT_FOUND"
  | "MANIFEST_NOT_FOUND"
  | "VERSION_CONFLICT"
  | "INVALID_MANIFEST"
  | "ASSET_DEPRECATED"
  | "INSTALL_REPORT_FAILED"
  | "RUNTIME_REPORT_FAILED"
  | "INTERNAL_ERROR";

export type HubApiResponse<T> = {
  success: boolean;
  code: 0 | HubApiCode;
  message: string;
  data: T | null;
  requestId: string;
  contractVersion: "1.0.0";
};

export class HubApiError extends Error {
  constructor(
    public readonly code: HubApiCode,
    message: string,
    public readonly httpStatus = 400,
  ) {
    super(message);
    this.name = "HubApiError";
  }
}

function requestIdFrom(init?: Request | string) {
  if (init instanceof Request) {
    return init.headers.get("x-request-id") || crypto.randomUUID();
  }
  return init || crypto.randomUUID();
}

export function hubOk<T>(data: T, message = "操作成功", req?: Request | string) {
  return NextResponse.json<HubApiResponse<T>>({
    success: true,
    code: 0,
    message,
    data,
    requestId: requestIdFrom(req),
    contractVersion: "1.0.0",
  });
}

export function hubErr(
  code: HubApiCode,
  message: string,
  httpStatus = 400,
  req?: Request | string,
) {
  return NextResponse.json<HubApiResponse<never>>(
    {
      success: false,
      code,
      message,
      data: null,
      requestId: requestIdFrom(req),
      contractVersion: "1.0.0",
    },
    { status: httpStatus },
  );
}

export function toHubResponse(error: unknown, req?: Request) {
  if (error instanceof HubApiError) {
    return hubErr(error.code, error.message, error.httpStatus, req);
  }
  console.error(error);
  return hubErr("INTERNAL_ERROR", "服务器错误，请稍后重试", 500, req);
}
