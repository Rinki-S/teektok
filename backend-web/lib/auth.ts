"use client";

/**
 * Admin auth storage helpers for token persistence.
 *
 * Notes:
 * - This project’s backend API returns `{ token }` on login (see docs).
 * - We persist the token in `localStorage` for simplicity (admin panel SPA-like UX).
 * - If you later switch to HttpOnly cookies, you can keep the same exported API
 *   but change the implementation here.
 */

const STORAGE_KEYS = {
  adminToken: "teektok.admin.token",
  adminUserId: "teektok.admin.userId",
} as const;

export type AdminAuthState = {
  token: string;
  userId?: number;
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getAdminToken(): string | null {
  if (!isBrowser()) return null;
  const token = window.localStorage.getItem(STORAGE_KEYS.adminToken);
  return token && token.trim().length > 0 ? token : null;
}

export function setAdminAuth(state: AdminAuthState): void {
  if (!isBrowser()) return;

  window.localStorage.setItem(STORAGE_KEYS.adminToken, state.token);

  if (typeof state.userId === "number" && Number.isFinite(state.userId)) {
    window.localStorage.setItem(STORAGE_KEYS.adminUserId, String(state.userId));
  } else {
    window.localStorage.removeItem(STORAGE_KEYS.adminUserId);
  }
}

export function clearAdminAuth(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEYS.adminToken);
  window.localStorage.removeItem(STORAGE_KEYS.adminUserId);
}

export function isAdminAuthed(): boolean {
  return !!getAdminToken();
}

export function getAdminUserId(): number | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(STORAGE_KEYS.adminUserId);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * Adds the admin Authorization header to an existing headers object.
 * Uses Bearer token format by default.
 */
export function withAdminAuthHeaders(
  headers: HeadersInit = {},
  opts?: { scheme?: "Bearer" | string },
): HeadersInit {
  const token = getAdminToken();
  if (!token) return headers;

  const scheme = opts?.scheme ?? "Bearer";

  // Preserve existing header values; handle various HeaderInit shapes.
  if (headers instanceof Headers) {
    const h = new Headers(headers);
    h.set("Authorization", `${scheme} ${token}`);
    return h;
  }

  if (Array.isArray(headers)) {
    const h = new Headers(headers);
    h.set("Authorization", `${scheme} ${token}`);
    return Array.from(h.entries());
  }

  return {
    ...headers,
    Authorization: `${scheme} ${token}`,
  };
}
