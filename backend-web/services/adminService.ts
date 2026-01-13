/* ============================================
 * Admin API service (backend-web)
 * --------------------------------------------
 * This file implements client-side service functions that match the
 * documented admin endpoints in `docs/md/接口文档.md`.
 *
 * Base URL: NEXT_PUBLIC_API_BASE_URL (default http://localhost:8080/api)
 * Envelope: { code: number, msg: string, data?: any } with code === 200 success
 *
 * NOTE:
 * - Backend is not implemented yet; keep these functions aligned with docs.
 * - Some admin endpoints have ambiguous request/response details in the docs;
 *   types are tolerant (optional fields or optional body).
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
  login: "/admin/login",
  userStatus: "/admin/user/status",
  videoAudit: "/admin/video/audit",
  videoHot: "/admin/video/hot",
  videoDelete: (videoId: number) => `/admin/video/delete/${videoId}`,
} as const;

/**
 * Admin login
 * POST /admin/login
 *
 * Docs don't show request/response explicitly, but following user/login format:
 * Request: { username, password }
 * Response: ApiResponse<{ adminId?: number; token?: string }>
 */
export async function adminLogin(
  payload: AdminLoginRequest,
): Promise<AdminLoginResponse> {
  // return full envelope by asking apiClient for unknown and assuming envelope
  // However, our apiClient returns `data` by default (strictEnvelope=true).
  // So we call request with the raw fetch? Not available here.
  //
  // Instead: use apiClient.request with strict envelope returning `data`,
  // then reconstruct envelope shape. But we don't have `code/msg`.
  //
  // Pragmatic approach for this project:
  // - For most UI flows we only need `data` (token/adminId).
  // - Provide a companion `adminLoginData` returning `data` only.
  //
  // Still, keep a function with the requested return type by doing a direct fetch.
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api";
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
 * POST /admin/user/status
 * Body: { userId: number, status: 0|1 }  (0 frozen, 1 normal)
 */
export async function setUserStatus(
  payload: AdminUserStatusRequest,
): Promise<AdminUserStatusResponse> {
  // data-less endpoint: apiClient returns `undefined` on success
  await apiClient.post<unknown>(ADMIN_ENDPOINTS.userStatus, payload);
  return { code: 200, msg: "success" };
}

/**
 * Audit video (approve/reject)
 * POST /admin/video/audit
 * Body: { videoId: number, status: 1|0 } (1 pass, 0 reject)
 */
export async function auditVideo(
  payload: AdminVideoAuditRequest,
): Promise<AdminVideoAuditResponse> {
  await apiClient.post<unknown>(ADMIN_ENDPOINTS.videoAudit, payload);
  return { code: 200, msg: "success" };
}

/**
 * Set hot video flag
 * POST /admin/video/hot
 * Docs do not specify request body; we accept a flexible payload:
 * - { videoId, isHot?: 0|1 }
 */
export async function setVideoHot(
  payload: AdminVideoHotRequest,
): Promise<AdminVideoHotResponse> {
  await apiClient.post<unknown>(ADMIN_ENDPOINTS.videoHot, payload);
  return { code: 200, msg: "success" };
}

/**
 * Delete video (admin)
 * DELETE /admin/video/delete/{videoId}
 */
export async function deleteVideo(
  videoId: number,
): Promise<AdminVideoDeleteResponse> {
  await apiClient.delete<unknown>(ADMIN_ENDPOINTS.videoDelete(videoId));
  return { code: 200, msg: "success" };
}
