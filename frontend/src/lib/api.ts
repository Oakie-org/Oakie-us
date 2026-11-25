/**
 * HTTP client for the Oakie API.
 *
 * The auth layer registers a token getter and a session-expired handler here,
 * so data hooks never need to know how the user signed in.
 */

const BASE =
  (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "") + "/api/v1";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, message: string, code = "error") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

type TokenGetter = () => Promise<string | null>;

let getToken: TokenGetter = async () => null;
let onSessionExpired: () => void = () => {};

export function configureApi(options: {
  getToken: TokenGetter;
  onSessionExpired: () => void;
}) {
  getToken = options.getToken;
  onSessionExpired = options.onSessionExpired;
}

type Query = Record<string, string | number | boolean | null | undefined>;

function buildUrl(path: string, query?: Query) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "")
      params.set(key, String(value));
  }
  const search = params.toString();
  return `${BASE}${path}${search ? `?${search}` : ""}`;
}

async function describeFailure(response: Response): Promise<ApiError> {
  let message = "Something went wrong. Please try again.";
  let code = "error";
  try {
    const body = await response.json();
    if (typeof body.detail === "string") message = body.detail;
    else if (Array.isArray(body.detail) && body.detail[0]?.msg) {
      const first = body.detail[0];
      const field = Array.isArray(first.loc)
        ? first.loc[first.loc.length - 1]
        : "";
      message = field ? `${field}: ${first.msg}` : first.msg;
    }
    if (typeof body.code === "string") code = body.code;
  } catch {
    // Non-JSON error body: keep the generic message.
  }
  return new ApiError(response.status, message, code);
}

async function request<T>(
  method: string,
  path: string,
  options: { query?: Query; body?: unknown } = {},
): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(
      0,
      "Can't reach Oakie right now. Check your connection and try again.",
      "network",
    );
  }

  if (!response.ok) {
    if (response.status === 401 && token) onSessionExpired();
    throw await describeFailure(response);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>("GET", path, { query }),
  post: <T>(path: string, body?: unknown) =>
    request<T>("POST", path, { body: body ?? {} }),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, { body }),
  patch: <T>(path: string, body: unknown) =>
    request<T>("PATCH", path, { body }),
  delete: <T>(path: string) => request<T>("DELETE", path),
};

export function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
