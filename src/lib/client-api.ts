import type { ApiResponse } from "@/lib/api-response";
import { mergeHubActorHeaders } from "@/lib/hub-actor-client";

export async function fetchApi<T>(input: RequestInfo | URL, init?: RequestInit): Promise<ApiResponse<T>> {
  const headers = new Headers(init?.headers);
  mergeHubActorHeaders(headers);
  if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(input, {
    ...init,
    headers,
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!res.ok && json.code === undefined) {
    return { code: res.status, message: res.statusText || "请求失败", data: null as T };
  }
  return json;
}

/** POST JSON 并报告上传进度（适用于大包体，如含大量 initialFiles） */
export function postJsonWithUploadProgress<T>(
  url: string,
  body: unknown,
  onProgress?: (percent: number) => void,
): Promise<ApiResponse<T>> {
  const payload = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    const headers = new Headers();
    mergeHubActorHeaders(headers);
    headers.forEach((v, k) => {
      xhr.setRequestHeader(k, v);
    });
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.min(100, Math.round((e.loaded / e.total) * 100)));
      }
    };
    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText) as ApiResponse<T>;
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(json);
        } else if (json.code !== undefined) {
          resolve(json);
        } else {
          resolve({
            code: xhr.status,
            message: xhr.statusText || "请求失败",
            data: null as T,
          });
        }
      } catch {
        reject(new Error("响应解析失败"));
      }
    };
    xhr.onerror = () => reject(new Error("网络错误"));
    xhr.send(payload);
  });
}
