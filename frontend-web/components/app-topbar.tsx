"use client";

import * as React from "react";
import { CircleUserRound, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { Searchbar } from "./searchbar";
import { Button } from "./ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginMode = "password" | "sms";

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

  function onKeyDownOverlay(e: React.KeyboardEvent<HTMLDivElement>) {
    // Radix already handles Esc, but this provides a fallback if structure changes.
    if (e.key === "Escape") setOpen(false);
  }

  return (
    <div className="bg-sidebar text-white px-4 py-2 w-full h-14 flex items-center gap-2">
      <SidebarTrigger className="md:hidden h-10 w-10 rounded-xl" />

      <div className="flex-1 flex justify-center">
        <Searchbar />
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          {authUser ? (
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
          ) : (
            <Button className="h-full px-4 rounded-xl">
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
                    登录 TeekTok
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-600">
                    {mode === "sms"
                      ? "使用手机号验证码登录"
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
                    autoComplete="current-password"
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
                  {isSubmitting ? "登录中..." : "登录"}
                </Button>
              </div>

              <div className="pt-1 text-center text-sm text-slate-600">
                没有账号？{" "}
                <a
                  href="#"
                  className="underline underline-offset-4 text-slate-900 hover:text-slate-700"
                  onClick={(e) => e.preventDefault()}
                >
                  注册
                </a>
              </div>
            </form>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
