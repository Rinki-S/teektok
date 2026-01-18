"use client";

import * as React from "react";
import Link from "next/link";

const AUTH_STORAGE_KEY = "teektok.auth";

type AuthUser = {
  userId: number;
  username: string;
  token: string;
};

export default function FriendsPage() {
  const [authUser, setAuthUser] = React.useState<AuthUser | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as AuthUser;
      if (parsed?.token && parsed?.userId) {
        setAuthUser(parsed);
      }
    } catch {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

  if (!authUser) {
    return (
      <div className="flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center bg-sidebar px-6 text-center">
        <h1 className="text-xl font-semibold">请先登录</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          登录后查看朋友内容。
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
      <div className="flex w-full flex-col gap-2 p-6">
        <h1 className="text-xl font-semibold text-foreground">朋友</h1>
        <p className="text-sm text-muted-foreground">
          这是“朋友”页面的独立路由。你可以在这里放好友动态、共同关注、推荐关注等内容。
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-lg bg-neutral-700 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-600 transition-colors"
          >
            返回精选(首页)
          </Link>
          <Link
            href="/following"
            className="rounded-lg bg-neutral-700 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-600 transition-colors"
          >
            去关注
          </Link>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">朋友内容区域（待实现）</p>
        </div>
      </div>
    </div>
  );
}
