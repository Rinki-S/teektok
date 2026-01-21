"use client";

import { useState, useEffect, useCallback } from "react";
import type { Video } from "@/types/video";
import {
  getVideoFeed,
  getRecommendFeed,
  getHotFeed,
  getCurrentUserId,
  getVideoById,
  toggleLikeVideo,
  toggleBookmarkVideo,
  toggleFollowUser,
  shareVideo,
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

export function useVideoFeed(
  initialVideoId?: string,
  feedType: "default" | "recommend" | "hot" = "default"
): UseVideoFeedReturn {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);

  // 初始加载视频
  useEffect(() => {
    loadVideos();
  }, [initialVideoId]);

  // 加载视频列表
  const loadVideos = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (initialVideoId) {
        // 单视频模式
        const video = await getVideoById(initialVideoId);
        setVideos([video]);
        setHasMore(false);
      } else {
        // 列表模式
        let response;
        if (feedType === "recommend") {
          const userId = getCurrentUserId();
          if (userId) {
            response = await getRecommendFeed(userId);
          } else {
            // 未登录则回退到热门列表（之前是默认列表，现在统一用热门）
            response = await getHotFeed();
          }
        } else if (feedType === "hot") {
          response = await getHotFeed();
        } else {
          // 默认为 video feed
          response = await getVideoFeed(undefined, 10);
        }

        setVideos(response.videos);
        setNextCursor(response.nextCursor);
        setHasMore(response.hasMore);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load videos");
      console.error("Error loading videos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 加载更多视频
  const loadMoreVideos = async () => {
    if (initialVideoId) return; // 单视频模式不加载更多
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

  // 处理分享（仅记录行为和更新计数）
  const handleShare = useCallback(async (videoId: string) => {
    try {
      // 调用后端 API 记录分享
      await shareVideo(videoId);

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
  }, []);

  // 处理评论
  const handleComment = useCallback((videoId: string) => {
    // 评论功能已通过 ShortsActions 中的 CommentsSheet 组件实现
    // 此处仅保留日志，或用于打点统计
    console.log("Comment section opened for video:", videoId);
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
