"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


type AuthUser = {
  userId: number;
  username: string;
  token: string;
};

type TabKey = "works" | "likes" | "bookmarks" | "history";

const AUTH_STORAGE_KEY = "teektok.auth";

const tabLabels: { key: TabKey; label: string }[] = [
  { key: "works", label: "作品" },
  { key: "likes", label: "喜欢" },
  { key: "bookmarks", label: "收藏" },
  { key: "history", label: "观看历史" },
];

export default function MePage() {
  const [authUser, setAuthUser] = React.useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = React.useState<TabKey>("works");

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as AuthUser;
      if (parsed?.token && parsed?.userId) {
        setAuthUser(parsed);
      }
    } catch {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, []);

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

  return (
    <div className="flex h-full min-h-0 w-full flex-1 items-start justify-center overflow-hidden bg-sidebar px-6 py-8">
      <div className="w-full max-w-4xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <Avatar size="lg" className="h-20 w-20">
            <AvatarImage src="" alt={displayName} />
            <AvatarFallback className="text-lg">
              {displayName.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <div className="text-2xl font-semibold tracking-tight">
              {displayName}
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <span>
                关注 <span className="text-foreground">0</span>
              </span>
              <span>
                粉丝 <span className="text-foreground">0</span>
              </span>
              <span>
                获赞 <span className="text-foreground">0</span>
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              用户 ID：<span className="text-foreground">{displayId}</span>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as TabKey)}
          >
            <TabsList className="mb-4 flex flex-wrap gap-2 bg-transparent p-0">
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
              className="text-sm text-muted-foreground"
            >
              暂无作品内容
            </TabsContent>
            <TabsContent
              value="likes"
              className="text-sm text-muted-foreground"
            >
              暂无喜欢内容
            </TabsContent>
            <TabsContent
              value="bookmarks"
              className="text-sm text-muted-foreground"
            >
              暂无收藏内容
            </TabsContent>
            <TabsContent
              value="history"
              className="text-sm text-muted-foreground"
            >
              暂无观看历史
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
