"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bookmark, Heart, MessageCircle, Plus, Share2 } from "lucide-react";
import type { Video } from "@/types/video";
import { cn } from "@/lib/utils";
import { CommentsSheet } from "@/components/comments-sheet";

interface ShortsActionsProps {
  video: Video;
  onLike: (videoId: string, isLiked: boolean) => void;
  onComment: (videoId: string) => void;
  onBookmark: (videoId: string, isBookmarked: boolean) => void;
  onShare: (videoId: string) => void;
  onFollow: (userId: string, isFollowing: boolean) => void;
}

export function ShortsActions({
  video,
  onLike,
  onComment,
  onBookmark,
  onShare,
  onFollow,
}: ShortsActionsProps) {
  const [isLiked, setIsLiked] = useState(video.isLiked || false);
  const [isBookmarked, setIsBookmarked] = useState(video.isBookmarked || false);
  const [isFollowing, setIsFollowing] = useState(
    video.author.isFollowing || false,
  );
  const [likesCount, setLikesCount] = useState(video.stats.likes);

  const handleLike = () => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikesCount((prev) => (newLikedState ? prev + 1 : prev - 1));
    onLike(video.id, newLikedState);
  };

  const handleBookmark = () => {
    const newBookmarkedState = !isBookmarked;
    setIsBookmarked(newBookmarkedState);
    onBookmark(video.id, newBookmarkedState);
  };

  const handleFollow = () => {
    const newFollowingState = !isFollowing;
    setIsFollowing(newFollowingState);
    onFollow(video.author.id, newFollowingState);
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + "M";
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + "K";
    }
    return count.toString();
  };

  return (
    <div className="flex flex-col items-center gap-2 p-4 rounded-2xl">
      {/* 作者头像 + 关注按钮 */}
      <div className="relative flex flex-col items-center mb-4">
        <Avatar className="w-14 h-14 border-2 border-primary">
          {video.author.avatarUrl && (
            <AvatarImage
              src={video.author.avatarUrl}
              alt={video.author.username}
            />
          )}
          <AvatarFallback>
            {video.author.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {!isFollowing && (
          <Button
            size="icon-xs"
            className="absolute bottom-0 translate-y-1/2 rounded-full"
            onClick={handleFollow}
          >
            <Plus strokeWidth={4} />
          </Button>
        )}
      </div>

      {/* 点赞 */}
      <div className="flex flex-col items-center">
        <Button
          variant="ghost"
          className="rounded-full w-14 h-14"
          onClick={handleLike}
        >
          <Heart
            className={cn("size-8", isLiked && "fill-red-500 text-red-500")}
          />
        </Button>
        <div className="text-center text-[16px] font-bold mt-1">
          {formatCount(likesCount)}
        </div>
      </div>

      {/* 评论 */}
      <div className="flex flex-col items-center">
        <CommentsSheet videoId={video.id} triggerAsChild>
          <Button
            variant="ghost"
            className="rounded-full w-14 h-14"
            onClick={() => onComment(video.id)}
          >
            <MessageCircle className="size-8" />
          </Button>
        </CommentsSheet>
        <div className="text-center text-[16px] font-bold mt-1">
          {formatCount(video.stats.comments)}
        </div>
      </div>

      {/* 收藏 */}
      <div className="flex flex-col items-center">
        <Button
          variant="ghost"
          className="rounded-full w-14 h-14"
          onClick={handleBookmark}
        >
          <Bookmark
            className={cn(
              "size-8",
              isBookmarked && "fill-yellow-500 text-yellow-500",
            )}
          />
        </Button>
        <div className="text-center text-[16px] font-bold mt-1">收藏</div>
      </div>

      {/* 分享 */}
      <div className="flex flex-col items-center">
        <Button
          variant="ghost"
          className="rounded-full w-14 h-14"
          onClick={() => onShare(video.id)}
        >
          <Share2 className="size-8" />
        </Button>
        <div className="text-center text-[16px] font-bold mt-1">分享</div>
      </div>
    </div>
  );
}
