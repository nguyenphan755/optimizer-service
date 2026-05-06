import { clearMesSession } from "@/app/lib/auth-storage";

/**
 * Base URL tính **mỗi lần gọi** — phù hợp mở UI qua Tailscale/LAN (`http://100.x.x.x:5100`).
 * - Để trống `VITE_API_BASE_URL` → `''` → đường dẫn tương đối `/api…` qua proxy Vite (khuyến nghị dev).
 * - Nếu set `VITE_API_BASE_URL=http://localhost:…` nhưng trang đang mở từ hostname khác → dùng
 *   `hostname hiện tại + VITE_API_PORT` (tránh fetch nhầm localhost trên máy người dùng).
 */
export function resolveApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;
  const apiPort = (import.meta.env.VITE_API_PORT as string | undefined) || "3002";

  if (typeof window === "undefined") {
    return typeof raw === "string" && raw.trim() !== "" ? raw.trim() : "";
  }

  const hostname = window.location.hostname;
  const isPageLocal = hostname === "localhost" || hostname === "127.0.0.1";

  if (typeof raw === "string" && raw.trim() !== "") {
    const trimmed = raw.trim();
    const envLooksLocal = /localhost|127\.0\.0\.1/i.test(trimmed);
    if (envLooksLocal && !isPageLocal) {
      const base = `${window.location.protocol}//${hostname}:${apiPort}`;
      if (import.meta.env.DEV) {
        console.warn(
          "[api] VITE_API_BASE_URL trỏ localhost nhưng đang mở từ host khác — dùng:",
          base
        );
      }
      return base;
    }
    return trimmed;
  }

  return "";
}

/** Giá trị tĩnh từ env (không thay hostname). Chỉ dùng khi chắc chắn không qua Tailscale. */
export const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const NETWORK_HINT =
  "Không kết nối được API backend (cổng trùng VITE_API_PORT, API lắng nghe 0.0.0.0 nếu truy cập qua Tailscale). " +
  "Chạy: npm run dev:api hoặc npm run dev:all. Postgres: integrated/Capacity-Lookup-System-main/.env.";

function isNetworkFailure(e: unknown): boolean {
  return e instanceof TypeError && /fetch|Failed to fetch|NetworkError|Load failed/i.test(String(e.message));
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "object" && payload && payload !== null) {
    const o = payload as Record<string, unknown>;
    if (typeof o.error === "string") return o.error;
    if (typeof o.message === "string") return o.message;
  }
  return fallback;
}

/** Làm mới access token — server Set-Cookie `mes_access` (httpOnly). */
export async function tryRefreshAccessToken(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const base = resolveApiBaseUrl();
  const url = `${base}/api/v1/auth/refresh`;
  try {
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function fetchApiJson(
  path: string,
  init: RequestInit | undefined,
  retriedAfterRefresh: boolean
): Promise<{ res: Response; payload: unknown }> {
  const base = resolveApiBaseUrl();
  const url = path.startsWith("http") ? path : `${base}${path}`;
  const res = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init?.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...init?.headers,
    },
  });
  const ct = res.headers.get("content-type") || "";
  const payload = ct.includes("application/json") ? await res.json() : await res.text();

  if (
    res.status === 401 &&
    typeof window !== "undefined" &&
    !path.includes("/auth/login") &&
    !path.includes("/auth/refresh") &&
    !retriedAfterRefresh
  ) {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      return fetchApiJson(path, init, true);
    }
  }

  if (res.status === 401 && typeof window !== "undefined" && !path.includes("/auth/login")) {
    clearMesSession();
    window.dispatchEvent(new Event("mes-auth-expired"));
  }

  return { res, payload };
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  let payload: unknown;
  try {
    const out = await fetchApiJson(path, init, false);
    res = out.res;
    payload = out.payload;
  } catch (e) {
    if (isNetworkFailure(e)) {
      throw new ApiError(NETWORK_HINT, 0, "NETWORK_ERROR");
    }
    throw e;
  }

  if (!res.ok) {
    const msg = extractErrorMessage(payload, res.statusText);
    const code =
      typeof payload === "object" && payload && payload !== null && "code" in payload
        ? String((payload as { code?: string }).code)
        : undefined;
    throw new ApiError(msg, res.status, code);
  }
  return payload as T;
}

export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  const base = resolveApiBaseUrl();
  const url = path.startsWith("http") ? path : `${base}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      body: form,
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });
  } catch (e) {
    if (isNetworkFailure(e)) {
      throw new ApiError(NETWORK_HINT, 0, "NETWORK_ERROR");
    }
    throw e;
  }
  const payload = await res.json().catch(() => ({}));

  if (res.status === 401 && typeof window !== "undefined" && !path.includes("/auth/login")) {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      return apiUpload<T>(path, form);
    }
    clearMesSession();
    window.dispatchEvent(new Event("mes-auth-expired"));
  }

  if (!res.ok) {
    const msg = extractErrorMessage(payload, res.statusText);
    const code =
      typeof payload === "object" && payload && "code" in payload
        ? String((payload as { code?: string }).code)
        : undefined;
    throw new ApiError(msg, res.status, code);
  }
  return payload as T;
}
