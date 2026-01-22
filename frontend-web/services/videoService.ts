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
  Comment,
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

type PageResult<T> = {
  list: T[];
  total: number;
};

type VideoVO = {
  videoId: number;
  title: string;
  videoUrl: string;
  coverUrl: string;
  playCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  favoriteCount: number;
  isLiked?: boolean;
  description?: string;
  uploaderId?: number;
  uploaderName?: string;
  uploaderAvatar?: string;
  isFollowed?: boolean;
};

type UserVO = {
  id: number;
  username: string;
  avatar?: string;
  // 其他字段视后端返回而定
};

function joinUrl(baseUrl: string, path: string) {
  const b = baseUrl.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("teektok.auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: unknown } | null;
    const token = parsed?.token;
    return typeof token === "string" && token ? token : null;
  } catch {
    return null;
  }
}

async function requestOpenApi<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = joinUrl(API_BASE_URL, path);

  const token = getAuthToken();

  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { token } : {}),
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

async function requestOpenApiFormData<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = joinUrl(API_BASE_URL, path);

  const token = getAuthToken();

  const res = await fetch(url, {
    ...init,
    headers: {
      ...(token ? { token } : {}),
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

function mapVideoVOToVideo(item: VideoVO): Video {
  const id = String(item.videoId);

  return {
    id,
    videoUrl: item.videoUrl || "/vid.mp4",
    thumbnailUrl: item.coverUrl || "/vid.mp4",
    title: item.title ?? `视频 ${id}`,
    description: item.description || "",
    author: {
      id: item.uploaderId ? String(item.uploaderId) : "unknown",
      username: item.uploaderName || "unknown",
      avatarUrl: item.uploaderAvatar,
      isFollowing: Boolean(item.isFollowed),
    },
    stats: {
      likes: item.likeCount ?? 0,
      comments: item.commentCount ?? 0,
      shares: item.shareCount ?? 0,
      views: item.playCount ?? 0,
    },
    isLiked: Boolean((item as { isLiked?: unknown; liked?: unknown }).isLiked ?? (item as { liked?: unknown }).liked),
    isBookmarked: Boolean((item as { isFavorited?: unknown; favorited?: unknown }).isFavorited ?? (item as { favorited?: unknown }).favorited),
    createdAt: new Date().toISOString(),
  };
}

// ============================================
// Token 解析
// ============================================

export function getCurrentUserId(): string | null {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    const decoded = JSON.parse(jsonPayload);
    return decoded.userId ? String(decoded.userId) : null;
  } catch (e) {
    console.error("Failed to parse token:", e);
    return null;
  }
}

// ============================================
// OpenAPI 对齐：视频列表（用来驱动 feed）
// - GET /api/video/list?page=1&size=10
// ============================================


export async function getVideoFeed(
  cursor?: string,
  limit: number = 10,
): Promise<VideoListResponse> {
  // OpenAPI 并没有 cursor 分页；这里用 page/size 做适配。
  // cursor 为空 => page=1；cursor=数字字符串 => page=Number(cursor)
  const page = cursor ? Math.max(1, Number(cursor) || 1) : 1;

  const params = new URLSearchParams({
    page: String(page),
    size: String(limit),
  });

  const data = await requestOpenApi<PageResult<VideoVO>>(
    `/api/video/list?${params.toString()}`,
    { method: "GET" },
  );

  const items = Array.isArray(data?.list) ? data.list : [];
  const videos = items.map(mapVideoVOToVideo);
  const total = typeof data?.total === "number" ? data.total : 0;
  const hasMore = total > 0 ? page * limit < total : items.length === limit;

  return {
    videos,
    nextCursor: hasMore ? String(page + 1) : undefined,
    hasMore,
  };
}

export async function getRecommendFeed(userId: string): Promise<VideoListResponse> {
  // GET /api/recommend/{userId}
  const data = await requestOpenApi<VideoVO[]>(`/api/recommend/${userId}`, {
    method: "GET",
  });

  // RecommendVideoVO in backend uses 'id' instead of 'videoId', and missing some fields.
  // We need to map it carefully. 
  // Ideally backend should return consistent VO. For now we map what we have.
  const items = Array.isArray(data) ? data : [];
  
  const videos = items.map(item => {
    // Adapter for RecommendVideoVO which might use 'id' instead of 'videoId'
    const maybe = item as VideoVO & { id?: unknown };
    const videoId = typeof maybe.id === "number" ? maybe.id : item.videoId;
    
    // Construct a VideoVO compatible object
    const vo: VideoVO = {
        ...item,
        videoId: videoId,
        // RecommendVideoVO has 'id', 'title', 'videoUrl', 'coverUrl', 'likeCount', 'commentCount', 'favoriteCount', 'shareCount'
        // It might be missing uploader info.
    };
    return mapVideoVOToVideo(vo);
  });

  return {
    videos,
    nextCursor: undefined, // No pagination for recommend feed currently
    hasMore: false,
  };
}

export async function getHotFeed(): Promise<VideoListResponse> {
  // GET /api/recommend/hot
  const data = await requestOpenApi<VideoVO[]>(`/api/recommend/hot`, {
    method: "GET",
  });

  const items = Array.isArray(data) ? data : [];
  
  const videos = items.map(item => {
    // Adapter for RecommendVideoVO
    const maybe = item as VideoVO & { id?: unknown };
    const videoId = typeof maybe.id === "number" ? maybe.id : item.videoId;
    
    const vo: VideoVO = {
        ...item,
        videoId: videoId,
    };
    return mapVideoVOToVideo(vo);
  });

  return {
    videos,
    nextCursor: undefined, // No pagination for hot feed currently
    hasMore: false,
  };
}

export async function getVideoById(videoId: string): Promise<Video> {
  const videoIdNum = Number(videoId);
  if (!Number.isFinite(videoIdNum)) throw new Error("Invalid video ID");

  const item = await requestOpenApi<VideoVO>(`/api/video/${videoIdNum}`, {
    method: "GET",
  });

  return mapVideoVOToVideo(item);
}

export async function uploadVideo(input: {
  file: File;
  title: string;
  description?: string;
}): Promise<void> {
  const formData = new FormData();
  formData.append("file", input.file);
  formData.append("title", input.title);
  if (input.description) formData.append("description", input.description);

  await requestOpenApiFormData<void>("/api/video/upload", {
    method: "POST",
    body: formData,
  });
}

// ============================================
// OpenAPI 对齐：播放行为
// - POST /api/api/video/play  body: { videoId: number(int32) }
// ============================================

export async function incrementVideoView(videoId: string): Promise<void> {
  const videoIdNum = Number(videoId);
  if (!Number.isFinite(videoIdNum)) return;

  await requestOpenApi<void>("/api/behavior/play", {
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

  const endpoint = request.isLiked
    ? "/api/behavior/like"
    : "/api/behavior/unlike";

  await requestOpenApi<void>(endpoint, {
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
  parentId?: string,
): Promise<void> {
  const videoIdNum = Number(videoId);
  if (!Number.isFinite(videoIdNum)) return;

  const payload: { videoId: number; content: string; parentId?: number } = {
    videoId: videoIdNum,
    content,
  };
  if (parentId) {
    payload.parentId = Number(parentId);
  }

  await requestOpenApi<void>("/api/behavior/comment", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * 评论点赞/取消点赞
 */
export async function toggleLikeComment(
  commentId: string,
  isLiked: boolean,
): Promise<void> {
  const commentIdNum = Number(commentId);
  if (!Number.isFinite(commentIdNum)) return;

  // 使用 BehaviorDTO 的 videoId 字段传递 commentId (后端复用逻辑)
  // endpoint: /api/behavior/comment/like or /unlike
  const endpoint = isLiked
    ? "/api/behavior/comment/like"
    : "/api/behavior/comment/unlike";

  await requestOpenApi<void>(endpoint, {
    method: "POST",
    body: JSON.stringify({ videoId: commentIdNum }),
  });
}

/**
 * 获取评论列表
 * OpenAPI: GET /api/comment/list?videoId=...&page=...&size=...
 */
export async function getComments(
  videoId: string,
  page: number = 1,
  size: number = 10,
): Promise<{ list: Comment[]; total: number }> {
  const videoIdNum = Number(videoId);
  if (!Number.isFinite(videoIdNum)) return { list: [], total: 0 };

  const params = new URLSearchParams({
    videoId: String(videoIdNum),
    page: String(page),
    size: String(size),
  });

  const data = await requestOpenApi<PageResult<Comment>>(
    `/api/comment/list?${params.toString()}`,
    { method: "GET" },
  );

  const rawList = data?.list ?? [];
  const list = rawList.map((c) => {
    const maybe = c as Comment & { liked?: unknown; isLiked?: unknown };
    const isLiked = Boolean(maybe.isLiked ?? maybe.liked);
    return { ...c, isLiked };
  });

  return {
    list,
    total: data?.total ?? 0,
  };
}

// ============================================
// 未在 OpenAPI 中定义的能力：先保留为 no-op
// （避免 hooks/use-video-feed.ts 直接报错）
// ============================================

export async function toggleBookmarkVideo(
  request: BookmarkVideoRequest,
): Promise<void> {
  const videoIdNum = Number(request.videoId);
  if (!Number.isFinite(videoIdNum)) return;

  const endpoint = request.isBookmarked
    ? "/api/behavior/favorite"
    : "/api/behavior/unfavorite";

  await requestOpenApi<void>(endpoint, {
    method: "POST",
    body: JSON.stringify({ videoId: videoIdNum }),
  });
}

export async function getLikedVideos(
  page: number = 1,
  size: number = 10,
): Promise<{ list: Video[]; total: number }> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  const data = await requestOpenApi<PageResult<VideoVO>>(
    `/api/video/liked?${params.toString()}`,
    { method: "GET" },
  );

  const items = Array.isArray(data?.list) ? data.list : [];
  const list = items.map(mapVideoVOToVideo);
  
  return {
    list,
    total: data?.total ?? 0,
  };
}

export async function getFavoritedVideos(
  page: number = 1,
  size: number = 10,
): Promise<{ list: Video[]; total: number }> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  const data = await requestOpenApi<PageResult<VideoVO>>(
    `/api/video/favorited?${params.toString()}`,
    { method: "GET" },
  );

  const items = Array.isArray(data?.list) ? data.list : [];
  const list = items.map(mapVideoVOToVideo);
  
  return {
    list,
    total: data?.total ?? 0,
  };
}

export async function toggleFollowUser(
  request: FollowUserRequest,
): Promise<void> {
  const targetIdNum = Number(request.userId);
  if (!Number.isFinite(targetIdNum)) return;

  // actionType: 1=关注, 2=取消关注
  const actionType = request.isFollowing ? 1 : 2;

  await requestOpenApi<void>("/api/relation/action", {
    method: "POST",
    body: JSON.stringify({ targetId: targetIdNum, actionType }),
  });
}

export async function getFollowList(): Promise<UserVO[]> {
  const data = await requestOpenApi<UserVO[]>("/api/relation/follow/list", {
    method: "GET",
  });
  return data || [];
}

export async function getFollowerList(): Promise<UserVO[]> {
  const data = await requestOpenApi<UserVO[]>("/api/relation/follower/list", {
    method: "GET",
  });
  return data || [];
}

export async function getFriendList(): Promise<UserVO[]> {
  const data = await requestOpenApi<UserVO[]>("/api/relation/friend/list", {
    method: "GET",
  });
  return data || [];
}
