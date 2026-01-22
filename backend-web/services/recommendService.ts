import { apiClient } from "@/services/apiClient";
import type { RecommendVideoVO } from "@/types/api";

export const RECOMMEND_ENDPOINTS = {
  forUser: (userId: number) => `/api/recommend/${userId}`,
  hot: "/api/recommend/hot",
} as const;

export async function getRecommendForUser(params: {
  userId: number;
  page?: number;
  size?: number;
  token: string;
}): Promise<RecommendVideoVO[]> {
  const qs = new URLSearchParams({
    page: String(params.page ?? 1),
    size: String(params.size ?? 10),
  });
  return apiClient.get<RecommendVideoVO[]>(
    `${RECOMMEND_ENDPOINTS.forUser(params.userId)}?${qs.toString()}`,
    { headers: { token: params.token } },
  );
}

export async function getHotRecommend(params?: {
  userId?: number;
  page?: number;
  size?: number;
  token?: string;
}): Promise<RecommendVideoVO[]> {
  const qs = new URLSearchParams({
    page: String(params?.page ?? 1),
    size: String(params?.size ?? 10),
  });
  if (typeof params?.userId === "number") qs.set("userId", String(params.userId));

  return apiClient.get<RecommendVideoVO[]>(
    `${RECOMMEND_ENDPOINTS.hot}?${qs.toString()}`,
    {
      headers: params?.token ? { token: params.token } : undefined,
    },
  );
}

