"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bookmark, Heart, MessageCircle, Plus, Share2 } from "lucide-react";
import type { Video } from "@/types/video";
import { cn } from "@/lib/utils";
import { CommentsSheet } from "@/components/comments-sheet";
import { ShareSheet } from "@/components/share-sheet";
import { toast } from "sonner";
import { getCurrentUserId } from "@/services/videoService";
import Link from "next/link";

interface ShortsActionsProps {
  video: Video;
  onLike: (videoId: string, isLiked: boolean) => void;
  onComment: (videoId: string) => void;
  onCommentCreated?: (videoId: string) => void;
  onCommentCountChange?: (videoId: string, total: number) => void;
  onBookmark: (videoId: string, isBookmarked: boolean) => void;
  onShare: (videoId: string) => void;
  onFollow: (userId: string, isFollowing: boolean) => void;
}

export function ShortsActions({
  video,
  onLike,
  onComment,
  onCommentCreated,
  onCommentCountChange,
  onBookmark,
  onShare,
  onFollow,
}: ShortsActionsProps) {
  // 直接使用 video props 渲染，移除本地状态，确保父组件回滚时 UI 同步
  const isLiked = video.isLiked || false;
  const isBookmarked = video.isBookmarked || false;
  const isFollowing = video.author.isFollowing || false;
  const isSelf = getCurrentUserId() === video.author.id;
  const likesCount = video.stats.likes;
  const sharesCount = video.stats.shares;
  
  const [isShareSheetOpen, setIsShareSheetOpen] = useState(false);

  const checkLogin = () => {
    if (!getCurrentUserId()) {
      toast.error("请先登录");
      return false;
    }
    return true;
  };

  const handleLike = () => {
    if (!checkLogin()) return;
    onLike(video.id, !isLiked);
  };

  const handleBookmark = () => {
    if (!checkLogin()) return;
    onBookmark(video.id, !isBookmarked);
  };

  const handleFollow = () => {
    if (!checkLogin()) return;
    onFollow(video.author.id, !isFollowing);
  };

  const handleShareAction = () => {
    // 分享通常不需要登录，或者视业务而定。这里暂时保留原逻辑，不强制登录
    onShare(video.id);
    setIsShareSheetOpen(false);
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/video/${video.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("链接已复制到剪贴板！");
      handleShareAction();
    } catch (err) {
      console.error("Failed to copy link:", err);
      toast.error("复制失败");
    }
  };

  const handleShareToFriend = () => {
    // 模拟好友分享
    toast.success("已分享给好友 (模拟)");
    handleShareAction();
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
        <Link href={`/user/${video.author.id}`}>
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
        </Link>
        {!isFollowing && !isSelf && (
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
        <CommentsSheet
          videoId={video.id}
          triggerAsChild
          onCommentCreated={() => onCommentCreated?.(video.id)}
          onCommentCountChange={(total) => onCommentCountChange?.(video.id, total)}
        >
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
          onClick={() => setIsShareSheetOpen(true)}
        >
          <Share2 className="size-8" />
        </Button>
        <div className="text-center text-[16px] font-bold mt-1">
          {formatCount(sharesCount)}
        </div>
      </div>
      
      <ShareSheet
        isOpen={isShareSheetOpen}
        onOpenChange={setIsShareSheetOpen}
        onCopyLink={handleCopyLink}
        onShareToFriend={handleShareToFriend}
      />
    </div>
  );
}
