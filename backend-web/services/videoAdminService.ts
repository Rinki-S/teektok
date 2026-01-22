/**
 * Admin pages data service functions for videos and analysis.
 *
 * IMPORTANT:
 * - Backend APIs are not implemented yet; this file strictly follows `backend-web/docs/md/接口文档.md`.
 * - Base path (docs): http://localhost:8080/api
 * - Common envelope:
 *   { "code": 200, "msg": "success", "data": {} }
 *
 * Admin endpoints used here:
 * - POST   /api/admin/video/audit         (approve/reject)
 * - POST   /api/admin/video/hot           (set hot flag)  [query params: videoId, hot]
 * - DELETE /api/admin/video/delete/{id}   (delete video)
 * - GET    /api/api/video/list            (list videos; pagination) [query: videoQueryDTO.*]
 * - GET    /api/analysis/video            (video behavior stats)
 */

import { apiClient } from "@/services/apiClient";
import type {
  AdminVideoAuditRequest,
  AdminVideoHotRequest,
  AdminVideoDeleteParams,
  PageResult,
  AdminVideoVO,
  VideoAnalysisData,
} from "@/types/api";

export type VideoListQuery = {
  page: number;
  size: number;
  status?: number;
  isHot?: number;
};

/**
 * GET /api/admin/video/list
 */
export async function getVideoList(
  query: VideoListQuery,
): Promise<PageResult<AdminVideoVO>> {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.size),
  });

  if (typeof query.status === "number") params.set("status", String(query.status));
  if (typeof query.isHot === "number") params.set("isHot", String(query.isHot));

  return apiClient.get<PageResult<AdminVideoVO>>(
    `/api/admin/video/list?${params.toString()}`,
  );
}

/**
 * GET /api/admin/video/{id}
 */
export async function getVideoDetail(videoId: number): Promise<AdminVideoVO> {
  return apiClient.get<AdminVideoVO>(`/api/admin/video/${videoId}`);
}

/**
 * POST /api/admin/video/audit
 * Body (OpenAPI): VideoAuditDTO
 */
export async function auditVideo(input: AdminVideoAuditRequest): Promise<void> {
  await apiClient.post<void>("/api/admin/video/audit", input);
}

/**
 * POST /api/admin/video/hot
 *
 * OpenAPI defines query params:
 * - videoId: int64
 * - hot: boolean
 *
 * Note: `AdminVideoHotRequest` currently uses `isHot?: 0 | 1`.
 * We map `isHot` -> boolean `hot` (1 => true, 0 => false).
 */
export async function setVideoHot(input: AdminVideoHotRequest): Promise<void> {
  const params = new URLSearchParams({
    videoId: String(input.videoId),
    hot: String(input.isHot ? input.isHot === 1 : true),
  });

  await apiClient.post<void>(`/api/admin/video/hot?${params.toString()}`);
}

/**
 * DELETE /api/admin/video/delete/{videoId}
 */
export async function deleteVideo(
  params: AdminVideoDeleteParams,
): Promise<void> {
  await apiClient.delete<void>(`/api/admin/video/delete/${params.videoId}`);
}

/**
 * GET /api/analysis/video
 *
 * OpenAPI:
 * { code: 200, data: { playCount, likeCount, commentCount } }
 */
export async function getVideoAnalysis(): Promise<VideoAnalysisData> {
  return apiClient.get<VideoAnalysisData>("/api/analysis/video");
}

/**
 * Convenience helpers for typical admin moderation flows.
 */

export async function approveVideo(videoId: number): Promise<void> {
  await auditVideo({ videoId, status: 1 });
}

export async function rejectVideo(videoId: number): Promise<void> {
  await auditVideo({ videoId, status: 0 });
}

/**
 * Toggle hot with explicit flag.
 * Note: `isHot` type is `0 | 1` in `types/api.ts`.
 */
export async function markVideoHot(
  videoId: number,
  isHot: 0 | 1,
): Promise<void> {
  await setVideoHot({ videoId, isHot });
}
