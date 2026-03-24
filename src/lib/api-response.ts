import { NextResponse } from "next/server";

export type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

export function apiSuccess<T>(data: T, message = "ok"): ApiResponse<T> {
  return { code: 0, message, data };
}

export function apiFail(message: string, code = 1): ApiResponse<null> {
  return { code, message, data: null };
}

export function jsonOk<T>(data: T, message?: string, init?: ResponseInit) {
  return NextResponse.json(apiSuccess(data, message), init);
}

export function jsonErr(message: string, httpStatus: number, code = 1, init?: ResponseInit) {
  return NextResponse.json(apiFail(message, code), { ...init, status: httpStatus });
}
