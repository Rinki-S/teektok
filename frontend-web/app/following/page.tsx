"use client";

import * as React from "react";
import Link from "next/link";
import { getFollowList, toggleFollowUser } from "@/services/videoService";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const AUTH_STORAGE_KEY = "teektok.auth";

type AuthUser = {
  userId: number;
  username: string;
  token: string;
};

type UserVO = {
  id: number;
  username: string;
  avatar?: string;
};

export default function FollowingPage() {
  const [authUser, setAuthUser] = React.useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [followingList, setFollowingList] = React.useState<UserVO[]>([]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AuthUser;
        if (parsed?.token && parsed?.userId) {
          setAuthUser(parsed);
        }
      }
    } catch {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (authUser) {
      getFollowList()
        .then((data) => setFollowingList(data))
        .catch((err) => console.error("Failed to load following list", err));
    }
  }, [authUser]);

  const handleUnfollow = async (targetId: number) => {
    try {
      // 这里的 isFollowing: false 表示我们要执行取消关注操作
      // 实际上 toggleFollowUser 内部逻辑是根据 isFollowing 值决定 actionType
      // 如果 isFollowing=false -> actionType=2 (取消关注)
      await toggleFollowUser({ userId: String(targetId), isFollowing: false });
      setFollowingList((prev) => prev.filter((u) => u.id !== targetId));
    } catch (err) {
      console.error("Failed to unfollow", err);
    }
  };

  if (isLoading) {
    return null;
  }

  if (!authUser) {
    return (
      <div className="flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center bg-sidebar px-6 text-center">
        <h1 className="text-xl font-semibold">请先登录</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          登录后查看关注内容。
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          点击右上角登录按钮继续。
        </p>
        <button
          type="button"
          className="mt-6 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("teektok:open-login"));
            }
          }}
        >
          去登录
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-sidebar">
      <div className="flex w-full flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">关注列表</h1>
          <Link
            href="/friends"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            去朋友页 &rarr;
          </Link>
        </div>

        {followingList.length === 0 ? (
          <div className="mt-10 text-center text-muted-foreground">
            <p>暂时没有关注任何人</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {followingList.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} alt={user.username} />
                    <AvatarFallback>{user.username.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate text-sm font-medium text-card-foreground">
                      {user.username}
                    </span>
                    <span className="text-xs text-muted-foreground">ID: {user.id}</span>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleUnfollow(user.id)}
                >
                  已关注
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
