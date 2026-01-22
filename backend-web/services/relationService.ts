import { apiClient } from "@/services/apiClient";
import type { RelationActionDTO, UserEntity } from "@/types/api";

export const RELATION_ENDPOINTS = {
  action: "/api/relation/action",
  followList: "/api/relation/follow/list",
  followerList: "/api/relation/follower/list",
  friendList: "/api/relation/friend/list",
} as const;

export async function relationAction(payload: RelationActionDTO, token: string): Promise<void> {
  await apiClient.post<void>(RELATION_ENDPOINTS.action, payload, { headers: { token } });
}

export async function getFollowList(token: string): Promise<UserEntity[]> {
  return apiClient.get<UserEntity[]>(RELATION_ENDPOINTS.followList, { headers: { token } });
}

export async function getFollowerList(token: string): Promise<UserEntity[]> {
  return apiClient.get<UserEntity[]>(RELATION_ENDPOINTS.followerList, { headers: { token } });
}

export async function getFriendList(token: string): Promise<UserEntity[]> {
  return apiClient.get<UserEntity[]>(RELATION_ENDPOINTS.friendList, { headers: { token } });
}

