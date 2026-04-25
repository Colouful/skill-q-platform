export class HubError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly suggestion: string,
    public readonly httpStatus = 400,
  ) {
    super(message);
    this.name = "HubError";
  }
}

export function toHubError(error: unknown): HubError {
  if (error instanceof HubError) return error;
  return new HubError("INTERNAL_ERROR", "服务器错误，请稍后重试", "请稍后重试或联系管理员。", 500);
}
