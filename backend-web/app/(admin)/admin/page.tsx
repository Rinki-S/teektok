"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getVideoAnalysis } from "@/services/videoAdminService";
import type { VideoAnalysisData } from "@/types/api";
import { BarChart3, RefreshCw, Video, Users } from "lucide-react";

type LoadState =
  | { status: "idle" | "loading" }
  | { status: "success"; data: VideoAnalysisData }
  | { status: "error"; message: string };

function formatNumber(n: number) {
  try {
    return new Intl.NumberFormat("zh-CN").format(n);
  } catch {
    return String(n);
  }
}

export default function AdminDashboardPage() {
  const [state, setState] = useState<LoadState>({ status: "idle" });

  const metrics = useMemo(() => {
    if (state.status !== "success") return null;

    const { playCount, likeCount, commentCount } = state.data;
    return [
      {
        title: "播放次数",
        value: formatNumber(playCount),
        icon: BarChart3,
        hint: "GET /analysis/video",
      },
      {
        title: "点赞次数",
        value: formatNumber(likeCount),
        icon: Users,
        hint: "GET /analysis/video",
      },
      {
        title: "评论次数",
        value: formatNumber(commentCount),
        icon: Video,
        hint: "GET /analysis/video",
      },
    ] as const;
  }, [state]);

  async function load() {
    setState({ status: "loading" });
    try {
      // According to docs:
      // GET /analysis/video -> { code:200, data:{ playCount, likeCount, commentCount } }
      const data = await getVideoAnalysis();
      setState({ status: "success", data });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "加载失败（后端接口尚未实现或不可达）";
      setState({ status: "error", message });
    }
  }

  useEffect(() => {
    // Initial load for dashboard metrics.
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold">仪表盘</h1>
          <p className="text-sm text-muted-foreground">
            基于文档接口渲染：<span className="font-mono">GET /analysis/video</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void load()}
            disabled={state.status === "loading"}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新
          </Button>

          <Button asChild>
            <Link href="/admin/videos">进入视频管理</Link>
          </Button>
        </div>
      </div>

      {state.status === "error" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">数据加载失败</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-muted-foreground">{state.message}</div>
            <div className="text-xs text-muted-foreground">
              说明：当前后端仅有接口/数据库文档，尚未实现。你可以先启动后端后再刷新，或在后续接入
              Mock Server。
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {state.status === "success" && metrics ? (
          metrics.map((m) => {
            const Icon = m.icon;
            return (
              <Card key={m.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium">{m.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold leading-none">
                    {m.value}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {m.hint}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">播放次数</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold leading-none">
                  {state.status === "loading" ? "加载中…" : "—"}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  GET /analysis/video
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">点赞次数</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold leading-none">
                  {state.status === "loading" ? "加载中…" : "—"}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  GET /analysis/video
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">评论次数</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold leading-none">
                  {state.status === "loading" ? "加载中…" : "—"}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  GET /analysis/video
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">快捷入口</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/videos">视频管理</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/users">用户管理</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/analysis">数据分析</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
