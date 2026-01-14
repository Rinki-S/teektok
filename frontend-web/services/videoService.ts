// ============================================
// 视频 API 服务（对齐 OpenAPI: http://localhost:8080/v3/api-docs）
// ============================================
//
// 本文件负责 frontend-web 中所有与视频相关的 API 调用。
// 注意：OpenAPI 的 paths 已经包含 `/api` 前缀（例如：/api/recommend/hot、/api/api/video/list），
// 因此 base URL 需要是 server root（不带 /api），避免拼出 /api/api/... 的重复前缀。

import type {
  Video,
  VideoListResponse,
  LikeVideoRequest,
  BookmarkVideoRequest,
  FollowUserRequest,
} from "@/types/video";

// OpenAPI paths already include `/api` prefix.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

// ============================================
// OpenAPI 兼容的数据结构（最小定义）
// ============================================

type ApiEnvelope<T> = {
  code: number;
  msg?: string;
  data?: T;
};

type OpenApiVideoListItem = {
  videoId: number;
  title: string;
  playCount?: number;
  likeCount?: number;
};

function joinUrl(baseUrl: string, path: string) {
  const b = baseUrl.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

async function requestOpenApi<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = joinUrl(API_BASE_URL, path);
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const text = await res.text();
  const parsed: unknown = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg =
      parsed &&
      typeof parsed === "object" &&
      parsed !== null &&
      "msg" in parsed &&
      typeof (parsed as { msg?: unknown }).msg === "string"
        ? (parsed as { msg: string }).msg
        : res.statusText || "Request failed";
    throw new Error(msg);
  }

  if (
    parsed &&
    typeof parsed === "object" &&
    parsed !== null &&
    "code" in parsed
  ) {
    const env = parsed as ApiEnvelope<T>;
    if (env.code !== 200) throw new Error(env.msg || "API error");
    return (env.data as T) ?? (undefined as T);
  }

  return parsed as T;
}

function mapOpenApiVideoListItemToVideo(item: OpenApiVideoListItem): Video {
  // frontend 的 Video 类型与后端 VO 不一致（当前 types/video.ts 是 UI 模型）。
  // 这里做一个“尽量合理”的映射：保证 use-video-feed.ts 能跑起来。
  const id = String(item.videoId);

  return {
    id,
    videoUrl: "/vid.mp4",
    thumbnailUrl: "/vid.mp4",
    title: item.title ?? `视频 ${id}`,
    description: "",
    author: {
      id: "unknown",
      username: "unknown",
      avatarUrl: undefined,
      isFollowing: false,
    },
    stats: {
      likes: item.likeCount ?? 0,
      comments: 0,
      shares: 0,
      views: item.playCount ?? 0,
    },
    isLiked: false,
    isBookmarked: false,
    createdAt: new Date().toISOString(),
  };
}

// ============================================
// OpenAPI 对齐：视频列表（用来驱动 feed）
// - GET /api/api/video/list?videoQueryDTO.page=1&videoQueryDTO.size=10
// ============================================

export async function getVideoFeed(
  cursor?: string,
  limit: number = 10,
): Promise<VideoListResponse> {
  // OpenAPI 并没有 cursor 分页；这里用 page/size 做适配。
  // cursor 为空 => page=1；cursor=数字字符串 => page=Number(cursor)
  const page = cursor ? Math.max(1, Number(cursor) || 1) : 1;

  const params = new URLSearchParams({
    "videoQueryDTO.page": String(page),
    "videoQueryDTO.size": String(limit),
  });

  const data = await requestOpenApi<OpenApiVideoListItem[]>(
    `/api/api/video/list?${params.toString()}`,
    { method: "GET" },
  );

  const items = Array.isArray(data) ? data : [];
  const videos = items.map(mapOpenApiVideoListItemToVideo);

  return {
    videos,
    nextCursor: items.length === limit ? String(page + 1) : undefined,
    hasMore: items.length === limit,
  };
}

// ============================================
// OpenAPI 对齐：播放行为
// - POST /api/api/video/play  body: { videoId: number(int32) }
// ============================================

export async function incrementVideoView(videoId: string): Promise<void> {
  const videoIdNum = Number(videoId);
  if (!Number.isFinite(videoIdNum)) return;

  await requestOpenApi<void>("/api/api/video/play", {
    method: "POST",
    body: JSON.stringify({ videoId: videoIdNum }),
  });
}

// ============================================
// OpenAPI 对齐：用户行为
// - POST /api/behavior/like    body: { videoId: number(int64) }
// - POST /api/behavior/share   body: { videoId: number(int64) }
// - POST /api/behavior/comment body: { videoId: number(int64), content: string }
// ============================================

export async function toggleLikeVideo(
  request: LikeVideoRequest,
): Promise<void> {
  const videoIdNum = Number(request.videoId);
  if (!Number.isFinite(videoIdNum)) return;

  // OpenAPI 没有 isLiked 的开关语义；该接口名是“点赞视频”。
  // 这里采用：isLiked=true 才发请求；false 不调用（当作“取消点赞”后端暂不支持）。
  if (!request.isLiked) return;

  await requestOpenApi<void>("/api/behavior/like", {
    method: "POST",
    body: JSON.stringify({ videoId: videoIdNum }),
  });
}

export async function shareVideo(videoId: string): Promise<void> {
  const videoIdNum = Number(videoId);
  if (!Number.isFinite(videoIdNum)) return;

  await requestOpenApi<void>("/api/behavior/share", {
    method: "POST",
    body: JSON.stringify({ videoId: videoIdNum }),
  });
}

/**
 * 发表评论
 * OpenAPI: POST /api/behavior/comment  body: { videoId: int64, content: string }
 */
export async function createComment(
  videoId: string,
  content: string,
): Promise<void> {
  const videoIdNum = Number(videoId);
  if (!Number.isFinite(videoIdNum)) return;

  await requestOpenApi<void>("/api/behavior/comment", {
    method: "POST",
    body: JSON.stringify({ videoId: videoIdNum, content }),
  });
}

// ============================================
// 未在 OpenAPI 中定义的能力：先保留为 no-op
// （避免 hooks/use-video-feed.ts 直接报错）
// ============================================

export async function toggleBookmarkVideo(
  _request: BookmarkVideoRequest,
): Promise<void> {
  // OpenAPI 未提供 bookmark/收藏相关接口
  void _request;
  return;
}

export async function toggleFollowUser(
  _request: FollowUserRequest,
): Promise<void> {
  // OpenAPI 未提供 follow/关注相关接口
  void _request;
  return;
}
