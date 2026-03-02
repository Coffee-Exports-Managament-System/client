import type { ApiErrorPayload } from "@/lib/auth/types";

export class ApiClientError extends Error {
  status: number;
  requestId?: string;
  detail?: string;
  issues?: ApiErrorPayload["issues"];

  constructor(
    message: string,
    status: number,
    options?: { requestId?: string; detail?: string; issues?: ApiErrorPayload["issues"] }
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.requestId = options?.requestId;
    this.detail = options?.detail;
    this.issues = options?.issues;
  }
}

export async function parseApiError(response: Response): Promise<ApiClientError> {
  let payload: ApiErrorPayload | null = null;
  let textBody = "";
  try {
    payload = (await response.json()) as ApiErrorPayload;
  } catch {
    payload = null;
    try {
      textBody = (await response.text()).trim();
    } catch {
      textBody = "";
    }
  }

  const inferredMessage =
    payload?.message ??
    (textBody.length > 0
      ? textBody.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
      : "Request failed");

  return new ApiClientError(inferredMessage, response.status, {
    requestId: payload?.request_id ?? undefined,
    detail: payload?.detail ?? undefined,
    issues: payload?.issues
  });
}
