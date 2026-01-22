import { apiClient } from "@/services/apiClient";
import type { UserLoginRequest, UserLoginVO, UserMeVO, UserRegisterRequest, UserSearchVO } from "@/types/api";

export const USER_ENDPOINTS = {
  register: "/api/user/register",
  login: "/api/user/login",
  me: "/api/user/me",
  search: "/api/user/search",
} as const;

export async function userRegister(payload: UserRegisterRequest): Promise<void> {
  await apiClient.post<void>(USER_ENDPOINTS.register, payload);
}

export async function userLogin(payload: UserLoginRequest): Promise<UserLoginVO> {
  return apiClient.post<UserLoginVO>(USER_ENDPOINTS.login, payload);
}

export async function getUserMe(init?: { token?: string }): Promise<UserMeVO> {
  return apiClient.get<UserMeVO>(USER_ENDPOINTS.me, {
    headers: init?.token ? { token: init.token } : undefined,
  });
}

export async function searchUsers(params: {
  keyword: string;
  page?: number;
  size?: number;
  token?: string;
}): Promise<UserSearchVO[]> {
  const qs = new URLSearchParams({
    keyword: params.keyword,
    page: String(params.page ?? 1),
    size: String(params.size ?? 20),
  });

  return apiClient.get<UserSearchVO[]>(
    `${USER_ENDPOINTS.search}?${qs.toString()}`,
    {
      headers: params.token ? { token: params.token } : undefined,
    },
  );
}

