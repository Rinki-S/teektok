"use client";

import { useState, createContext, useContext } from "react";

interface VideoNavigationContextType {
  currentIndex: number;
  totalVideos: number;
  goToNext: () => void;
  goToPrevious: () => void;
  setCurrentIndex: (index: number) => void;
  setTotalVideos: (total: number) => void;
}

const VideoNavigationContext = createContext<VideoNavigationContextType | null>(
  null
);

export function useVideoNavigation() {
  const context = useContext(VideoNavigationContext);
  if (!context) {
    throw new Error(
      "useVideoNavigation must be used within VideoNavigationProvider"
    );
  }
  return context;
}

export function VideoNavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalVideos, setTotalVideos] = useState(0);

  const goToNext = () => {
    if (currentIndex < totalVideos - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <VideoNavigationContext.Provider
      value={{
        currentIndex,
        totalVideos,
        goToNext,
        goToPrevious,
        setCurrentIndex,
        setTotalVideos,
      }}
    >
      {children}
    </VideoNavigationContext.Provider>
  );
}
