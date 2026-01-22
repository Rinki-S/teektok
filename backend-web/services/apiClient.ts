/* ============================================
 * Minimal API client wrapper
 * - Base URL via NEXT_PUBLIC_API_BASE_URL (defaults to http://localhost:8080)
 * - Optional auth header injection (Bearer token)
 * - Consistent JSON parsing and API envelope typing
 * ============================================
 */

type JsonBody = object;
type RequestInitWithJson = Omit<RequestInit, "body"> & {
  body?: JsonBody | FormData | BodyInit | null;
};

export type ApiEnvelope<T> = {
  code: number;
  msg?: string;
  data?: T;
};

export type ApiErrorShape = {
  code?: number;
  msg?: string;
  status?: number;
  url?: string;
  details?: unknown;
};

export class ApiError extends Error {
  public readonly code?: number;
  public readonly status?: number;
  public readonly url?: string;
  public readonly details?: unknown;

  constructor(message: string, info: ApiErrorShape = {}) {
    super(message);
    this.name = "ApiError";
    this.code = info.code;
    this.status = info.status;
    this.url = info.url;
    this.details = info.details;
  }
}

export type TokenProvider =
  | (() => string | null | undefined)
  | (() => Promise<string | null | undefined>);

export type ApiClientOptions = {
  baseUrl?: string;
  tokenProvider?: TokenProvider;
  /**
   * If true, any envelope with code != 200 throws.
   * Keep true by default to match docs:
   * { code: 200, msg: "success", data: {} }
   */
  strictEnvelope?: boolean;
};

function joinUrl(baseUrl: string, path: string) {
  const b = baseUrl.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

function isFormData(body: unknown): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

function isJsonBody(body: unknown): body is JsonBody {
  if (!body || typeof body !== "object") return false;
  // Exclude known BodyInit-like objects
  if (typeof FormData !== "undefined" && body instanceof FormData) return false;
  if (typeof Blob !== "undefined" && body instanceof Blob) return false;
  if (typeof ArrayBuffer !== "undefined" && body instanceof ArrayBuffer)
    return false;
  if (typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams)
    return false;
  if (typeof ReadableStream !== "undefined" && body instanceof ReadableStream)
    return false;
  return true;
}

async function readToken(
  tokenProvider?: TokenProvider,
): Promise<string | null> {
  if (!tokenProvider) return null;

  const maybePromise = tokenProvider();

  // Narrow via Promise check without using `any`.
  if (maybePromise instanceof Promise) {
    const token = await maybePromise;
    return token ?? null;
  }

  return maybePromise ?? null;
}

async function safeParseJson(res: Response): Promise<unknown | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly tokenProvider?: TokenProvider;
  private readonly strictEnvelope: boolean;

  constructor(options: ApiClientOptions = {}) {
    const envBase =
      typeof process !== "undefined"
        ? process.env.NEXT_PUBLIC_API_BASE_URL
        : undefined;

    // OpenAPI paths already include the `/api` prefix (e.g. `/api/admin/login`),
    // so the base URL should NOT include `/api` to avoid double-prefixing.
    this.baseUrl = options.baseUrl ?? envBase ?? "http://localhost:8080";
    this.tokenProvider = options.tokenProvider;
    this.strictEnvelope = options.strictEnvelope ?? true;
  }

  public async get<T>(path: string, init: RequestInit = {}): Promise<T> {
    return this.request<T>(path, { ...init, method: "GET" });
  }

  public async post<T>(
    path: string,
    body?: JsonBody | FormData | BodyInit | null,
    init: RequestInit = {},
  ): Promise<T> {
    return this.request<T>(path, { ...init, method: "POST", body });
  }

  public async put<T>(
    path: string,
    body?: JsonBody | FormData | BodyInit | null,
    init: RequestInit = {},
  ): Promise<T> {
    return this.request<T>(path, { ...init, method: "PUT", body });
  }

  public async patch<T>(
    path: string,
    body?: JsonBody | FormData | BodyInit | null,
    init: RequestInit = {},
  ): Promise<T> {
    return this.request<T>(path, { ...init, method: "PATCH", body });
  }

  public async delete<T>(path: string, init: RequestInit = {}): Promise<T> {
    return this.request<T>(path, { ...init, method: "DELETE" });
  }

  /**
   * Unified request:
   * - Adds Authorization header if token exists
   * - Sends JSON by default (unless body is FormData)
   * - Parses API envelope and returns `data`
   */
  public async request<T>(
    path: string,
    init: RequestInitWithJson = {},
  ): Promise<T> {
    const url = joinUrl(this.baseUrl, path);

    const headers = new Headers(init.headers ?? {});
    const token = await readToken(this.tokenProvider);
    if (token) {
      const purePath = path.split("?")[0] ?? path;
      const isAdminApi = purePath === "/api/admin" || purePath.startsWith("/api/admin/");
      if (isAdminApi) {
        if (!headers.has("token")) headers.set("token", token);
        if (!headers.has("Authorization"))
          headers.set("Authorization", `Bearer ${token}`);
      }
    }

    let body: BodyInit | undefined = undefined;

    // Handle body + content-type.
    if (init.body !== undefined) {
      if (isFormData(init.body)) {
        body = init.body;
        // Let the browser set multipart boundary automatically.
      } else if (
        typeof init.body === "string" ||
        init.body instanceof Blob ||
        init.body instanceof ArrayBuffer ||
        init.body instanceof URLSearchParams
      ) {
        body = init.body as BodyInit;
      } else if (isJsonBody(init.body)) {
        headers.set(
          "Content-Type",
          headers.get("Content-Type") ?? "application/json",
        );
        body = JSON.stringify(init.body);
      } else {
        // Fallback: attempt to pass through as BodyInit
        body = init.body as unknown as BodyInit;
      }
    }

    const res = await fetch(url, {
      ...init,
      headers,
      body,
    });

    const parsed = await safeParseJson(res);

    if (!res.ok) {
      // If backend also returns envelope on failures, surface it in details.
      const msg =
        (parsed &&
          typeof parsed === "object" &&
          parsed !== null &&
          "msg" in parsed &&
          typeof (parsed as Record<string, unknown>).msg === "string" &&
          (parsed as Record<string, unknown>).msg) ||
        res.statusText ||
        "Request failed";
      throw new ApiError(String(msg), {
        status: res.status,
        url,
        details: parsed,
      });
    }

    // Try to interpret as ApiEnvelope<T>
    if (parsed && typeof parsed === "object" && "code" in parsed) {
      const env = parsed as ApiEnvelope<T>;
      if (this.strictEnvelope && env.code !== 200) {
        throw new ApiError(env.msg ?? "API error", {
          code: env.code,
          status: res.status,
          url,
          details: parsed,
        });
      }

      // Some endpoints may return no data on success; default to undefined.
      return (env.data as T) ?? (undefined as T);
    }

    // Non-envelope JSON response (fallback)
    return parsed as T;
  }
}

/**
 * Default singleton client using env base URL.
 * Token is read from localStorage ("admin_token") when in browser.
 */
export const apiClient = new ApiClient({
  tokenProvider: () => {
    if (typeof window === "undefined") return null;
    try {
      // Align with `lib/auth.ts` (STORAGE_KEYS.adminToken)
      return window.localStorage.getItem("teektok.admin.token");
    } catch {
      return null;
    }
  },
});
