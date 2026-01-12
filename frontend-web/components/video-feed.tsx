"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Video } from "@/types/video";
import { ShortCard } from "@/components/short-card";

/**
 * TikTok-like page enter/exit:
 * - Cards should travel edge-to-edge and clearly come from outside the viewport.
 * - While a new card enters, the current card should *simultaneously* leave in the opposite direction.
 *
 * Strategy:
 * - Render TWO full cards during a transition: previous + current.
 * - Animate them simultaneously with a snappy tween (minimal bounce).
 * - Use a travel distance > container height to make the motion feel like it comes from outside the page.
 */

type Direction = -1 | 0 | 1;

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

    // Keep a previous card rendered during transitions.
    const [prevIndex, setPrevIndex] = useState<number | null>(null);
    const [direction, setDirection] = useState<Direction>(0);

    // Used to avoid stale animation completion clearing a newer transition.
    const transitionKeyRef = useRef(0);
    const lastIndexRef = useRef<number>(currentIndex);

    const clampIndex = (idx: number) =>
      Math.max(0, Math.min(videos.length - 1, idx));

    const requestIndex = (idx: number, dir: Direction) => {
      const next = clampIndex(idx);
      if (next === currentIndex) return;

      // Capture previous index and direction immediately for animation.
      setPrevIndex(currentIndex);
      setDirection(dir);
      transitionKeyRef.current += 1;

      onIndexChange(next);
    };

    const goToNext = () => requestIndex(currentIndex + 1, 1);
    const goToPrev = () => requestIndex(currentIndex - 1, -1);

    React.useImperativeHandle(
      ref,
      () => ({
        goToNext,
        goToPrev,
      }),
      [goToNext, goToPrev],
    );

    // Keep local direction/prevIndex in sync even if parent changes index externally
    // (e.g., via navigator buttons in layout).
    useEffect(() => {
      if (currentIndex === lastIndexRef.current) return;

      const last = lastIndexRef.current;
      const next = currentIndex;

      setPrevIndex(last);

      const dir: Direction = next > last ? 1 : -1;
      setDirection(dir);

      transitionKeyRef.current += 1;
      lastIndexRef.current = next;
    }, [currentIndex]);

    // Wheel navigation (desktop)
    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;

      let throttled = false;

      const onWheel = (e: WheelEvent) => {
        // Prevent page scroll
        e.preventDefault();
        if (throttled) return;

        if (e.deltaY > 50) {
          goToNext();
          throttled = true;
          setTimeout(() => (throttled = false), 650);
        } else if (e.deltaY < -50) {
          goToPrev();
          throttled = true;
          setTimeout(() => (throttled = false), 650);
        }
      };

      el.addEventListener("wheel", onWheel, { passive: false });
      return () => el.removeEventListener("wheel", onWheel);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, videos.length]);

    // Keyboard navigation
    useEffect(() => {
      const onKeyDown = (e: KeyboardEvent) => {
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
    }, [currentIndex, videos.length]);

    // Touch navigation (mobile)
    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;

      let startY = 0;
      let throttled = false;

      const onTouchStart = (e: TouchEvent) => {
        startY = e.touches[0]?.clientY ?? 0;
      };

      const onTouchEnd = (e: TouchEvent) => {
        if (throttled) return;

        const endY = e.changedTouches[0]?.clientY ?? 0;
        const diff = startY - endY; // positive = swipe up
        const threshold = 50;

        if (diff > threshold) {
          goToNext();
          throttled = true;
          setTimeout(() => (throttled = false), 650);
        } else if (diff < -threshold) {
          goToPrev();
          throttled = true;
          setTimeout(() => (throttled = false), 650);
        }
      };

      el.addEventListener("touchstart", onTouchStart, { passive: true });
      el.addEventListener("touchend", onTouchEnd, { passive: true });

      return () => {
        el.removeEventListener("touchstart", onTouchStart);
        el.removeEventListener("touchend", onTouchEnd);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, videos.length]);

    // Drag navigation (drag only the current card)
    const handleDragEnd = (
      _: unknown,
      info: { offset: { y: number }; velocity: { y: number } },
    ) => {
      const threshold = 140;
      const v = info.velocity.y;

      if (info.offset.y < -threshold || v < -700) {
        goToNext();
      } else if (info.offset.y > threshold || v > 700) {
        goToPrev();
      }
    };

    const currentVideo = videos[currentIndex] ?? null;
    const prevVideo =
      prevIndex !== null && prevIndex >= 0 && prevIndex < videos.length
        ? videos[prevIndex]
        : null;

    const slides = useMemo(() => {
      const items: Array<{
        kind: "prev" | "current";
        video: Video;
        index: number;
      }> = [];

      if (
        prevVideo &&
        prevIndex !== null &&
        prevIndex !== currentIndex &&
        prevIndex >= 0 &&
        prevIndex < videos.length
      ) {
        items.push({ kind: "prev", video: prevVideo, index: prevIndex });
      }

      if (currentVideo) {
        items.push({
          kind: "current",
          video: currentVideo,
          index: currentIndex,
        });
      }

      return items;
    }, [prevVideo, prevIndex, currentVideo, currentIndex, videos.length]);

    if (!currentVideo) {
      return (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          没有视频
        </div>
      );
    }

    // More obvious edge-to-edge travel.
    const containerHeight =
      containerRef.current?.getBoundingClientRect().height ?? 0;

    // Add a small gap so the incoming and outgoing cards don't "kiss" at the midpoint.
    // This slightly increases the travel distance in both directions.
    const TRANSITION_GAP_PX = 16;

    const travelY = Math.max(containerHeight, 700) + TRANSITION_GAP_PX;

    // direction 1 (next): current enters from bottom; prev exits to top
    // direction -1 (prev): current enters from top; prev exits to bottom
    const currentStartY = direction === 1 ? travelY : -travelY;
    const prevExitY = direction === 1 ? -travelY : travelY;

    return (
      <div
        ref={containerRef}
        className="relative h-full w-full min-h-0 overflow-visible"
      >
        {/* Mask only the actual feed viewport, not the stage bleed area */}
        <div className="relative h-full w-full min-h-0 overflow-hidden">
          {slides.map((s) => {
            const isCurrent = s.kind === "current";
            const activeTransitionKey = transitionKeyRef.current;

            const hasPrev =
              prevVideo && prevIndex !== null && prevIndex !== currentIndex;

            // IMPORTANT:
            // - Current card enters from outside (currentStartY) when transitioning.
            // - Previous card simultaneously leaves to prevExitY.
            const initial = hasPrev
              ? { y: isCurrent ? currentStartY : 0, opacity: 1 }
              : { y: 0, opacity: 1 };

            const animate = hasPrev
              ? { y: isCurrent ? 0 : prevExitY, opacity: 1 }
              : { y: 0, opacity: 1 };

            return (
              <motion.div
                key={`${s.kind}-${s.video.id}-${s.index}`}
                className="absolute inset-0"
                style={{ zIndex: isCurrent ? 2 : 1 }}
                initial={initial}
                animate={animate}
                transition={{
                  // Linear tween: constant-speed slide (requested)
                  y: { type: "tween", ease: "easeInOut", duration: 0.25 },
                  opacity: { type: "tween", ease: "easeInOut", duration: 0.25 },
                }}
                drag={isCurrent ? "y" : false}
                dragConstraints={isCurrent ? { top: 0, bottom: 0 } : undefined}
                dragElastic={isCurrent ? 0.08 : undefined}
                onDragEnd={isCurrent ? handleDragEnd : undefined}
                onAnimationComplete={() => {
                  // After the transition completes, drop the previous card.
                  if (!isCurrent) return;
                  if (transitionKeyRef.current !== activeTransitionKey) return;
                  setPrevIndex(null);
                  setDirection(0);
                }}
              >
                <ShortCard
                  video={s.video}
                  isActive={isCurrent}
                  onLike={onLike}
                  onComment={onComment}
                  onBookmark={onBookmark}
                  onShare={onShare}
                  onFollow={onFollow}
                  className="h-full w-full"
                >
                  <div className="pointer-events-none absolute left-4 top-4 z-30 rounded bg-black/70 px-2 py-1 text-xs text-white">
                    {s.index + 1} / {videos.length}
                  </div>
                </ShortCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  },
);
