import { apiClient } from "@/services/apiClient";
import type { CommentVO, PageResult } from "@/types/api";

export const COMMENT_ENDPOINTS = {
  list: "/api/comment/list",
} as const;

export async function getCommentList(params: {
  videoId: number;
  page?: number;
  size?: number;
  token?: string;
}): Promise<PageResult<CommentVO>> {
  const qs = new URLSearchParams({
    videoId: String(params.videoId),
    page: String(params.page ?? 1),
    size: String(params.size ?? 10),
  });
  return apiClient.get<PageResult<CommentVO>>(
    `${COMMENT_ENDPOINTS.list}?${qs.toString()}`,
    {
      headers: params.token ? { token: params.token } : undefined,
    },
  );
}

