"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminLoginData } from "@/services/adminService";
import { setAdminAuth } from "@/lib/auth";

const ADMIN_TOKEN_COOKIE = "teektok_admin_token";

function AdminLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const next = useMemo(() => {
    const raw = searchParams?.get("next");
    // Only allow internal redirects.
    if (!raw) return "/admin";
    if (!raw.startsWith("/")) return "/admin";
    if (raw.startsWith("//")) return "/admin";
    return raw;
  }, [searchParams]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setAdminAuthCookie(token: string) {
    // Middleware runs server-side and can only read cookies.
    // Keep it simple: set a non-HttpOnly cookie for now.
    // NOTE: For production, prefer HttpOnly cookie set by backend.
    const maxAgeSeconds = 60 * 60 * 24 * 7; // 7 days
    document.cookie = `${ADMIN_TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const u = username.trim();
    if (!u || !password) {
      setError("请输入用户名和密码");
      return;
    }

    setIsSubmitting(true);
    try {
      // Backend not implemented yet; this still follows docs:
      // POST /admin/login  (base: http://localhost:8080/api)
      const data = await adminLoginData({ username: u, password });

      // Docs are ambiguous for admin login response, so tolerate missing token
      // but require it for keeping an authenticated session in the admin UI.
      const token = data?.token;
      if (!token) {
        throw new Error(
          "登录成功但未返回 token（请确认后端 /admin/login 返回 data.token）",
        );
      }

      setAdminAuth({
        token,
        userId: typeof data?.adminId === "number" ? data.adminId : undefined,
      });

      setAdminAuthCookie(token);

      router.replace(next);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "登录失败，请稍后再试";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh w-full max-w-md items-center px-4 py-10">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>管理员登录</CardTitle>
          </CardHeader>

          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <Field>
                <FieldLabel>用户名</FieldLabel>
                <FieldContent>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="请输入管理员用户名"
                    autoComplete="username"
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>密码</FieldLabel>
                <FieldContent>
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    type="password"
                    autoComplete="current-password"
                  />
                </FieldContent>
              </Field>

              {error ? (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "登录中..." : "登录"}
              </Button>

              <div className="text-xs text-muted-foreground">
                接口基路径（文档）：
                <span className="font-mono">http://localhost:8080/api</span>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  // Next build requirement: useSearchParams() must be within a Suspense boundary.
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-background">
          <div className="mx-auto flex min-h-dvh w-full max-w-md items-center px-4 py-10">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>管理员登录</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                加载中...
              </CardContent>
            </Card>
          </div>
        </div>
      }
    >
      <AdminLoginInner />
    </Suspense>
  );
}
