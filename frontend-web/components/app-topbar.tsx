"use client";

import * as React from "react";
import { CircleUserRound, X } from "lucide-react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginMode = "password" | "sms";

export function AppTopbar() {
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<LoginMode>("password");

  const phoneId = React.useId();
  const smsCodeId = React.useId();
  const passwordId = React.useId();

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
          <Button className="h-full px-4 rounded-xl">
            <CircleUserRound size={16} strokeWidth={3} />
            <p className="text-[16px] font-semibold pt-0.5">登录</p>
          </Button>
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
              onSubmit={(e) => {
                e.preventDefault();
                // Wire this up to real auth later. For now, just close.
                setOpen(false);
              }}
            >
              <div className="grid gap-2">
                <Label htmlFor={phoneId} className="text-slate-700">
                  手机号
                </Label>
                <Input
                  id={phoneId}
                  inputMode="tel"
                  placeholder="请输入手机号"
                  autoComplete="tel"
                  className="h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:border-slate-300 focus-visible:ring-slate-300/40"
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
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 rounded-2xl border-slate-200 bg-white text-slate-900 hover:bg-slate-50 hover:text-slate-900"
                      onClick={() => {
                        // TODO: trigger "send code" via API
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
                    required
                  />
                </div>
              )}

              <div className="pt-1">
                <Button
                  type="submit"
                  className="h-11 w-full rounded-2xl bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  登录
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
