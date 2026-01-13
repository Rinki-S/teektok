"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getVideoAnalysis } from "@/services/videoAdminService";
import type { VideoAnalysisData } from "@/types/api";
import { BarChart3, RefreshCw, Video, MessageSquare, ThumbsUp } from "lucide-react";

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

export default function AdminAnalysisPage() {
  const [state, setState] = useState<LoadState>({ status: "idle" });

  const cards = useMemo(() => {
    if (state.status !== "success") return null;

    const { playCount, likeCount, commentCount } = state.data;

    return [
      {
        title: "播放次数",
        value: formatNumber(playCount),
        icon: Video,
        hint: "GET /analysis/video",
      },
      {
        title: "点赞次数",
        value: formatNumber(likeCount),
        icon: ThumbsUp,
        hint: "GET /analysis/video",
      },
      {
        title: "评论次数",
        value: formatNumber(commentCount),
        icon: MessageSquare,
        hint: "GET /analysis/video",
      },
    ] as const;
  }, [state]);

  async function load() {
    setState({ status: "loading" });
    try {
      // Docs:
      // GET /analysis/video
      // Response example:
      // { code: 200, data: { playCount: 1000, likeCount: 500, commentCount: 200 } }
      const data = await getVideoAnalysis();
      setState({ status: "success", data });
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : "加载失败（后端接口尚未实现或不可达）";
      setState({ status: "error", message });
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold">数据分析</h1>
          <p className="text-sm text-muted-foreground">
            行为统计（文档接口）：<span className="font-mono">GET /analysis/video</span>
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
            <Link href="/admin/videos">去审核视频</Link>
          </Button>
        </div>
      </div>

      {state.status === "error" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">加载失败</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-muted-foreground">{state.message}</div>
            <div className="text-xs text-muted-foreground">
              当前后端只有接口/数据库文档，可能还没有实现服务；你可以先启动后端或后续接入 Mock。
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {state.status === "success" && cards ? (
          cards.map((c) => {
            const Icon = c.icon;
            return (
              <Card key={c.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-sm font-medium">{c.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold leading-none">{c.value}</div>
                  <div className="mt-2 text-xs text-muted-foreground">{c.hint}</div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">播放次数</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold leading-none">
                  {state.status === "loading" ? "加载中…" : "—"}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">GET /analysis/video</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">点赞次数</CardTitle>
                <ThumbsUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold leading-none">
                  {state.status === "loading" ? "加载中…" : "—"}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">GET /analysis/video</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium">评论次数</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold leading-none">
                  {state.status === "loading" ? "加载中…" : "—"}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">GET /analysis/video</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-base">接口说明</CardTitle>
            <div className="text-sm text-muted-foreground">
              <span className="font-mono">GET /analysis/video</span> 返回播放、点赞、评论统计
            </div>
          </div>
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div>通用返回格式（文档）：{`{ code: 200, msg: "success", data: { ... } }`}</div>
          <div className="text-xs">
            注意：当后端还没实现时，本页会显示错误提示，但页面结构与接口契约保持一致，后续对接无需改 UI 结构。
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
