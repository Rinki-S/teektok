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
 * - POST   /admin/video/audit         (approve/reject)
 * - POST   /admin/video/hot           (set hot flag)
 * - DELETE /admin/video/delete/{id}   (delete video)
 * - GET    /video/list               (list videos; pagination)
 * - GET    /analysis/video            (video behavior stats)
 */

import { apiClient } from "@/services/apiClient";
import type {
  AdminVideoAuditRequest,
  AdminVideoHotRequest,
  AdminVideoDeleteParams,
  VideoListItem,
  VideoAnalysisData,
} from "@/types/api";

export type VideoListQuery = {
  page: number;
  size: number;
};

/**
 * GET /video/list?page={page}&size={size}
 *
 * Docs example returns:
 * { code: 200, data: [ { videoId, title, playCount } ] }
 */
export async function getVideoList(query: VideoListQuery): Promise<VideoListItem[]> {
  const params = new URLSearchParams({
    page: String(query.page),
    size: String(query.size),
  });

  // apiClient returns the `data` portion of the envelope.
  // If backend eventually returns pagination metadata, you can adapt this type.
  return apiClient.get<VideoListItem[]>(`/video/list?${params.toString()}`);
}

/**
 * POST /admin/video/audit
 * Body: { videoId: number, status: 1 | 0 }
 * status: 1 pass, 0 reject
 */
export async function auditVideo(input: AdminVideoAuditRequest): Promise<void> {
  await apiClient.post<void>("/admin/video/audit", input);
}

/**
 * POST /admin/video/hot
 *
 * Docs do not specify request body.
 * We send { videoId, isHot? } (see `types/api.ts`).
 * If backend expects only { videoId }, it should ignore unknown fields or you can
 * switch to `{ videoId }` from the caller.
 */
export async function setVideoHot(input: AdminVideoHotRequest): Promise<void> {
  await apiClient.post<void>("/admin/video/hot", input);
}

/**
 * DELETE /admin/video/delete/{videoId}
 */
export async function deleteVideo(params: AdminVideoDeleteParams): Promise<void> {
  await apiClient.delete<void>(`/admin/video/delete/${params.videoId}`);
}

/**
 * GET /analysis/video
 *
 * Docs example:
 * { code: 200, data: { playCount, likeCount, commentCount } }
 */
export async function getVideoAnalysis(): Promise<VideoAnalysisData> {
  return apiClient.get<VideoAnalysisData>("/analysis/video");
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
export async function markVideoHot(videoId: number, isHot: 0 | 1): Promise<void> {
  await setVideoHot({ videoId, isHot });
}
