"use client";

import Link from "next/link";

export default function FollowingPage() {
  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-sidebar">
      <div className="flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center px-6">
        <h1 className="text-xl font-semibold">关注</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          这里将展示你关注的账号发布的内容。
        </p>

        <div className="mt-6 flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            返回精选
          </Link>

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
