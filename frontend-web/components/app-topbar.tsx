"use client";

import * as React from "react";
import { Bell, CircleUserRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Searchbar } from "./searchbar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { SidebarTrigger } from "./ui/sidebar";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getNotificationUnreadCount,
  getNotifications,
  markAllNotificationsRead,
} from "@/services/videoService";
import type { NotificationItem } from "@/types/notification";

type LoginMode = "password" | "sms" | "register";

type AuthUser = {
  userId: number;
  username: string;
  token: string;
};

const AUTH_STORAGE_KEY = "teektok.auth";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export function AppTopbar() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<LoginMode>("password");
  const [authUser, setAuthUser] = React.useState<AuthUser | null>(null);
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [smsCode, setSmsCode] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [notificationOpen, setNotificationOpen] = React.useState(false);
  const [notificationLoading, setNotificationLoading] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);

  const handleLogout = React.useCallback(() => {
    setAuthUser(null);
    setNotificationOpen(false);
    setUnreadCount(0);
    setNotifications([]);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    router.push("/");
  }, [router]);

  const phoneId = React.useId();
  const smsCodeId = React.useId();
  const passwordId = React.useId();

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

  const refreshUnreadCount = React.useCallback(async () => {
    if (!authUser) return;
    try {
      const count = await getNotificationUnreadCount();
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  }, [authUser]);

  React.useEffect(() => {
    if (!authUser) return;
    refreshUnreadCount();
    const timer = window.setInterval(() => {
      refreshUnreadCount();
    }, 30000);
    return () => {
      window.clearInterval(timer);
    };
  }, [authUser, refreshUnreadCount]);

  React.useEffect(() => {
    if (!authUser) return;
    if (!notificationOpen) return;

    let cancelled = false;
    setNotificationLoading(true);
    (async () => {
      try {
        const res = await getNotifications(1, 50);
        if (cancelled) return;
        setNotifications(res.list);
        await markAllNotificationsRead();
        const count = await getNotificationUnreadCount();
        if (cancelled) return;
        setUnreadCount(count);
      } catch {
        if (cancelled) return;
        setNotifications([]);
      } finally {
        if (!cancelled) setNotificationLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authUser, notificationOpen]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOpenLogin = () => {
      if (!authUser) {
        setOpen(true);
      }
    };
    window.addEventListener("teektok:open-login", handleOpenLogin);
    return () => {
      window.removeEventListener("teektok:open-login", handleOpenLogin);
    };
  }, [authUser]);

  function onKeyDownOverlay(e: React.KeyboardEvent<HTMLDivElement>) {
    // Radix already handles Esc, but this provides a fallback if structure changes.
    if (e.key === "Escape") setOpen(false);
  }

  const renderNotificationText = React.useCallback((n: NotificationItem) => {
    const actor = n.actorUsername || `用户${n.actorId}`;
    if (n.type === 1) return `${actor} 关注了你`;
    if (n.type === 2) {
      return n.targetType === 2 ? `${actor} 赞了你的视频` : `${actor} 赞了你的评论`;
    }
    if (n.type === 3) {
      const detail = n.content ? `：${n.content}` : "";
      return n.targetType === 3 ? `${actor} 回复了你${detail}` : `${actor} 评论了你${detail}`;
    }
    if (n.type === 4) {
      const detail = n.content ? `：${n.content}` : "";
      return `${actor} 给你发来私信${detail}`;
    }
    return `${actor} 与你互动了`;
  }, []);

  return (
    <div className="bg-sidebar text-white px-4 py-2 w-full h-14 flex items-center gap-2">
      <SidebarTrigger className="md:hidden h-10 w-10 rounded-xl" />

      <div className="flex-1 flex justify-center">
        <Searchbar />
      </div>

      <div className="flex items-center gap-2">
        {authUser ? (
          <DropdownMenu open={notificationOpen} onOpenChange={setNotificationOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-white/90 hover:text-white hover:bg-white/10"
                aria-label="通知"
              >
                <Bell size={18} />
                {unreadCount > 0 ? (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full px-1"
                  >
                    {unreadCount > 99 ? "99+" : String(unreadCount)}
                  </Badge>
                ) : null}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96">
              <DropdownMenuLabel>通知</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ScrollArea className="h-96">
                {notificationLoading ? (
                  <div className="px-3 py-3 text-sm text-muted-foreground">加载中...</div>
                ) : notifications.length === 0 ? (
                  <div className="px-3 py-3 text-sm text-muted-foreground">暂无通知</div>
                ) : (
                  <div className="grid">
                    {notifications.map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        className={n.isRead === 0 ? "bg-muted/30" : undefined}
                        onSelect={(e) => {
                          if (n.type !== 4) return;
                          e.preventDefault();
                          setNotificationOpen(false);
                          router.push(`/dm/${n.targetId}`);
                        }}
                      >
                        <div className="flex gap-3 py-1">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={n.actorAvatar || ""} alt={n.actorUsername || ""} />
                            <AvatarFallback>
                              {(n.actorUsername || "U").slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm leading-5">{renderNotificationText(n)}</div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              {n.createTime}
                            </div>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white/90 hover:text-white hover:bg-white/10"
            aria-label="通知"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("teektok:open-login"));
              }
            }}
          >
            <Bell size={18} />
          </button>
        )}

        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            {authUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full transition-transform hover:scale-105"
                    aria-label="已登录"
                  >
                    <Avatar size="lg">
                      <AvatarImage src="" alt={authUser.username} />
                      <AvatarFallback>
                        {authUser.username.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>账号</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/me")}>
                    我的
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/me")}>设置</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button className="h-10 px-4 rounded-xl">
                <CircleUserRound size={16} strokeWidth={3} />
                <p className="text-[16px] font-semibold pt-0.5">登录</p>
              </Button>
            )}
          </AlertDialogTrigger>

        <AlertDialogContent
          size="sm"
          // Make the card larger without scaling typography/layout inside.
          className="bg-white text-slate-900 ring-slate-900/10 shadow-2xl data-[size=sm]:max-w-md sm:data-[size=sm]:max-w-xl"
        >
          <div onKeyDown={onKeyDownOverlay}>
            <AlertDialogHeader className="text-left">
              <div className="flex w-full items-start justify-between">
                <div className="min-w-0">
                  <AlertDialogTitle className="text-slate-900">
                    {mode === "register" ? "注册 TeekTok" : "登录 TeekTok"}
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-600">
                    {mode === "sms"
                      ? "使用手机号验证码登录"
                      : mode === "register"
                      ? "创建一个新账号"
                      : "使用手机号密码登录"}
                  </AlertDialogDescription>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 w-9 shrink-0 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                  onClick={() => setOpen(false)}
                  aria-label="关闭"
                >
                  <X size={18} />
                </Button>
              </div>
            </AlertDialogHeader>

            {mode !== "register" && (
              <div className="mt-2">
                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
                  <button
                    type="button"
                    className={[
                      "h-9 rounded-xl text-sm font-medium transition-colors",
                      mode === "sms"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900",
                    ].join(" ")}
                    onClick={() => setMode("sms")}
                  >
                    验证码登录
                  </button>
                  <button
                    type="button"
                    className={[
                      "h-9 rounded-xl text-sm font-medium transition-colors",
                      mode === "password"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900",
                    ].join(" ")}
                    onClick={() => setMode("password")}
                  >
                    密码登录
                  </button>
                </div>
              </div>
            )}

            <form
              className="mt-4 grid gap-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (mode === "sms") {
                  setErrorMessage("短信验证码登录暂未接入");
                  return;
                }
                if (!username || !password) {
                  setErrorMessage("请输入用户名和密码");
                  return;
                }
                setIsSubmitting(true);
                setErrorMessage(null);

                if (mode === "register") {
                  try {
                    const res = await fetch(`${API_BASE_URL}/api/user/register`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ username, password }),
                    });

                    const text = await res.text();
                    const parsed = text ? JSON.parse(text) : null;
                    if (!res.ok) {
                      const msg =
                        parsed &&
                        typeof parsed === "object" &&
                        parsed !== null &&
                        "msg" in parsed &&
                        typeof (parsed as { msg?: unknown }).msg === "string"
                          ? (parsed as { msg: string }).msg
                          : res.statusText || "注册失败";
                      throw new Error(msg);
                    }

                    if (!parsed || parsed.code !== 200) {
                      throw new Error(parsed?.msg || "注册失败，请重试");
                    }

                    toast.success("注册成功，请登录");
                    setMode("password");
                    setPassword("");
                  } catch (error) {
                    const message =
                      error instanceof Error ? error.message : "注册失败";
                    setErrorMessage(message);
                  } finally {
                    setIsSubmitting(false);
                  }
                  return;
                }

                try {
                  const res = await fetch(`${API_BASE_URL}/api/user/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password }),
                  });

                  const text = await res.text();
                  const parsed = text ? JSON.parse(text) : null;
                  if (!res.ok) {
                    const msg =
                      parsed &&
                      typeof parsed === "object" &&
                      parsed !== null &&
                      "msg" in parsed &&
                      typeof (parsed as { msg?: unknown }).msg === "string"
                        ? (parsed as { msg: string }).msg
                        : res.statusText || "登录失败";
                    throw new Error(msg);
                  }

                  if (!parsed || parsed.code !== 200 || !parsed.data) {
                    throw new Error("登录失败，请重试");
                  }

                  const user = {
                    userId: Number(parsed.data.userId),
                    username,
                    token: String(parsed.data.token || ""),
                  } satisfies AuthUser;

                  setAuthUser(user);
                  if (typeof window !== "undefined") {
                    window.localStorage.setItem(
                      AUTH_STORAGE_KEY,
                      JSON.stringify(user),
                    );
                  }
                  setOpen(false);
                  setPassword("");
                  setSmsCode("");
                  router.push("/me");
                } catch (error) {
                  const message =
                    error instanceof Error ? error.message : "登录失败";
                  setErrorMessage(message);
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <div className="grid gap-2">
                <Label htmlFor={phoneId} className="text-slate-700">
                  用户名
                </Label>
                <Input
                  id={phoneId}
                  placeholder="请输入用户名"
                  autoComplete="username"
                  className="h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:border-slate-300 focus-visible:ring-slate-300/40"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              {mode === "sms" ? (
                <div className="grid gap-2">
                  <Label htmlFor={smsCodeId} className="text-slate-700">
                    验证码
                  </Label>
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <Input
                      id={smsCodeId}
                      inputMode="numeric"
                      placeholder="6位验证码"
                      autoComplete="one-time-code"
                      className="h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:border-slate-300 focus-visible:ring-slate-300/40"
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 rounded-2xl border-slate-200 bg-white text-slate-900 hover:bg-slate-50 hover:text-slate-900"
                      onClick={() => {
                        setErrorMessage("短信验证码登录暂未接入");
                      }}
                    >
                      获取验证码
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor={passwordId} className="text-slate-700">
                    密码
                  </Label>
                  <Input
                    id={passwordId}
                    type="password"
                    placeholder="请输入密码"
                    autoComplete={
                      mode === "register" ? "new-password" : "current-password"
                    }
                    className="h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:border-slate-300 focus-visible:ring-slate-300/40"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              )}

              {errorMessage ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {errorMessage}
                </div>
              ) : null}

              <div className="pt-1">
                <Button
                  type="submit"
                  className="h-11 w-full rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? mode === "register"
                      ? "注册中..."
                      : "登录中..."
                    : mode === "register"
                    ? "注册"
                    : "登录"}
                </Button>
              </div>

              <div className="pt-1 text-center text-sm text-slate-600">
                {mode === "register" ? (
                  <>
                    已有账号？{" "}
                    <a
                      href="#"
                      className="underline underline-offset-4 text-slate-900 hover:text-slate-700"
                      onClick={(e) => {
                        e.preventDefault();
                        setMode("password");
                      }}
                    >
                      登录
                    </a>
                  </>
                ) : (
                  <>
                    没有账号？{" "}
                    <a
                      href="#"
                      className="underline underline-offset-4 text-slate-900 hover:text-slate-700"
                      onClick={(e) => {
                        e.preventDefault();
                        setMode("register");
                      }}
                    >
                      注册
                    </a>
                  </>
                )}
              </div>
            </form>
          </div>
        </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
