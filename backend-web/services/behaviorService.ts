import { apiClient } from "@/services/apiClient";
import type { BehaviorDTO, CommentCreateDTO, PlayDTO, ShareDTO } from "@/types/api";

export const BEHAVIOR_ENDPOINTS = {
  play: "/api/behavior/play",
  like: "/api/behavior/like",
  unlike: "/api/behavior/unlike",
  favorite: "/api/behavior/favorite",
  unfavorite: "/api/behavior/unfavorite",
  commentCreate: "/api/behavior/comment",
  commentLike: "/api/behavior/comment/like",
  commentUnlike: "/api/behavior/comment/unlike",
  share: "/api/behavior/share",
} as const;

export async function reportPlay(payload: PlayDTO): Promise<void> {
  await apiClient.post<void>(BEHAVIOR_ENDPOINTS.play, payload);
}

export async function likeVideo(payload: BehaviorDTO, token: string): Promise<void> {
  await apiClient.post<void>(BEHAVIOR_ENDPOINTS.like, payload, {
    headers: { token },
  });
}

export async function unlikeVideo(payload: BehaviorDTO, token: string): Promise<void> {
  await apiClient.post<void>(BEHAVIOR_ENDPOINTS.unlike, payload, {
    headers: { token },
  });
}

export async function favoriteVideo(payload: BehaviorDTO, token: string): Promise<void> {
  await apiClient.post<void>(BEHAVIOR_ENDPOINTS.favorite, payload, {
    headers: { token },
  });
}

export async function unfavoriteVideo(payload: BehaviorDTO, token: string): Promise<void> {
  await apiClient.post<void>(BEHAVIOR_ENDPOINTS.unfavorite, payload, {
    headers: { token },
  });
}

export async function createComment(payload: CommentCreateDTO, token: string): Promise<void> {
  await apiClient.post<void>(BEHAVIOR_ENDPOINTS.commentCreate, payload, {
    headers: { token },
  });
}

export async function likeComment(commentId: number, token: string): Promise<void> {
  await apiClient.post<void>(
    BEHAVIOR_ENDPOINTS.commentLike,
    { videoId: commentId } satisfies BehaviorDTO,
    { headers: { token } },
  );
}

export async function unlikeComment(commentId: number, token: string): Promise<void> {
  await apiClient.post<void>(
    BEHAVIOR_ENDPOINTS.commentUnlike,
    { videoId: commentId } satisfies BehaviorDTO,
    { headers: { token } },
  );
}

export async function shareVideo(payload: ShareDTO, token: string): Promise<void> {
  await apiClient.post<void>(BEHAVIOR_ENDPOINTS.share, payload, {
    headers: { token },
  });
}

