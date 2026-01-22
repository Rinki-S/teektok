"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  isLoadingMore: boolean;
  error: string | null;
  handleLike: (videoId: string, isLiked: boolean) => Promise<void>;
  handleBookmark: (videoId: string, isBookmarked: boolean) => Promise<void>;
  handleFollow: (userId: string, isFollowing: boolean) => Promise<void>;
  handleShare: (videoId: string) => Promise<void>;
  handleComment: (videoId: string) => void;
  handleCommentCreated: (videoId: string) => void;
  handleCommentCountChange: (videoId: string, total: number) => void;
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const refreshSeqRef = useRef(0);

  const loadVideos = useCallback(async () => {
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
  }, [feedType, initialVideoId]);

  useEffect(() => {
    void loadVideos();
  }, [loadVideos]);

  // 加载更多视频
  const loadMoreVideos = async () => {
    if (initialVideoId) return; // 单视频模式不加载更多
    if (isLoading || isLoadingMore) return;

    try {
      setIsLoadingMore(true);

      const refreshIfNeeded = async () => {
        if (feedType === "default") return;

        refreshSeqRef.current += 1;
        const refreshKey = `${Date.now()}-${refreshSeqRef.current}`;

        let refreshed;
        if (feedType === "recommend") {
          const userId = getCurrentUserId();
          if (userId) {
            refreshed = await getRecommendFeed(userId, undefined, 10, refreshKey);
          } else {
            refreshed = await getHotFeed(undefined, 10, refreshKey);
          }
        } else {
          refreshed = await getHotFeed(undefined, 10, refreshKey);
        }

        if (!refreshed.videos.length) {
          setHasMore(false);
          setNextCursor(undefined);
          return;
        }

        setVideos((prev) => {
          const seen = new Set(prev.map((v) => v.id));
          const merged = [...prev];
          let added = 0;
          for (const v of refreshed.videos) {
            if (!seen.has(v.id)) {
              seen.add(v.id);
              merged.push(v);
              added += 1;
            }
          }
          return added > 0 ? merged : [...prev, ...refreshed.videos];
        });
        setNextCursor(refreshed.nextCursor);
        setHasMore(refreshed.hasMore);
      };

      if (!hasMore) {
        await refreshIfNeeded();
        return;
      }

      let response;
      if (feedType === "recommend") {
        const userId = getCurrentUserId();
        if (userId) {
          response = await getRecommendFeed(userId, nextCursor, 10);
        } else {
          // 未登录则回退到热门列表
          response = await getHotFeed(nextCursor, 10);
        }
      } else if (feedType === "hot") {
        response = await getHotFeed(nextCursor, 10);
      } else {
        // 默认为 video feed
        response = await getVideoFeed(nextCursor, 10);
      }

      if (!response.videos.length) {
        await refreshIfNeeded();
        return;
      }

      setVideos((prev) => {
        const seen = new Set(prev.map((v) => v.id));
        const merged = [...prev];
        let added = 0;
        for (const v of response.videos) {
          if (!seen.has(v.id)) {
            seen.add(v.id);
            merged.push(v);
            added += 1;
          }
        }
        return added > 0 ? merged : [...prev, ...response.videos];
      });
      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);
    } catch (err) {
      console.error("Error loading more videos:", err);
    } finally {
      setIsLoadingMore(false);
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

  const handleCommentCreated = useCallback((videoId: string) => {
    setVideos((prev) =>
      prev.map((video) =>
        video.id === videoId
          ? {
              ...video,
              stats: {
                ...video.stats,
                comments: (video.stats.comments || 0) + 1,
              },
            }
          : video,
      ),
    );
  }, []);

  const handleCommentCountChange = useCallback((videoId: string, total: number) => {
    if (!Number.isFinite(total) || total < 0) return;
    setVideos((prev) =>
      prev.map((video) =>
        video.id === videoId
          ? {
              ...video,
              stats: {
                ...video.stats,
                comments: total,
              },
            }
          : video,
      ),
    );
  }, []);

  return {
    videos,
    currentIndex,
    isLoading,
    isLoadingMore,
    error,
    handleLike,
    handleBookmark,
    handleFollow,
    handleShare,
    handleComment,
    handleCommentCreated,
    handleCommentCountChange,
    setCurrentIndex,
    loadMoreVideos,
  };
}
