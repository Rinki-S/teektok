"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getFavoritedVideos, getLikedVideos, getMyInfo, getMyVideos } from "@/services/videoService";
import type { Video } from "@/types/video";
import Link from "next/link";
import { Heart, Play } from "lucide-react";

type AuthUser = {
  userId: number;
  username: string;
  token: string;
};

type UserMe = {
  id: number;
  username: string;
  avatar?: string;
  followingCount?: number;
  followerCount?: number;
  likeCount?: number;
};

type TabKey = "works" | "likes" | "bookmarks" | "history";

const AUTH_STORAGE_KEY = "teektok.auth";

const tabLabels: { key: TabKey; label: string }[] = [
  { key: "works", label: "作品" },
  { key: "likes", label: "喜欢" },
  { key: "bookmarks", label: "收藏" },
  { key: "history", label: "观看历史" },
];

function VideoGrid({ videos, emptyMessage }: { videos: Video[]; emptyMessage: string }) {
  if (videos.length === 0) {
    return <div className="py-12 text-center text-muted-foreground">{emptyMessage}</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {videos.map((video) => (
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
              <Play className="h-8 w-8 opacity-50" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/10 opacity-0 transition-opacity group-hover:opacity-100" />
          <div className="absolute bottom-1 left-1 right-1">
            <div className="flex items-center gap-2 text-[10px] text-white/90 font-medium truncate drop-shadow-md">
              <span className="inline-flex items-center gap-1">
                <Play className="size-3" />
                {video.stats.views}
              </span>
              <span className="inline-flex items-center gap-1">
                <Heart className="size-3" />
                {video.stats.likes}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function MePage() {
  const [authUser, setAuthUser] = React.useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = React.useState<TabKey>("works");
  const [isLoading, setIsLoading] = React.useState(true);
  const [me, setMe] = React.useState<UserMe | null>(null);
  
  const [worksVideos, setWorksVideos] = React.useState<Video[]>([]);
  const [likedVideos, setLikedVideos] = React.useState<Video[]>([]);
  const [favoritedVideos, setFavoritedVideos] = React.useState<Video[]>([]);
  const [isLoadingList, setIsLoadingList] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AuthUser;
        if (parsed?.token && parsed?.userId) {
          setAuthUser(parsed);
        }
      }
    } catch {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!authUser) return;
    getMyInfo()
      .then((data) => {
        setMe({
          id: data.id,
          username: data.username,
          avatar: data.avatar,
          followingCount: data.followingCount,
          followerCount: data.followerCount,
          likeCount: data.likeCount,
        });
      })
      .catch((e) => {
        console.error("Failed to load my info", e);
      });
  }, [authUser]);

  React.useEffect(() => {
    if (!authUser) return;
    
    const fetchList = async () => {
      setIsLoadingList(true);
      try {
        if (activeTab === "works") {
            const { list } = await getMyVideos(1, 30);
            setWorksVideos(list);
        } else if (activeTab === "likes") {
            const { list } = await getLikedVideos(1, 20);
            setLikedVideos(list);
        } else if (activeTab === "bookmarks") {
            const { list } = await getFavoritedVideos(1, 20);
            setFavoritedVideos(list);
        }
      } catch (e) {
        console.error("Failed to load list", e);
      } finally {
        setIsLoadingList(false);
      }
    };

    fetchList();
  }, [authUser, activeTab]);

  if (isLoading) {
    return null;
  }

  if (!authUser) {
    return (
      <div className="flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center bg-sidebar px-6 text-center">
        <h1 className="text-xl font-semibold">请先登录</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          登录后查看个人主页。
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          点击右上角登录按钮继续。
        </p>
        <button
          type="button"
          className="mt-6 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("teektok:open-login"));
            }
          }}
        >
          去登录
        </button>
      </div>
    );
  }

  const displayName = authUser.username || "未登录";
  const displayId = authUser.userId ?? 0;
  const finalName = me?.username || displayName;
  const finalAvatar = me?.avatar || "";
  const followingCount = me?.followingCount ?? 0;
  const followerCount = me?.followerCount ?? 0;
  const likeCount = me?.likeCount ?? 0;

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
            <div className="text-2xl font-semibold tracking-tight">
              {finalName}
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
              用户 ID：<span className="text-foreground">{displayId}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex-1 min-h-0 flex flex-col">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as TabKey)}
            className="flex flex-col h-full"
          >
            <TabsList className="mb-4 flex flex-wrap gap-2 bg-transparent p-0 flex-none">
              {tabLabels.map((tab) => (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className="rounded-full px-4 py-2"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent
              value="works"
              className="text-sm text-muted-foreground flex-1 overflow-y-auto min-h-0"
            >
              {isLoadingList ? (
                <div className="py-12 text-center">加载中...</div>
              ) : (
                <VideoGrid videos={worksVideos} emptyMessage="暂无作品内容" />
              )}
            </TabsContent>
            <TabsContent
              value="likes"
              className="text-sm text-muted-foreground flex-1 overflow-y-auto min-h-0"
            >
              {isLoadingList ? (
                <div className="py-12 text-center">加载中...</div>
              ) : (
                <VideoGrid videos={likedVideos} emptyMessage="暂无喜欢内容" />
              )}
            </TabsContent>
            <TabsContent
              value="bookmarks"
              className="text-sm text-muted-foreground flex-1 overflow-y-auto min-h-0"
            >
              {isLoadingList ? (
                <div className="py-12 text-center">加载中...</div>
              ) : (
                <VideoGrid videos={favoritedVideos} emptyMessage="暂无收藏内容" />
              )}
            </TabsContent>
            <TabsContent
              value="history"
              className="text-sm text-muted-foreground flex-1 overflow-y-auto min-h-0"
            >
              暂无观看历史
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
