"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useVideoFeed } from "@/hooks/use-video-feed";
import { VideoFeed } from "@/components/video-feed";
import { Loader2 } from "lucide-react";

export default function VideoDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const {
    videos,
    currentIndex,
    isLoading,
    error,
    handleLike,
    handleBookmark,
    handleFollow,
    handleShare,
    handleComment,
    handleCommentCreated,
    handleCommentCountChange,
    setCurrentIndex,
  } = useVideoFeed(id);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
        未找到视频
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 overflow-hidden bg-sidebar">
      <div className="relative flex h-full min-h-0 w-full flex-1 md:pr-4">
        <VideoFeed
          videos={videos}
          currentIndex={currentIndex}
          onIndexChange={setCurrentIndex}
          onLike={handleLike}
          onBookmark={handleBookmark}
          onFollow={handleFollow}
          onShare={handleShare}
          onComment={handleComment}
          onCommentCreated={handleCommentCreated}
          onCommentCountChange={handleCommentCountChange}
        />
      </div>
    </div>
  );
}
