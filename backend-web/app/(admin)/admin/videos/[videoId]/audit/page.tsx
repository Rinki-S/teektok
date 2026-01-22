"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { getVideoDetail, markVideoHot, approveVideo, rejectVideo } from "@/services/videoAdminService";
import type { AdminVideoVO } from "@/types/api";
import { CheckCircle2, ChevronLeft, Flame, XCircle } from "lucide-react";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: AdminVideoVO };

type AuditChoice = "approve" | "reject";

function parseVideoId(value: unknown): number | null {
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function statusBadge(status: number | undefined) {
  if (status === 1) {
    return (
      <Badge className="gap-1" variant="secondary">
        <CheckCircle2 className="h-3.5 w-3.5" />
        已通过
      </Badge>
    );
  }
  if (status === 2) {
    return (
      <Badge className="gap-1" variant="destructive">
        <XCircle className="h-3.5 w-3.5" />
        已拒绝
      </Badge>
    );
  }
  return (
    <Badge className="gap-1" variant="outline">
      待审核
    </Badge>
  );
}

export default function AdminVideoAuditPage() {
  const router = useRouter();
  const params = useParams();
  const videoId = useMemo(() => parseVideoId(params?.videoId), [params]);

  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [choice, setChoice] = useState<AuditChoice>("approve");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!videoId) {
      setState({ status: "error", message: "无效的视频 ID" });
      return;
    }

    let cancelled = false;
    (async () => {
      setState({ status: "loading" });
      try {
        const data = await getVideoDetail(videoId);
        if (cancelled) return;
        setState({ status: "success", data });
        if (data.status === 2) setChoice("reject");
        else setChoice("approve");
      } catch (e) {
        const message = e instanceof Error ? e.message : "加载失败";
        if (cancelled) return;
        setState({ status: "error", message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [videoId]);

  const data = state.status === "success" ? state.data : null;

  async function submitAudit() {
    if (!videoId) return;
    setPending(true);
    try {
      if (choice === "approve") await approveVideo(videoId);
      else await rejectVideo(videoId);
      router.push("/admin/videos");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function toggleHot(nextHot: 0 | 1) {
    if (!videoId) return;
    setPending(true);
    try {
      await markVideoHot(videoId, nextHot);
      setState((prev) =>
        prev.status === "success"
          ? { status: "success", data: { ...prev.data, isHot: nextHot } }
          : prev,
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href="/admin/videos">
              <ChevronLeft className="h-4 w-4" />
              返回列表
            </Link>
          </Button>
          <div className="text-sm text-muted-foreground">
            视频ID：<span className="font-mono">{videoId ?? "—"}</span>
          </div>
        </div>
      </div>

      {state.status === "loading" ? (
        <Card>
          <CardHeader>
            <CardTitle>加载中...</CardTitle>
          </CardHeader>
        </Card>
      ) : state.status === "error" ? (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle>加载失败</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {state.message}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span className="truncate">视频内容</span>
                <div className="flex items-center gap-2">
                  {statusBadge(data?.status)}
                  <div className="flex items-center gap-2 rounded-md border px-2 py-1">
                    <Flame
                      className={cn(
                        "h-4 w-4",
                        (data?.isHot ?? 0) === 1 && "text-orange-500",
                      )}
                    />
                    <Switch
                      checked={(data?.isHot ?? 0) === 1}
                      disabled={pending}
                      onCheckedChange={(checked) =>
                        void toggleHot(checked ? 1 : 0)
                      }
                    />
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">标题</div>
                <div className="text-sm font-medium">{data?.title}</div>
              </div>

              {data?.description ? (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">描述</div>
                  <div className="text-sm">{data.description}</div>
                </div>
              ) : null}

              {data?.videoUrl ? (
                <div className="overflow-hidden rounded-lg border bg-black">
                  <video
                    controls
                    preload="metadata"
                    poster={data.coverUrl ?? undefined}
                    src={data.videoUrl}
                    className="h-[62vh] w-full object-contain"
                  />
                </div>
              ) : (
                <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                  未返回 videoUrl，无法预览
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>审核结果</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button
                  type="button"
                  variant={choice === "approve" ? "default" : "outline"}
                  className="w-full justify-start"
                  disabled={pending}
                  onClick={() => setChoice("approve")}
                >
                  通过
                </Button>
                <Button
                  type="button"
                  variant={choice === "reject" ? "destructive" : "outline"}
                  className="w-full justify-start"
                  disabled={pending}
                  onClick={() => setChoice("reject")}
                >
                  拒绝
                </Button>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button asChild type="button" variant="outline" disabled={pending}>
                  <Link href="/admin/videos">取消</Link>
                </Button>
                <Button type="button" disabled={pending} onClick={() => void submitAudit()}>
                  提交审核
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
