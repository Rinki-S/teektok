"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useShortsNav } from "@/components/shorts-nav-context";
import { useVideoFeed } from "@/hooks/use-video-feed";
import { VideoFeed, type VideoFeedHandle } from "@/components/video-feed";

export function HomePage({
  feedType = "default",
}: {
  feedType?: "default" | "recommend" | "hot";
}) {
  const {
    videos,
    isLoading,
    error,
    handleLike,
    handleBookmark,
    handleFollow,
    handleShare,
    handleComment,
    loadMoreVideos,
  } = useVideoFeed(undefined, feedType);

  const { setState: setNavState, reset: resetNav } = useShortsNav();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Imperative control of the feed so external UI (right-side navigator) can trigger animations.
  const feedRef = useRef<VideoFeedHandle | null>(null);

  // Fallbacks: keep these in case the ref isn't ready yet.
  const goToNextFallback = useCallback(() => {
    setCurrentIndex((prev) => (prev < videos.length - 1 ? prev + 1 : prev));
  }, [videos.length]);

  const goToPreviousFallback = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const goToNext = useCallback(() => {
    if (feedRef.current) {
      feedRef.current.goToNext();
      return;
    }
    goToNextFallback();
  }, [goToNextFallback]);

  const goToPrevious = useCallback(() => {
    if (feedRef.current) {
      feedRef.current.goToPrev();
      return;
    }
    goToPreviousFallback();
  }, [goToPreviousFallback]);

  const navTotal = videos.length;

  const navState = useMemo(
    () => ({
      currentIndex,
      total: navTotal,
      goPrevious: goToPrevious,
      goNext: goToNext,
    }),
    [currentIndex, navTotal, goToPrevious, goToNext],
  );

  useEffect(() => {
    // Publish navigation state/handlers to the global navigator (rendered outside the card).
    setNavState(navState);

    // Reset when leaving/unmounting this page so other routes don't inherit stale handlers.
    return () => {
      resetNav();
    };
  }, [navState, setNavState, resetNav]);

  useEffect(() => {
    // 提前加载：当用户看到倒数第 3 个视频时，触发加载下一页
    if (videos.length > 0 && currentIndex >= videos.length - 3) {
      loadMoreVideos();
    }
  }, [currentIndex, videos.length, loadMoreVideos]);

  if (isLoading) {
    return (
      <div className="flex w-full h-full min-h-0 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex w-full h-full min-h-0 items-center justify-center">
        <div className="text-center text-destructive">
          <p className="font-semibold mb-2">加载失败</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex w-full h-full min-h-0 items-center justify-center">
        <p className="text-muted-foreground">暂无视频</p>
      </div>
    );
  }

  /**
   * Layout intent (TikTok-like):
   * - Cards should feel like they enter/exit from beyond the viewport edges.
   * - Provide outer padding so the moving card can visibly travel under/around UI chrome
   *   (top bar / page edge) instead of only moving within an identical-sized mask.
   *
   * Notes:
   * - The actual enter/exit distance & easing are controlled in `components/video-feed.tsx`.
   * - Here we only create a "stage" around the feed to make movement more perceptible.
   */
  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 overflow-hidden bg-sidebar">
      <div className="relative flex h-full min-h-0 w-full flex-1 px-0 md:px-0 pt-0 md:pt-0">
        <VideoFeed
          ref={feedRef}
          videos={videos}
          currentIndex={currentIndex}
          onIndexChange={setCurrentIndex}
          onLike={handleLike}
          onBookmark={handleBookmark}
          onFollow={handleFollow}
          onShare={handleShare}
          onComment={handleComment}
        />
      </div>
    </div>
  );
}
