"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import type { Video } from "@/types/video";

interface VideoItemProps {
  video: Video;
  isActive: boolean;
  onLike: (videoId: string, isLiked: boolean) => void;
}

export function VideoItem({ video, isActive, onLike }: VideoItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showHeart, setShowHeart] = useState(false);
  const [isLiked, setIsLiked] = useState(video.isLiked || false);

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

  // 双击点赞处理
  const handleDoubleTap = () => {
    handleLike();
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 1000);

    // 双击也算用户交互：顺便确保视频能播放（若之前被拦截）
    if (isActive && pendingPlayRef.current) {
      void tryPlay({ muted: false });
    }
  };

  const handleLike = () => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    onLike(video.id, newLikedState);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black">
      {/* 视频 */}
      <motion.div
        className="relative w-full h-full"
        onDoubleClick={handleDoubleTap}
      >
        <video
          ref={videoRef}
          src={video.videoUrl}
          loop
          playsInline
          muted
          className="w-full h-full object-contain"
          style={{ maxHeight: "100%", maxWidth: "100%" }}
        />

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
      <div className="absolute bottom-20 left-4 right-24 text-white z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-bold">@{video.author.username}</span>
          </div>
          {video.description && (
            <p className="text-sm line-clamp-2">{video.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
