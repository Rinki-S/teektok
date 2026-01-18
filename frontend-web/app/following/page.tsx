"use client";

import * as React from "react";
import Link from "next/link";


const AUTH_STORAGE_KEY = "teektok.auth";

type AuthUser = {
  userId: number;
  username: string;
  token: string;
};

export default function FollowingPage() {
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
      <div className="flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center px-6">
        <h1 className="text-xl font-semibold">关注</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          这里将展示你关注的账号发布的内容。
        </p>

        <div className="mt-6 flex items-center gap-3">
          <Link
            href="/friends"
            className="inline-flex h-9 items-center justify-center rounded-md border border-neutral-700 bg-transparent px-4 text-sm font-medium text-foreground hover:bg-neutral-800"
          >
            去朋友页
          </Link>
        </div>
      </div>
    </div>
  );
}
