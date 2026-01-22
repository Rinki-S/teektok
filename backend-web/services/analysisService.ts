import { apiClient } from "@/services/apiClient";
import type { VideoAnalysisData } from "@/types/api";

export const ANALYSIS_ENDPOINTS = {
  video: "/api/analysis/video",
} as const;

export async function getVideoAnalysis(): Promise<VideoAnalysisData> {
  const raw = await apiClient.get<unknown>(ANALYSIS_ENDPOINTS.video);
  const obj =
    raw && typeof raw === "object" && raw !== null
      ? (raw as Record<string, unknown>)
      : {};

  const playCount = Number(obj.playCount ?? 0);
  const likeCount = Number(obj.likeCount ?? 0);
  const commentCount = Number(obj.commentCount ?? 0);

  return {
    playCount: Number.isFinite(playCount) ? playCount : 0,
    likeCount: Number.isFinite(likeCount) ? likeCount : 0,
    commentCount: Number.isFinite(commentCount) ? commentCount : 0,
  };
}
