"use client";

import * as React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSkeleton, VideoGridSkeleton } from "@/components/skeletons";
import { getCurrentUserId, getUserProfile, getUserVideos, toggleFollowUser } from "@/services/videoService";
import type { Video } from "@/types/video";
import { Button } from "@/components/ui/button";

type TabKey = "works";

export function UserProfileClient({ userId }: { userId: string }) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [profile, setProfile] = React.useState<{
    id: number;
    username: string;
    avatar?: string;
    followingCount?: number;
    followerCount?: number;
    likeCount?: number;
    isFollowing?: boolean;
  } | null>(null);

  const [worksVideos, setWorksVideos] = React.useState<Video[]>([]);
  const [isLoadingList, setIsLoadingList] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<TabKey>("works");

  React.useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError(null);
    getUserProfile(userId)
      .then((data) => {
        if (!mounted) return;
        setProfile(data || null);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "加载失败");
      })
      .finally(() => {
        if (!mounted) return;
        setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [userId]);

  React.useEffect(() => {
    let mounted = true;
    setIsLoadingList(true);
    getUserVideos(userId, 1, 30)
      .then(({ list }) => {
        if (!mounted) return;
        setWorksVideos(list);
      })
      .catch(() => {})
      .finally(() => {
        if (!mounted) return;
        setIsLoadingList(false);
      });
    return () => {
      mounted = false;
    };
  }, [userId, activeTab]);

  const handleToggleFollow = async () => {
    if (!profile) return;
    if (!getCurrentUserId()) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("teektok:open-login"));
      }
      return;
    }
    const next = !Boolean(profile.isFollowing);
    setProfile((prev) => (prev ? { ...prev, isFollowing: next } : prev));
    try {
      await toggleFollowUser({ userId: String(profile.id), isFollowing: next });
    } catch (e) {
      setProfile((prev) => (prev ? { ...prev, isFollowing: !next } : prev));
    }
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <div className="flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center bg-sidebar px-6 text-center">
        <h1 className="text-xl font-semibold">用户不存在</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error || "未找到该用户"}</p>
        <Link
          href="/"
          className="mt-6 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          返回首页
        </Link>
      </div>
    );
  }

  const finalName = profile.username || "用户";
  const finalAvatar = profile.avatar || "";
  const followingCount = profile.followingCount ?? 0;
  const followerCount = profile.followerCount ?? 0;
  const likeCount = profile.likeCount ?? 0;
  const isSelf = getCurrentUserId() === String(profile.id);

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col items-center overflow-hidden bg-sidebar px-6 py-8">
      <div className="w-full max-w-4xl flex flex-col h-full">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start flex-none">
          <Avatar size="lg" className="h-20 w-20">
            <AvatarImage src={finalAvatar} alt={finalName} />
            <AvatarFallback className="text-lg">
              {finalName.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-semibold tracking-tight">
                {finalName}
              </div>
              {isSelf ? null : (
                <Button
                  size="sm"
                  variant={profile.isFollowing ? "secondary" : "default"}
                  onClick={handleToggleFollow}
                >
                  {profile.isFollowing ? "已关注" : "关注"}
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <span>
                关注 <span className="text-foreground">{followingCount}</span>
              </span>
              <span>
                粉丝 <span className="text-foreground">{followerCount}</span>
              </span>
              <span>
                获赞 <span className="text-foreground">{likeCount}</span>
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              用户 ID：<span className="text-foreground">{profile.id}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex-1 min-h-0 flex flex-col">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
            <TabsList>
              <TabsTrigger value="works">作品</TabsTrigger>
            </TabsList>
            <TabsContent value="works" className="mt-4">
              {isLoadingList ? (
                <VideoGridSkeleton />
              ) : worksVideos.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">暂无作品</div>
              ) : (
                <div className="grid grid-cols-3 gap-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {worksVideos.map((video) => (
                    <Link
                      key={video.id}
                      href={`/video/${video.id}`}
                      className="group relative aspect-[3/4] overflow-hidden bg-slate-100 rounded-sm"
                    >
                      {video.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-200 text-slate-400">
                          <span className="text-xs">暂无封面</span>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

