import { apiClient } from "@/services/apiClient";
import type { PageResult, VideoVO } from "@/types/api";

export const VIDEO_ENDPOINTS = {
  upload: "/api/video/upload",
  list: "/api/video/list",
  detail: (id: number) => `/api/video/${id}`,
  liked: "/api/video/liked",
  favorited: "/api/video/favorited",
  my: "/api/video/my",
} as const;

export async function uploadVideo(input: {
  file: File;
  title: string;
  description?: string;
  token?: string;
}): Promise<string> {
  const fd = new FormData();
  fd.append("file", input.file);
  fd.append("title", input.title);
  if (typeof input.description === "string") fd.append("description", input.description);

  return apiClient.post<string>(VIDEO_ENDPOINTS.upload, fd, {
    headers: input.token ? { token: input.token } : undefined,
  });
}

export async function getVideoList(params: {
  page?: number;
  size?: number;
  token?: string;
}): Promise<PageResult<VideoVO>> {
  const qs = new URLSearchParams({
    page: String(params.page ?? 1),
    size: String(params.size ?? 10),
  });
  return apiClient.get<PageResult<VideoVO>>(`${VIDEO_ENDPOINTS.list}?${qs.toString()}`, {
    headers: params.token ? { token: params.token } : undefined,
  });
}

export async function getVideoDetail(params: {
  id: number;
  token?: string;
}): Promise<VideoVO> {
  return apiClient.get<VideoVO>(VIDEO_ENDPOINTS.detail(params.id), {
    headers: params.token ? { token: params.token } : undefined,
  });
}

export async function getLikedVideos(params?: {
  page?: number;
  size?: number;
  token?: string;
}): Promise<PageResult<VideoVO>> {
  const qs = new URLSearchParams({
    page: String(params?.page ?? 1),
    size: String(params?.size ?? 10),
  });
  return apiClient.get<PageResult<VideoVO>>(`${VIDEO_ENDPOINTS.liked}?${qs.toString()}`, {
    headers: params?.token ? { token: params.token } : undefined,
  });
}

export async function getFavoritedVideos(params?: {
  page?: number;
  size?: number;
  token?: string;
}): Promise<PageResult<VideoVO>> {
  const qs = new URLSearchParams({
    page: String(params?.page ?? 1),
    size: String(params?.size ?? 10),
  });
  return apiClient.get<PageResult<VideoVO>>(`${VIDEO_ENDPOINTS.favorited}?${qs.toString()}`, {
    headers: params?.token ? { token: params.token } : undefined,
  });
}

export async function getMyVideos(params?: {
  page?: number;
  size?: number;
  token?: string;
}): Promise<PageResult<VideoVO>> {
  const qs = new URLSearchParams({
    page: String(params?.page ?? 1),
    size: String(params?.size ?? 10),
  });
  return apiClient.get<PageResult<VideoVO>>(`${VIDEO_ENDPOINTS.my}?${qs.toString()}`, {
    headers: params?.token ? { token: params.token } : undefined,
  });
}

