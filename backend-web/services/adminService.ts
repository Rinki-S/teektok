/* ============================================
 * Admin API service (backend-web)
 * --------------------------------------------
 * This file implements client-side service functions that match the
 * OpenAPI document at: http://localhost:8080/v3/api-docs
 *
 * IMPORTANT (OpenAPI contract):
 * - Paths are prefixed with `/api`, e.g. POST /api/admin/login
 * - Some endpoints use query parameters instead of JSON body:
 *   - POST /api/admin/user/status?userId=...&status=...
 *   - POST /api/admin/video/hot?videoId=...&hot=...
 *
 * Base URL:
 * - NEXT_PUBLIC_API_BASE_URL should be the server root, e.g. http://localhost:8080
 * - This file sends absolute *path* starting with `/api/...`
 * ============================================ */

import { apiClient } from "@/services/apiClient";
import type {
  AdminLoginRequest,
  AdminLoginResponse,
  AdminUserStatusRequest,
  AdminUserStatusResponse,
  AdminVideoAuditRequest,
  AdminVideoAuditResponse,
  AdminVideoHotRequest,
  AdminVideoHotResponse,
  AdminVideoDeleteResponse,
} from "@/types/api";

export const ADMIN_ENDPOINTS = {
  login: "/api/admin/login",
  userStatus: "/api/admin/user/status",
  videoAudit: "/api/admin/video/audit",
  videoHot: "/api/admin/video/hot",
  videoDelete: (videoId: number) => `/api/admin/video/delete/${videoId}`,
} as const;

/**
 * Admin login
 * OpenAPI: POST /api/admin/login (JSON body)
 */
export async function adminLogin(
  payload: AdminLoginRequest,
): Promise<AdminLoginResponse> {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
  const url = `${baseUrl.replace(/\/+$/, "")}${ADMIN_ENDPOINTS.login}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();

  const json: AdminLoginResponse | null = text
    ? (JSON.parse(text) as unknown as AdminLoginResponse)
    : null;

  if (!res.ok) {
    const msg = json?.msg ?? res.statusText ?? "Request failed";
    throw new Error(msg);
  }

  return (
    json ?? ({ code: 200, msg: "success", data: {} } as AdminLoginResponse)
  );
}

/**
 * Admin login (data-only convenience)
 * Uses the shared `apiClient` and returns the `data` field.
 */
export async function adminLoginData(payload: AdminLoginRequest): Promise<{
  adminId?: number;
  token?: string;
}> {
  return apiClient.post(ADMIN_ENDPOINTS.login, payload);
}

/**
 * Freeze/unfreeze user
 * OpenAPI: POST /api/admin/user/status (query parameters)
 * - userId: int64
 * - status: int32
 */
export async function setUserStatus(
  payload: AdminUserStatusRequest,
): Promise<AdminUserStatusResponse> {
  const params = new URLSearchParams({
    userId: String(payload.userId),
    status: String(payload.status),
  });

  // OpenAPI specifies query params; no JSON body is required.
  await apiClient.post<unknown>(
    `${ADMIN_ENDPOINTS.userStatus}?${params.toString()}`,
  );

  return { code: 200, msg: "success" };
}

/**
 * Audit video (approve/reject)
 * OpenAPI: POST /api/admin/video/audit (JSON body)
 */
export async function auditVideo(
  payload: AdminVideoAuditRequest,
): Promise<AdminVideoAuditResponse> {
  await apiClient.post<unknown>(ADMIN_ENDPOINTS.videoAudit, payload);
  return { code: 200, msg: "success" };
}

/**
 * Set/Unset hot video
 * OpenAPI: POST /api/admin/video/hot (query parameters)
 * - videoId: int64
 * - hot: boolean
 *
 * Note: our UI types carry `isHot?: 0|1`. We map to boolean `hot`.
 */
export async function setVideoHot(
  payload: AdminVideoHotRequest,
): Promise<AdminVideoHotResponse> {
  const params = new URLSearchParams({
    videoId: String(payload.videoId),
    hot: String(payload.isHot ? payload.isHot === 1 : true),
  });

  await apiClient.post<unknown>(
    `${ADMIN_ENDPOINTS.videoHot}?${params.toString()}`,
  );

  return { code: 200, msg: "success" };
}

/**
 * Delete video (admin)
 * OpenAPI: DELETE /api/admin/video/delete/{videoId}
 */
export async function deleteVideo(
  videoId: number,
): Promise<AdminVideoDeleteResponse> {
  await apiClient.delete<unknown>(ADMIN_ENDPOINTS.videoDelete(videoId));
  return { code: 200, msg: "success" };
}
