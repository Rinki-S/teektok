"use client";

import { useState, useEffect, useCallback } from "react";
import type { Video } from "@/types/video";
import {
  getVideoFeed,
  toggleLikeVideo,
  toggleBookmarkVideo,
  toggleFollowUser,
  shareVideo,
  incrementVideoView,
} from "@/services/videoService";

interface UseVideoFeedReturn {
  videos: Video[];
  currentIndex: number;
  isLoading: boolean;
  error: string | null;
  handleLike: (videoId: string, isLiked: boolean) => Promise<void>;
  handleBookmark: (videoId: string, isBookmarked: boolean) => Promise<void>;
  handleFollow: (userId: string, isFollowing: boolean) => Promise<void>;
  handleShare: (videoId: string) => Promise<void>;
  handleComment: (videoId: string) => void;
  setCurrentIndex: (index: number) => void;
  loadMoreVideos: () => Promise<void>;
}

export function useVideoFeed(): UseVideoFeedReturn {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);

  // 初始加载视频
  useEffect(() => {
    loadVideos();
  }, []);

  // 当前视频变化时，记录播放次数
  useEffect(() => {
    if (videos[currentIndex]) {
      incrementVideoView(videos[currentIndex].id).catch((err) => {
        console.error("Failed to increment view:", err);
      });
    }
  }, [currentIndex, videos]);

  // 加载视频列表
  const loadVideos = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // TODO: 这里调用实际的 API
      const response = await getVideoFeed(undefined, 10);

      setVideos(response.videos);
      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load videos");
      console.error("Error loading videos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 加载更多视频
  const loadMoreVideos = async () => {
    if (!hasMore || isLoading) return;

    try {
      setIsLoading(true);

      // TODO: 使用 nextCursor 加载下一页
      const response = await getVideoFeed(nextCursor, 10);

      setVideos((prev) => [...prev, ...response.videos]);
      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);
    } catch (err) {
      console.error("Error loading more videos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理点赞
  const handleLike = useCallback(
    async (videoId: string, isLiked: boolean) => {
      try {
        // 乐观更新 UI
        setVideos((prev) =>
          prev.map((video) =>
            video.id === videoId
              ? {
                  ...video,
                  isLiked,
                  stats: {
                    ...video.stats,
                    likes: video.stats.likes + (isLiked ? 1 : -1),
                  },
                }
              : video
          )
        );

        // TODO: 调用后端 API
        await toggleLikeVideo({ videoId, isLiked });
      } catch (err) {
        console.error("Failed to toggle like:", err);

        // 回滚
        setVideos((prev) =>
          prev.map((video) =>
            video.id === videoId
              ? {
                  ...video,
                  isLiked: !isLiked,
                  stats: {
                    ...video.stats,
                    likes: video.stats.likes + (isLiked ? -1 : 1),
                  },
                }
              : video
          )
        );
      }
    },
    []
  );

  // 处理收藏
  const handleBookmark = useCallback(
    async (videoId: string, isBookmarked: boolean) => {
      try {
        // 乐观更新 UI
        setVideos((prev) =>
          prev.map((video) =>
            video.id === videoId ? { ...video, isBookmarked } : video
          )
        );

        // TODO: 调用后端 API
        await toggleBookmarkVideo({ videoId, isBookmarked });
      } catch (err) {
        console.error("Failed to toggle bookmark:", err);

        // 回滚
        setVideos((prev) =>
          prev.map((video) =>
            video.id === videoId
              ? { ...video, isBookmarked: !isBookmarked }
              : video
          )
        );
      }
    },
    []
  );

  // 处理关注
  const handleFollow = useCallback(
    async (userId: string, isFollowing: boolean) => {
      try {
        // 乐观更新 UI
        setVideos((prev) =>
          prev.map((video) =>
            video.author.id === userId
              ? {
                  ...video,
                  author: { ...video.author, isFollowing },
                }
              : video
          )
        );

        // TODO: 调用后端 API
        await toggleFollowUser({ userId, isFollowing });
      } catch (err) {
        console.error("Failed to toggle follow:", err);

        // 回滚
        setVideos((prev) =>
          prev.map((video) =>
            video.author.id === userId
              ? {
                  ...video,
                  author: { ...video.author, isFollowing: !isFollowing },
                }
              : video
          )
        );
      }
    },
    []
  );

  // 处理分享
  const handleShare = useCallback(async (videoId: string) => {
    try {
      // TODO: 调用后端 API 记录分享
      await shareVideo(videoId);

      // TODO: 实现真实的分享功能（调用系统分享 API 或显示分享面板）
      if (navigator.share) {
        const video = videos.find((v) => v.id === videoId);
        if (video) {
          await navigator.share({
            title: video.title,
            text: video.description,
            url: window.location.href,
          });
        }
      } else {
        // 降级方案：复制链接到剪贴板
        await navigator.clipboard.writeText(window.location.href);
        alert("链接已复制到剪贴板！");
      }

      // 更新分享计数
      setVideos((prev) =>
        prev.map((video) =>
          video.id === videoId
            ? {
                ...video,
                stats: {
                  ...video.stats,
                  shares: video.stats.shares + 1,
                },
              }
            : video
        )
      );
    } catch (err) {
      console.error("Failed to share video:", err);
    }
  }, [videos]);

  // 处理评论
  const handleComment = useCallback((videoId: string) => {
    // TODO: 打开评论面板或跳转到评论页面
    console.log("Open comments for video:", videoId);
    alert(`评论功能开发中，视频 ID: ${videoId}`);
  }, []);

  return {
    videos,
    currentIndex,
    isLoading,
    error,
    handleLike,
    handleBookmark,
    handleFollow,
    handleShare,
    handleComment,
    setCurrentIndex,
    loadMoreVideos,
  };
}
