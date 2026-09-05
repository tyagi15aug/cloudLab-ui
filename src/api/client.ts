import type { ErrorBody, ErrorResponsePayload } from "./types";

// In dev, Vite's proxy (vite.config.ts) forwards /api to the backend, so
// the empty default works with no env file. VITE_API_BASE_URL lets a built
// bundle point at a different host.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

/** A request that failed with a translated application error (see the
 * backend's app/core/errors.py) — never a raw fetch/network error. */
export class ApiError extends Error {
  code: ErrorBody["code"];
  requestId: string | null;
  retryable: boolean;
  status: number;

  constructor(body: ErrorBody, status: number) {
    super(body.message);
    this.name = "ApiError";
    this.code = body.code;
    this.requestId = body.requestId;
    this.retryable = body.retryable;
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { "content-type": "application/json", ...init?.headers },
    });
  } catch {
    // fetch itself threw: DNS/connection failure, not an HTTP error.
    throw new ApiError(
      {
        code: "PROVIDER_UNAVAILABLE",
        message: "Could not reach the API. Is it running?",
        requestId: null,
        retryable: true,
      },
      0,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const errorBody: ErrorBody = (payload as ErrorResponsePayload | null)?.error ?? {
      code: "INTERNAL_ERROR",
      message: `Request failed with status ${response.status}.`,
      requestId: null,
      retryable: false,
    };
    throw new ApiError(errorBody, response.status);
  }

  return payload as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  delete: (path: string) => request<void>(path, { method: "DELETE" }),
};
