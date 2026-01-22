"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  getCurrentUserId,
  getDmSessionMessages,
  getUserProfile,
  getVideoById,
  sendDm,
} from "@/services/videoService";
import type { Video } from "@/types/video";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const AUTH_STORAGE_KEY = "teektok.auth";

type AuthUser = {
  userId: number;
  username: string;
  token: string;
};

type DmMessage = {
  id: number;
  senderId: number;
  receiverId: number;
  msgType: number;
  content?: string;
  videoId?: number;
  createTime?: string;
};

export default function DmSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const targetId = Number(resolvedParams.id);

  const [authUser, setAuthUser] = React.useState<AuthUser | null>(null);
  const [isBooting, setIsBooting] = React.useState(true);

  const [targetName, setTargetName] = React.useState<string>("");
  const [messages, setMessages] = React.useState<DmMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [text, setText] = React.useState("");

  const [videoCache, setVideoCache] = React.useState<Record<number, Video>>({});
  const bottomRef = React.useRef<HTMLDivElement | null>(null);

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
      setIsBooting(false);
    }
  }, []);

  const loadSession = React.useCallback(async () => {
    if (!authUser) return;
    if (!Number.isFinite(targetId)) {
      toast.error("无效的用户ID");
      router.replace("/friends");
      return;
    }
    setIsLoading(true);
    try {
      const [profile, session] = await Promise.all([
        getUserProfile(String(targetId)),
        getDmSessionMessages(targetId, 1, 50),
      ]);
      setTargetName(profile?.username || `用户 ${targetId}`);
      setMessages(session.list || []);
    } catch (e) {
      console.error("Failed to load dm session", e);
    } finally {
      setIsLoading(false);
    }
  }, [authUser, router, targetId]);

  React.useEffect(() => {
    void loadSession();
  }, [loadSession]);

  React.useEffect(() => {
    const ids = Array.from(
      new Set(
        messages
          .filter((m) => m.msgType === 2 && Number.isFinite(m.videoId))
          .map((m) => Number(m.videoId)),
      ),
    ).filter((id) => !videoCache[id]);

    if (ids.length === 0) return;

    let cancelled = false;
    Promise.all(
      ids.map(async (id) => {
        try {
          const v = await getVideoById(String(id));
          return { id, v };
        } catch {
          return null;
        }
      }),
    ).then((pairs) => {
      if (cancelled) return;
      setVideoCache((prev) => {
        const next = { ...prev };
        for (const p of pairs) {
          if (p) next[p.id] = p.v;
        }
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [messages, videoCache]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    const content = text.trim();
    if (!content) return;
    if (!authUser) return;

    try {
      setText("");
      await sendDm({ targetId, msgType: 1, content });
      await loadSession();
    } catch (e) {
      setText(content);
      console.error("send dm failed", e);
    }
  };

  if (isBooting) return null;

  const currentUserIdStr = getCurrentUserId();
  if (!authUser || !currentUserIdStr) {
    return (
      <div className="flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center bg-sidebar px-6 text-center">
        <h1 className="text-xl font-semibold">请先登录</h1>
        <p className="mt-2 text-sm text-muted-foreground">登录后才能发送私信。</p>
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

  const currentUserId = Number(currentUserIdStr);

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-sidebar">
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/friends"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            返回
          </Link>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">
              {targetName || `用户 ${targetId}`}
            </div>
            <div className="text-xs text-muted-foreground">ID: {targetId}</div>
          </div>
        </div>
        <Link
          href={`/user/${targetId}`}
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          主页
        </Link>
      </div>

      <div className="flex-1 overflow-auto px-4 py-4">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">加载中...</div>
        ) : messages.length === 0 ? (
          <div className="text-sm text-muted-foreground">暂无私信，试着发一条吧。</div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m) => {
              const isMe = m.senderId === currentUserId;
              const bubbleBase =
                "max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed";
              const bubbleCls = isMe
                ? `${bubbleBase} bg-primary text-primary-foreground self-end`
                : `${bubbleBase} bg-card text-foreground border border-border self-start`;

              if (m.msgType === 2 && m.videoId) {
                const vid = Number(m.videoId);
                const v = Number.isFinite(vid) ? videoCache[vid] : undefined;
                return (
                  <div key={m.id} className={bubbleCls}>
                    <div className="text-xs opacity-80">分享了一个视频</div>
                    <div className="mt-2 rounded-lg border border-border overflow-hidden bg-background">
                      {v?.thumbnailUrl ? (
                        <img
                          src={v.thumbnailUrl}
                          alt={v.title}
                          className="h-28 w-full object-cover"
                        />
                      ) : (
                        <div className="h-28 w-full bg-muted" />
                      )}
                      <div className="p-3">
                        <div className="line-clamp-2 text-sm font-medium">
                          {v?.title || `视频 ${vid}`}
                        </div>
                        <div className="mt-2">
                          <Link
                            href={`/watch/${vid}`}
                            className="text-sm font-medium underline underline-offset-4"
                          >
                            打开视频
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={m.id} className={bubbleCls}>
                  {m.content}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="border-t border-border bg-card p-3">
        <div className="flex items-center gap-2">
          <Input
            value={text}
            placeholder="输入私信内容"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSend();
            }}
          />
          <Button type="button" onClick={() => void handleSend()}>
            发送
          </Button>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          如果对方没有关注你，你最多只能发送一条私信。
        </div>
      </div>
    </div>
  );
}
