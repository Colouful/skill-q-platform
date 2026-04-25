import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { HubError, toHubError } from "@/server/hub/errors";

export type HubApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: null | {
    code: string;
    message: string;
    suggestion: string;
  };
  requestId: string;
  timestamp: string;
};

export function hubSuccess<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(
    {
      success: true,
      data,
      error: null,
      requestId: randomUUID(),
      timestamp: new Date().toISOString(),
    } satisfies HubApiResponse<T>,
    init,
  );
}

export function hubFailure(error: HubError, init?: ResponseInit) {
  return NextResponse.json(
    {
      success: false,
      data: null,
      error: {
        code: error.code,
        message: error.message,
        suggestion: error.suggestion,
      },
      requestId: randomUUID(),
      timestamp: new Date().toISOString(),
    } satisfies HubApiResponse<null>,
    {
      ...init,
      status: init?.status ?? error.httpStatus,
    },
  );
}

export function hubException(error: unknown) {
  return hubFailure(toHubError(error));
}
