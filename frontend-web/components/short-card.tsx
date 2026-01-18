"use client";

import React from "react";
import type { Video } from "@/types/video";
import { VideoItem } from "@/components/video-item";
import { ShortsActions } from "@/components/shorts-actions";

export interface ShortCardProps {
  video: Video;
  isActive: boolean;

  // Actions
  onLike: (videoId: string, isLiked: boolean) => void;
  onComment: (videoId: string) => void;
  onBookmark: (videoId: string, isBookmarked: boolean) => void;
  onShare: (videoId: string) => void;
  onFollow: (userId: string, isFollowing: boolean) => void;

  /**
   * Optional extra overlay content to render on top of the card
   * (e.g. debug, badges, etc.)
   */
  children?: React.ReactNode;

  /**
   * Optional className to tweak sizing/spacing externally.
   * The card is intended to stretch to fill its parent.
   */
  className?: string;
}

/**
 * ShortCard
 *
 * A single "page" / "card" in the shorts feed.
 * This component owns:
 * - the rounded container (NOT the layout)
 * - the video area
 * - overlays (info + actions)
 *
 * The feed should animate/slide this entire card as a unit.
 */
export function ShortCard({
  video,
  isActive,
  onLike,
  onComment,
  onBookmark,
  onShare,
  onFollow,
  children,
  className,
}: ShortCardProps) {
  return (
    <div
      className={[
        "relative flex h-full w-full min-h-0 flex-1 overflow-hidden rounded-t-3xl md:rounded-3xl",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Video fills the whole card; VideoItem already renders author/description overlay. */}
      <div className="relative h-[calc(100%-16px)] w-full min-h-0 flex-1 overflow-hidden bg-black rounded-t-3xl md:rounded-3xl">
        <VideoItem video={video} isActive={isActive} onLike={onLike} />

        {/* Actions overlay (right side, inside this card) */}
        <div
          className="absolute bottom-4 right-4 z-20"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <ShortsActions
            video={video}
            onLike={onLike}
            onComment={onComment}
            onBookmark={onBookmark}
            onShare={onShare}
            onFollow={onFollow}
          />
        </div>

        {/* Optional custom overlay content */}
        {children ? (
          <div className="pointer-events-none absolute inset-0 z-30">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}
