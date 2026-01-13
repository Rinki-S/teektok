"use client";

import Link from "next/link";

export default function TrendingPage() {
  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-sidebar">
      <div className="flex w-full flex-1 flex-col gap-3 p-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-lg font-semibold text-foreground">热门</h1>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            返回精选
          </Link>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-background/30 p-4">
          <p className="text-sm text-muted-foreground">
            这是一个独立的 <code>/trending</code> 路由页面。你可以在这里实现热门榜单、
            热门话题、热门短视频流等内容。
          </p>
        </div>

        <div className="flex-1 rounded-xl border border-dashed border-neutral-800 bg-background/10 p-6">
          <div className="text-sm text-muted-foreground">
            TODO: 实现热门内容模块
          </div>
        </div>
      </div>
    </div>
  );
}
