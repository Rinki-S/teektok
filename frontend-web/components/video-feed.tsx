"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import type { Video } from "@/types/video";
import { ShortCard } from "@/components/short-card";

export type VideoFeedHandle = {
  goToNext: () => void;
  goToPrev: () => void;
};

export interface VideoFeedProps {
  videos: Video[];

  /**
   * Controlled index from parent (single source of truth).
   */
  currentIndex: number;

  /**
   * Request a new index (parent updates currentIndex).
   */
  onIndexChange: (index: number) => void;

  // Actions (kept here so each ShortCard can render its own overlays/actions)
  onLike: (videoId: string, isLiked: boolean) => void;
  onComment: (videoId: string) => void;
  onBookmark: (videoId: string, isBookmarked: boolean) => void;
  onShare: (videoId: string) => void;
  onFollow: (userId: string, isFollowing: boolean) => void;
}

export const VideoFeed = React.forwardRef<VideoFeedHandle, VideoFeedProps>(
  function VideoFeed(
    {
      videos,
      currentIndex,
      onIndexChange,
      onLike,
      onComment,
      onBookmark,
      onShare,
      onFollow,
    }: VideoFeedProps,
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);

    /**
     * A real TikTok-like vertical pager:
     * - Always render 3 pages: prev/current/next (when available)
     * - Drag the STAGE with your finger (follow gesture)
     * - Snap on release, and only then commit index change
     */
    const y = useMotionValue(0);

    const heightRef = useRef(0);
    const isAnimatingRef = useRef(false);

    const [localIndex, setLocalIndex] = useState(currentIndex);

    const clampIndex = useCallback(
      (idx: number) => Math.max(0, Math.min(videos.length - 1, idx)),
      [videos.length],
    );

    // Sync localIndex with controlled index (e.g. external navigator buttons).
    // We animate to the corresponding direction so it still feels like a pager.
    useEffect(() => {
      if (currentIndex === localIndex) return;

      const next = clampIndex(currentIndex);
      const dir = next > localIndex ? 1 : -1;

      // If we don't know height yet, just sync immediately.
      const h = heightRef.current || 0;
      if (h <= 0) {
        setLocalIndex(next);
        y.set(0);
        return;
      }

      // Avoid stacking animations.
      isAnimatingRef.current = true;

      // Animate stage to reveal the next/prev, then commit.
      animate(y, dir === 1 ? -h : h, {
        type: "tween",
        ease: "easeInOut",
        duration: 0.22,
        onComplete: () => {
          setLocalIndex(next);
          y.set(0);
          isAnimatingRef.current = false;
        },
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex]);

    // Measure container height (used for snap distances).
    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;

      const update = () => {
        heightRef.current = el.getBoundingClientRect().height || 0;
      };

      update();

      const ro = new ResizeObserver(() => update());
      ro.observe(el);

      return () => ro.disconnect();
    }, []);

    const canGoPrev = localIndex > 0;
    const canGoNext = localIndex < videos.length - 1;

    const commitIndex = useCallback(
      (nextIndex: number) => {
        const next = clampIndex(nextIndex);
        if (next === localIndex) return;
        setLocalIndex(next);
        onIndexChange(next);
      },
      [clampIndex, localIndex, onIndexChange],
    );

    const snapTo = useCallback(
      async (targetY: number, nextIndexAfter?: number) => {
        isAnimatingRef.current = true;

        await animate(y, targetY, {
          type: "tween",
          ease: "easeInOut",
          duration: 0.22,
        }).finished;

        if (typeof nextIndexAfter === "number") {
          // Commit after the motion, then reset stage to centered (0).
          commitIndex(nextIndexAfter);
        }

        y.set(0);
        isAnimatingRef.current = false;
      },
      [commitIndex, y],
    );

    const goToNext = useCallback(() => {
      if (!canGoNext || isAnimatingRef.current) return;
      const h = heightRef.current || 0;
      if (h <= 0) {
        commitIndex(localIndex + 1);
        return;
      }
      void snapTo(-h, localIndex + 1);
    }, [canGoNext, commitIndex, localIndex, snapTo]);

    const goToPrev = useCallback(() => {
      if (!canGoPrev || isAnimatingRef.current) return;
      const h = heightRef.current || 0;
      if (h <= 0) {
        commitIndex(localIndex - 1);
        return;
      }
      void snapTo(h, localIndex - 1);
    }, [canGoPrev, commitIndex, localIndex, snapTo]);

    React.useImperativeHandle(
      ref,
      () => ({
        goToNext,
        goToPrev,
      }),
      [goToNext, goToPrev],
    );

    // Wheel navigation (desktop)
    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;

      let throttled = false;

      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        if (throttled || isAnimatingRef.current) return;

        if (e.deltaY > 40) {
          goToNext();
          throttled = true;
          setTimeout(() => (throttled = false), 450);
        } else if (e.deltaY < -40) {
          goToPrev();
          throttled = true;
          setTimeout(() => (throttled = false), 450);
        }
      };

      el.addEventListener("wheel", onWheel, { passive: false });
      return () => el.removeEventListener("wheel", onWheel);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localIndex, videos.length]);

    // Keyboard navigation
    useEffect(() => {
      const onKeyDown = (e: KeyboardEvent) => {
        if (isAnimatingRef.current) return;

        if (e.key === "ArrowDown") {
          e.preventDefault();
          goToNext();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          goToPrev();
        }
      };

      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localIndex, videos.length]);

    // Touch navigation (mobile) fallback (for non-drag interactions)
    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;

      let startY = 0;
      let throttled = false;

      const onTouchStart = (e: TouchEvent) => {
        startY = e.touches[0]?.clientY ?? 0;
      };

      const onTouchEnd = (e: TouchEvent) => {
        if (throttled || isAnimatingRef.current) return;

        const endY = e.changedTouches[0]?.clientY ?? 0;
        const diff = startY - endY; // positive = swipe up
        const threshold = 60;

        if (diff > threshold) {
          goToNext();
          throttled = true;
          setTimeout(() => (throttled = false), 450);
        } else if (diff < -threshold) {
          goToPrev();
          throttled = true;
          setTimeout(() => (throttled = false), 450);
        }
      };

      el.addEventListener("touchstart", onTouchStart, { passive: true });
      el.addEventListener("touchend", onTouchEnd, { passive: true });

      return () => {
        el.removeEventListener("touchstart", onTouchStart);
        el.removeEventListener("touchend", onTouchEnd);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localIndex, videos.length]);

    const currentVideo = videos[localIndex] ?? null;

    const pages = useMemo(() => {
      const prev = localIndex > 0 ? videos[localIndex - 1] : null;
      const cur = videos[localIndex] ?? null;
      const next =
        localIndex < videos.length - 1 ? videos[localIndex + 1] : null;

      return { prev, cur, next };
    }, [localIndex, videos]);

    if (!currentVideo) {
      return (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          没有视频
        </div>
      );
    }

    const handleStageDragEnd = (
      _: unknown,
      info: { offset: { y: number }; velocity: { y: number } },
    ) => {
      if (isAnimatingRef.current) return;

      const h = heightRef.current || 0;
      if (h <= 0) return;

      const offsetY = info.offset.y;
      const vY = info.velocity.y;

      // Tune for "TikTok-like" snap.
      const threshold = Math.min(180, h * 0.22);

      // Dragging up => negative offset => go next (stage snaps to -h)
      if ((offsetY < -threshold || vY < -700) && canGoNext) {
        void snapTo(-h, localIndex + 1);
        return;
      }

      // Dragging down => positive offset => go prev (stage snaps to +h)
      if ((offsetY > threshold || vY > 700) && canGoPrev) {
        void snapTo(h, localIndex - 1);
        return;
      }

      // Not enough: bounce back to center
      void snapTo(0);
    };

    return (
      <div ref={containerRef} className="relative h-full w-full min-h-0">
        {/* Viewport mask */}
        <div className="relative h-full w-full min-h-0 overflow-hidden">
          {/* Stage: translate follows drag; pages are stacked at -100%/0/+100% */}
          <motion.div
            className="absolute inset-0"
            style={{ y }}
            drag={isAnimatingRef.current ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            // Increase elasticity so a shorter cursor drag reveals more of prev/next pages.
            // Higher = more responsive reveal, but too high can feel rubbery.
            dragElastic={0.7}
            onDragEnd={handleStageDragEnd}
          >
            {/* Prev page */}
            {pages.prev ? (
              <div
                className="absolute inset-0"
                style={{ transform: "translateY(-100%)" }}
              >
                <ShortCard
                  video={pages.prev}
                  isActive={false}
                  onLike={onLike}
                  onComment={onComment}
                  onBookmark={onBookmark}
                  onShare={onShare}
                  onFollow={onFollow}
                  className="h-full w-full"
                >
                  <div className="pointer-events-none absolute left-4 top-4 z-30 rounded bg-black/70 px-2 py-1 text-xs text-white">
                    {localIndex} / {videos.length}
                  </div>
                </ShortCard>
              </div>
            ) : null}

            {/* Current page */}
            {pages.cur ? (
              <div className="absolute inset-0">
                <ShortCard
                  video={pages.cur}
                  isActive={true}
                  onLike={onLike}
                  onComment={onComment}
                  onBookmark={onBookmark}
                  onShare={onShare}
                  onFollow={onFollow}
                  className="h-full w-full"
                >
                  <div className="pointer-events-none absolute left-4 top-4 z-30 rounded bg-black/70 px-2 py-1 text-xs text-white">
                    {localIndex + 1} / {videos.length}
                  </div>
                </ShortCard>
              </div>
            ) : null}

            {/* Next page */}
            {pages.next ? (
              <div
                className="absolute inset-0"
                style={{ transform: "translateY(100%)" }}
              >
                <ShortCard
                  video={pages.next}
                  isActive={false}
                  onLike={onLike}
                  onComment={onComment}
                  onBookmark={onBookmark}
                  onShare={onShare}
                  onFollow={onFollow}
                  className="h-full w-full"
                >
                  <div className="pointer-events-none absolute left-4 top-4 z-30 rounded bg-black/70 px-2 py-1 text-xs text-white">
                    {localIndex + 2} / {videos.length}
                  </div>
                </ShortCard>
              </div>
            ) : null}
          </motion.div>
        </div>
      </div>
    );
  },
);
