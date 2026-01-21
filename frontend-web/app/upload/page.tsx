"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { uploadVideo } from "@/services/videoService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type AuthUser = {
  userId: number;
  username: string;
  token: string;
};

const AUTH_STORAGE_KEY = "teektok.auth";

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function UploadPage() {
  const router = useRouter();
  const [authUser, setAuthUser] = React.useState<AuthUser | null>(null);
  const [isHydrated, setIsHydrated] = React.useState(false);

  const [file, setFile] = React.useState<File | null>(null);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as AuthUser;
      if (parsed?.token && parsed?.userId) setAuthUser(parsed);
    } catch {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  React.useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!isHydrated) return null;

  if (!authUser) {
    return (
      <div className="flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center bg-sidebar px-6 text-center">
        <h1 className="text-xl font-semibold">请先登录</h1>
        <p className="mt-2 text-sm text-muted-foreground">登录后即可上传视频。</p>
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

  return (
    <div className="flex h-full min-h-0 w-full flex-1 items-start justify-center overflow-auto bg-sidebar px-6 py-8">
      <div className="w-full max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>上传视频</CardTitle>
            <CardDescription>选择视频文件，填写标题与简介后提交。</CardDescription>
          </CardHeader>

          <CardContent className="grid gap-5">
            <div className="grid gap-2">
              <div className="text-sm font-medium">视频文件</div>
              <Input
                type="file"
                accept="video/*"
                disabled={isSubmitting}
                onChange={(e) => {
                  const f = e.currentTarget.files?.[0] ?? null;
                  setFile(f);
                }}
              />
              {file && (
                <div className="text-xs text-muted-foreground">
                  {file.name} · {formatBytes(file.size)}
                </div>
              )}
            </div>

            {previewUrl && (
              <div className="overflow-hidden rounded-xl border bg-black">
                <video className="h-auto w-full" src={previewUrl} controls preload="metadata" />
              </div>
            )}

            <div className="grid gap-2">
              <div className="text-sm font-medium">标题</div>
              <Input
                value={title}
                disabled={isSubmitting}
                placeholder="给视频起个标题"
                maxLength={60}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className="text-xs text-muted-foreground">{title.length}/60</div>
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-medium">简介</div>
              <Textarea
                value={description}
                disabled={isSubmitting}
                placeholder="可选，补充更多信息"
                maxLength={200}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="text-xs text-muted-foreground">{description.length}/200</div>
            </div>
          </CardContent>

          <CardFooter className="border-t justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={isSubmitting}
              onClick={() => {
                setFile(null);
                setTitle("");
                setDescription("");
              }}
            >
              清空
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={async () => {
                if (!file) {
                  toast.error("请选择要上传的视频文件");
                  return;
                }
                if (!title.trim()) {
                  toast.error("请输入标题");
                  return;
                }
                setIsSubmitting(true);
                try {
                  await uploadVideo({
                    file,
                    title: title.trim(),
                    description: description.trim() || undefined,
                  });
                  toast.success("上传成功");
                  router.push("/me");
                } catch (e) {
                  const msg = e instanceof Error ? e.message : "上传失败";
                  toast.error(msg);
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              {isSubmitting ? "上传中..." : "开始上传"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

