"use client";

import Link from "next/link";

export default function FriendsPage() {
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
