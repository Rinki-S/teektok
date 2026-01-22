"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getVideoById } from "@/services/videoService";
import type { Video } from "@/types/video";

export default function WatchPage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const router = useRouter();
  const [video, setVideo] = React.useState<Video | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const resolvedParams = React.use(params);

  React.useEffect(() => {
    const id = resolvedParams.videoId;
    if (!id) return;
    getVideoById(id)
      .then((v) => setVideo(v))
      .catch((e) => {
        console.error("Failed to load video", e);
        setError(e instanceof Error ? e.message : "加载失败");
      });
  }, [resolvedParams.videoId]);

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-sidebar">
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <button
          type="button"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
          onClick={() => router.back()}
        >
          返回
        </button>
        <Link
          href="/"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          首页
        </Link>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {error ? (
          <div className="text-sm text-destructive">{error}</div>
        ) : !video ? (
          <div className="text-sm text-muted-foreground">加载中...</div>
        ) : (
          <div className="mx-auto w-full max-w-lg">
            <div className="rounded-xl overflow-hidden bg-black">
              <video
                src={video.videoUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-auto"
              />
            </div>

            <div className="mt-4">
              <div className="text-base font-semibold text-foreground">
                {video.title}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                <Link
                  href={`/user/${video.author.id}`}
                  className="hover:underline"
                >
                  @{video.author.username}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
