"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Play } from "lucide-react";
import type { Video } from "@/types/video";
import { incrementVideoView, getCurrentUserId } from "@/services/videoService";
import { toast } from "sonner";
import Link from "next/link";

interface VideoItemProps {
  video: Video;
  isActive: boolean;
  onLike: (videoId: string, isLiked: boolean) => void;
}

export function VideoItem({ video, isActive, onLike }: VideoItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [showHeart, setShowHeart] = useState(false);
  // 移除 isLiked 本地状态，直接使用 video.isLiked
  const isLiked = video.isLiked || false;
  const [isPaused, setIsPaused] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const scrubPointerIdRef = useRef<number | null>(null);
  const clickTimerRef = useRef<number | null>(null);
  const wasPlayingRef = useRef(false);
  const hasCountedPlayRef = useRef(false);

  // 浏览器自动播放限制处理：
  // - 初始尝试自动播放（muted），失败则等待用户交互后再播放
  // - 用户首次交互后，会尝试解除静音并播放（如果策略允许）
  const interactionUnlockedRef = useRef(false);
  const pendingPlayRef = useRef(false);

  const tryPlay = async (opts?: { muted?: boolean }) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (typeof opts?.muted === "boolean") {
      videoElement.muted = opts.muted;
    }

    try {
      await videoElement.play();
      pendingPlayRef.current = false;
    } catch (err) {
      pendingPlayRef.current = true;
      console.warn("Autoplay blocked; waiting for user interaction.", err);
    }
  };

  const seekToClientX = useCallback((clientX: number) => {
    const videoElement = videoRef.current;
    const bar = progressBarRef.current;
    if (!videoElement || !bar) return;
    if (!videoElement.duration || !Number.isFinite(videoElement.duration)) return;

    const rect = bar.getBoundingClientRect();
    if (rect.width <= 0) return;

    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    videoElement.currentTime = ratio * videoElement.duration;
    setProgress(ratio);
  }, []);

  useEffect(() => {
    return () => {
      if (clickTimerRef.current !== null) {
        window.clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
    };
  }, []);

  // 自动播放/暂停逻辑（带自动播放限制处理）
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isActive) {
      // 先尝试静音自动播放（更容易通过浏览器策略）
      void tryPlay({ muted: true });
    } else {
      videoElement.pause();
      pendingPlayRef.current = false;
    }
  }, [isActive]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const onPlay = () => setIsPaused(false);
    const onPause = () => setIsPaused(true);
    const updateProgress = () => {
      if (!videoElement.duration || !Number.isFinite(videoElement.duration)) {
        setProgress(0);
        return;
      }
      const next = Math.min(
        1,
        Math.max(0, videoElement.currentTime / videoElement.duration),
      );
      setProgress(next);
    };

    videoElement.addEventListener("play", onPlay);
    videoElement.addEventListener("pause", onPause);
    videoElement.addEventListener("timeupdate", updateProgress);
    videoElement.addEventListener("durationchange", updateProgress);
    videoElement.addEventListener("loadedmetadata", updateProgress);
    videoElement.addEventListener("ended", updateProgress);

    return () => {
      videoElement.removeEventListener("play", onPlay);
      videoElement.removeEventListener("pause", onPause);
      videoElement.removeEventListener("timeupdate", updateProgress);
      videoElement.removeEventListener("durationchange", updateProgress);
      videoElement.removeEventListener("loadedmetadata", updateProgress);
      videoElement.removeEventListener("ended", updateProgress);
    };
  }, []);

  useEffect(() => {
    hasCountedPlayRef.current = false;
  }, [video.id]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const onPlay = () => {
      if (!isActive) return;
      if (hasCountedPlayRef.current) return;

      hasCountedPlayRef.current = true;
      incrementVideoView(video.id).catch((error) => {
        console.error("incrementVideoView failed", error);
      });
    };

    const onEnded = () => {
      if (!isActive) return;
      hasCountedPlayRef.current = false;
      videoElement.currentTime = 0;
      void tryPlay();
    };

    videoElement.addEventListener("play", onPlay);
    videoElement.addEventListener("ended", onEnded);

    return () => {
      videoElement.removeEventListener("play", onPlay);
      videoElement.removeEventListener("ended", onEnded);
    };
  }, [isActive, video.id]);

  // 监听用户首次交互：解锁后若当前视频需要播放，则尝试播放
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (interactionUnlockedRef.current) return;
      interactionUnlockedRef.current = true;

      const videoElement = videoRef.current;
      if (!videoElement) return;

      // 如果当前处于 active 且之前播放被拦截，则再尝试播放
      if (isActive && pendingPlayRef.current) {
        void tryPlay({ muted: false });
      }
    };

    // 捕获阶段以确保尽早拿到用户手势
    window.addEventListener("pointerdown", handleFirstInteraction, true);
    window.addEventListener("touchstart", handleFirstInteraction, true);
    window.addEventListener("keydown", handleFirstInteraction, true);

    return () => {
      window.removeEventListener("pointerdown", handleFirstInteraction, true);
      window.removeEventListener("touchstart", handleFirstInteraction, true);
      window.removeEventListener("keydown", handleFirstInteraction, true);
    };
  }, [isActive]);

  const handleSingleTap = () => {
    if (!isActive) return;

    if (clickTimerRef.current !== null) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }

    clickTimerRef.current = window.setTimeout(() => {
      clickTimerRef.current = null;
      const videoElement = videoRef.current;
      if (!videoElement) return;

      interactionUnlockedRef.current = true;

      if (videoElement.paused) {
        setIsPaused(false);
        void tryPlay({ muted: false });
        return;
      }

      videoElement.pause();
      pendingPlayRef.current = false;
      setIsPaused(true);
    }, 240);
  };

  // 双击点赞处理
  const handleDoubleTap = () => {
    if (clickTimerRef.current !== null) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }

    handleLike();
    // 双击即使未登录也显示爱心动画，增强趣味性，或者你可以选择不显示
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 1000);

    // 双击也算用户交互：顺便确保视频能播放（若之前被拦截）
    if (isActive && pendingPlayRef.current) {
      void tryPlay({ muted: false });
    }
  };

  const handleLike = () => {
    if (!getCurrentUserId()) {
      toast.error("请先登录");
      return;
    }
    const newLikedState = !isLiked;
    // setIsLiked(newLikedState); // 移除本地更新
    onLike(video.id, newLikedState);
  };

  const handleScrubStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isActive) return;
    const videoElement = videoRef.current;
    if (!videoElement) return;

    // 阻止事件冒泡和默认行为，防止触发父组件（VideoFeed）的拖拽翻页
    e.preventDefault();
    e.stopPropagation();
    // 关键：阻止原生事件冒泡，防止 Framer Motion 通过原生监听捕获到事件
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation();
    }

    interactionUnlockedRef.current = true;
    wasPlayingRef.current = !videoElement.paused;
    videoElement.pause();

    setIsScrubbing(true);
    seekToClientX(e.clientX);

    // 使用全局监听替代 setPointerCapture，以确保在任何位置松开鼠标都能正确结束
    const handleWindowPointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();
      seekToClientX(moveEvent.clientX);
    };

    const handleWindowPointerUp = (upEvent: PointerEvent) => {
      upEvent.preventDefault();
      upEvent.stopPropagation();
      
      setIsScrubbing(false);
      
      // 清理全局监听
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerUp);

      const el = videoRef.current;
      if (!el) return;

      if (wasPlayingRef.current) {
        void tryPlay({ muted: false });
      }
    };

    window.addEventListener("pointermove", handleWindowPointerMove, { passive: false });
    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerUp);
  };

  // 移除不再需要的局部事件处理器
  // const handleScrubMove = ... 
  // const handleScrubEnd = ...

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      {/* 视频 */}
      <motion.div
        className="relative w-full h-full"
        onDoubleClick={handleDoubleTap}
        onClick={handleSingleTap}
      >
        <video
          ref={videoRef}
          src={video.videoUrl}
          playsInline
          muted
          className="w-full h-full object-contain"
          style={{ maxHeight: "100%", maxWidth: "100%" }}
        />

        <AnimatePresence>
          {isActive && isPaused && !isScrubbing ? (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <div className="rounded-full bg-black/50 p-4 backdrop-blur-sm">
                <Play className="h-10 w-10 text-white" fill="white" />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {isActive ? (
          <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-2">
            <div
              ref={progressBarRef}
              role="slider"
              aria-label="视频进度"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
              tabIndex={-1}
              className="h-[10px] w-full touch-none flex items-center"
              onPointerDown={handleScrubStart}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <div className="h-[2px] w-full rounded-full bg-white/30">
              <div
                className="h-full rounded-full bg-white"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
              </div>
            </div>
          </div>
        ) : null}

        {/* 双击点赞动画 */}
        <AnimatePresence>
          {showHeart && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 1.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <Heart
                className="w-32 h-32"
                fill="white"
                stroke="white"
                strokeWidth={1}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 视频信息（左下角） */}
      <div className="absolute bottom-12 left-4 right-24 text-white z-10 pointer-events-none">
        <div className="space-y-2 pointer-events-auto">
          <div className="flex items-center gap-2 mb-2">
            <Link
              href={`/user/${video.author.id}`}
              className="font-bold text-lg drop-shadow-md"
              onClick={(e) => e.stopPropagation()}
            >
              @{video.author.username}
            </Link>
          </div>
          <h3 className="font-bold text-base mb-1 drop-shadow-md">
            {video.title}
          </h3>
          {video.description && (
            <p className="text-sm line-clamp-2 text-gray-100 drop-shadow-md">
              {video.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
