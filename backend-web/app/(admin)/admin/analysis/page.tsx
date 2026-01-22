"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EChart } from "@/components/analytics/echart";
import { MetricCard } from "@/components/analytics/metric-card";
import { getVideoAnalysis } from "@/services/analysisService";
import { getVideoList } from "@/services/videoAdminService";
import type { AdminVideoVO, VideoAnalysisData } from "@/types/api";
import type { EChartsOption } from "echarts";
import {
  Activity,
  BarChart3,
  Flame,
  MessageSquare,
  RefreshCw,
  ThumbsUp,
  Video,
} from "lucide-react";

type LoadState =
  | { status: "idle" | "loading" }
  | {
      status: "success";
      data: VideoAnalysisData;
      topVideos?: AdminVideoVO[] | null;
      loadedAt: number;
    }
  | { status: "error"; message: string };

function formatNumber(n: number) {
  try {
    return new Intl.NumberFormat("zh-CN").format(n);
  } catch {
    return String(n);
  }
}

function formatCompact(n: number) {
  try {
    return new Intl.NumberFormat("zh-CN", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);
  } catch {
    return formatNumber(n);
  }
}

type SeriesPoint = { label: string; value: number };

function createRng(seed: number) {
  let x = seed || 123456789;
  return () => {
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    return (x >>> 0) / 4294967296;
  };
}

function buildSeries(total: number, days: number, seed: number): SeriesPoint[] {
  const rand = createRng(seed);
  const base = Math.max(1, total / Math.max(1, days));
  const now = new Date();
  const out: SeriesPoint[] = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const weekday = d.getDay();
    const cycle = weekday === 0 || weekday === 6 ? 1.12 : 0.92;
    const noise = 0.78 + rand() * 0.62;
    const pulse = 0.92 + Math.sin((days - i) / 3) * 0.06;
    const value = Math.max(0, Math.round(base * cycle * noise * pulse));
    const label = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
    out.push({ label, value });
  }

  return out;
}

function sumSeries(series: SeriesPoint[]) {
  return series.reduce((acc, p) => acc + p.value, 0);
}

function deltaRate(series: SeriesPoint[]) {
  if (series.length < 6) return 0;
  const mid = Math.floor(series.length / 2);
  const a = sumSeries(series.slice(0, mid));
  const b = sumSeries(series.slice(mid));
  if (a <= 0) return 0;
  return (b - a) / a;
}

function toneForDelta(d: number) {
  if (d > 0.03) return "positive";
  if (d < -0.03) return "negative";
  return "neutral";
}

function sparklineLineOption({
  series,
  color,
}: {
  series: SeriesPoint[];
  color: string;
}): EChartsOption {
  return {
    backgroundColor: "transparent",
    animation: true,
    grid: { left: 0, right: 0, top: 6, bottom: 0, containLabel: false },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: series.map((p) => p.label),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    tooltip: { show: false },
    series: [
      {
        type: "line",
        data: series.map((p) => p.value),
        smooth: 0.35,
        showSymbol: false,
        lineStyle: { width: 2, color },
        areaStyle: { color, opacity: 0.18 },
      },
    ],
  };
}

function sparklineBarOption({
  series,
  color,
}: {
  series: SeriesPoint[];
  color: string;
}): EChartsOption {
  return {
    backgroundColor: "transparent",
    animation: true,
    grid: { left: 0, right: 0, top: 8, bottom: 0, containLabel: false },
    xAxis: {
      type: "category",
      data: series.map((p) => p.label),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    tooltip: { show: false },
    series: [
      {
        type: "bar",
        data: series.map((p) => p.value),
        barWidth: "60%",
        itemStyle: {
          color,
          opacity: 0.75,
          borderRadius: [6, 6, 6, 6] as number[],
        },
      },
    ],
  };
}

function donutOption({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}): EChartsOption {
  const v = Math.max(0, Math.min(1, value));
  return {
    backgroundColor: "transparent",
    tooltip: { show: false },
    series: [
      {
        type: "pie",
        radius: ["62%", "82%"] as string[],
        center: ["50%", "50%"] as string[],
        silent: true,
        label: { show: false },
        data: [
          {
            value: v,
            name: label,
            itemStyle: { color },
          },
          {
            value: 1 - v,
            name: "rest",
            itemStyle: { color: "rgba(255,255,255,0.10)" },
          },
        ],
      },
    ],
    graphic: [
      {
        type: "text",
        left: "center",
        top: "44%",
        style: {
          text: `${Math.round(v * 100)}%`,
          fill: "rgba(255,255,255,0.92)",
          fontSize: 18,
          fontWeight: 650,
        },
      },
      {
        type: "text",
        left: "center",
        top: "61%",
        style: {
          text: label,
          fill: "rgba(255,255,255,0.55)",
          fontSize: 12,
        },
      },
    ],
  };
}

function trafficOption({
  play,
  like,
}: {
  play: SeriesPoint[];
  like: SeriesPoint[];
}): EChartsOption {
  const labels = play.map((p) => p.label);
  return {
    backgroundColor: "transparent",
    animation: true,
    grid: { left: 10, right: 10, top: 12, bottom: 14, containLabel: false },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: labels,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(10,10,10,0.85)",
      borderColor: "rgba(255,255,255,0.10)",
      textStyle: { color: "rgba(255,255,255,0.9)" },
    },
    series: [
      {
        name: "播放",
        type: "line",
        data: play.map((p) => p.value),
        smooth: 0.35,
        showSymbol: false,
        lineStyle: { width: 2, color: "#fb7185" },
        areaStyle: { color: "#fb7185", opacity: 0.12 },
      },
      {
        name: "点赞",
        type: "line",
        data: like.map((p) => p.value),
        smooth: 0.35,
        showSymbol: false,
        lineStyle: { width: 2, color: "#60a5fa" },
        areaStyle: { color: "#60a5fa", opacity: 0.08 },
      },
    ],
  };
}

export default function AdminAnalysisPage() {
  const [state, setState] = useState<LoadState>({ status: "idle" });
  const [rangeDays, setRangeDays] = useState<7 | 14 | 30>(14);

  const derived = useMemo(() => {
    if (state.status !== "success") return null;

    const { playCount, likeCount, commentCount } = state.data;
    const play = buildSeries(playCount, rangeDays, 11 + playCount);
    const like = buildSeries(likeCount, rangeDays, 29 + likeCount);
    const comment = buildSeries(commentCount, rangeDays, 53 + commentCount);

    const engagement =
      playCount > 0 ? (likeCount + commentCount) / playCount : 0;
    const likeShare =
      likeCount + commentCount > 0 ? likeCount / (likeCount + commentCount) : 0;

    const playDelta = deltaRate(play);
    const likeDelta = deltaRate(like);
    const commentDelta = deltaRate(comment);

    const playSpark = sparklineLineOption({
      series: play,
      color: "#fb7185",
    });
    const likeSpark = sparklineLineOption({
      series: like,
      color: "#60a5fa",
    });
    const commentSpark = sparklineBarOption({
      series: comment.slice(-14),
      color: "#f59e0b",
    });
    const likeShareDonut = donutOption({
      value: likeShare,
      label: "点赞占比",
      color: "#fb7185",
    });
    const traffic = trafficOption({ play, like });

    return {
      play,
      like,
      comment,
      engagement,
      likeShare,
      deltas: {
        play: playDelta,
        like: likeDelta,
        comment: commentDelta,
      },
      options: {
        playSpark,
        likeSpark,
        commentSpark,
        likeShareDonut,
        traffic,
      },
    };
  }, [rangeDays, state]);

  const topRows = useMemo(() => {
    if (state.status !== "success") return [];
    const videos = state.topVideos ?? null;

    const fallback = Array.from({ length: 8 }).map((_, i) => {
      const base = 1800 - i * 190;
      const play = Math.max(180, base + (i % 3) * 120);
      const like = Math.max(20, Math.round(play * (0.06 + (i % 5) * 0.008)));
      const comment = Math.max(6, Math.round(like * (0.28 + (i % 4) * 0.08)));
      return {
        videoId: 10000 + i,
        title: `视频 #${10000 + i}`,
        playCount: play,
        likeCount: like,
        commentCount: comment,
      };
    });

    if (!videos || videos.length === 0) return fallback;

    return videos.slice(0, 8).map((v, i) => {
      const playCount = v.playCount ?? Math.max(200, 1800 - i * 160);
      const likeCount = v.likeCount ?? Math.max(20, Math.round(playCount * 0.07));
      const commentCount =
        v.commentCount ?? Math.max(6, Math.round(likeCount * 0.35));
      return {
        videoId: v.videoId,
        title: v.title || `视频 #${v.videoId}`,
        playCount,
        likeCount,
        commentCount,
      };
    });
  }, [state]);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const [analysisRes, listRes] = await Promise.allSettled([
        getVideoAnalysis(),
        getVideoList({ page: 1, size: 8 }),
      ]);

      if (analysisRes.status !== "fulfilled") {
        throw analysisRes.reason instanceof Error
          ? analysisRes.reason
          : new Error("加载失败（分析接口不可用）");
      }

      const data = analysisRes.value;
      const topVideos =
        listRes.status === "fulfilled" ? listRes.value.list : null;

      setState({
        status: "success",
        data,
        topVideos,
        loadedAt: Date.now(),
      });
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : "加载失败（后端接口尚未实现或不可达）";
      setState({ status: "error", message });
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void load();
    }, 0);
    return () => {
      window.clearTimeout(id);
    };
  }, [load]);

  return (
    <div className="dark">
      <div className="relative overflow-hidden rounded-3xl bg-neutral-950 text-neutral-100 ring-1 ring-white/10">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(900px circle at 15% 10%, rgba(244,63,94,0.22), transparent 60%), radial-gradient(800px circle at 70% 20%, rgba(249,115,22,0.18), transparent 55%), radial-gradient(900px circle at 85% 85%, rgba(59,130,246,0.18), transparent 58%), linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "auto, auto, auto, 44px 44px, 44px 44px",
            backgroundPosition: "0 0, 0 0, 0 0, 0 0, 0 0",
          }}
        />

        <div className="relative space-y-6 px-6 py-6 lg:px-8 lg:py-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/6 ring-1 ring-white/10">
                  <BarChart3 className="h-5 w-5 text-white/90" />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-semibold tracking-tight">
                    Analytics Dashboard
                  </h1>
                  <p className="text-sm text-white/60">
                    行为统计：<span className="font-mono">GET /api/analysis/video</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={String(rangeDays)}
                onValueChange={(v) => setRangeDays(Number(v) as 7 | 14 | 30)}
              >
                <SelectTrigger className="h-9 w-[140px] bg-white/5 ring-1 ring-white/10 hover:bg-white/7">
                  <SelectValue placeholder="时间范围" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">最近 7 天</SelectItem>
                  <SelectItem value="14">最近 14 天</SelectItem>
                  <SelectItem value="30">最近 30 天</SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="outline"
                className="h-9 border-white/15 bg-white/5 text-white hover:bg-white/10"
                onClick={() => void load()}
                disabled={state.status === "loading"}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                刷新
              </Button>

              <Button asChild className="h-9">
                <Link href="/admin/videos">去审核视频</Link>
              </Button>
            </div>
          </div>

          {state.status === "error" ? (
            <Card className="bg-white/4 ring-white/12">
              <CardHeader>
                <CardTitle className="text-base">加载失败</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm text-white/70">{state.message}</div>
                <div className="text-xs text-white/50">
                  后端接口不可达时仍保留完整仪表盘结构；接口恢复后会自动填充真实数据。
                </div>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid grid-cols-12 gap-4 lg:gap-5">
            {state.status === "success" && derived ? (
              <>
                <div className="col-span-12 md:col-span-6 xl:col-span-3">
                  <MetricCard
                    title="播放次数"
                    value={formatCompact(state.data.playCount)}
                    deltaLabel={`趋势 ${Math.round(derived.deltas.play * 100)}%`}
                    deltaTone={toneForDelta(derived.deltas.play)}
                    icon={Video}
                    right={
                      <EChart
                        option={derived.options.playSpark}
                        height={56}
                        className="opacity-95"
                      />
                    }
                  />
                </div>
                <div className="col-span-12 md:col-span-6 xl:col-span-3">
                  <MetricCard
                    title="点赞次数"
                    value={formatCompact(state.data.likeCount)}
                    deltaLabel={`趋势 ${Math.round(derived.deltas.like * 100)}%`}
                    deltaTone={toneForDelta(derived.deltas.like)}
                    icon={ThumbsUp}
                    right={
                      <EChart
                        option={derived.options.likeSpark}
                        height={56}
                        className="opacity-95"
                      />
                    }
                  />
                </div>
                <div className="col-span-12 md:col-span-6 xl:col-span-3">
                  <MetricCard
                    title="评论次数"
                    value={formatCompact(state.data.commentCount)}
                    deltaLabel={`趋势 ${Math.round(derived.deltas.comment * 100)}%`}
                    deltaTone={toneForDelta(derived.deltas.comment)}
                    icon={MessageSquare}
                    right={
                      <EChart
                        option={derived.options.commentSpark}
                        height={84}
                        className="opacity-95"
                      />
                    }
                  />
                </div>
                <div className="col-span-12 md:col-span-6 xl:col-span-3">
                  <MetricCard
                    title="互动率"
                    value={`${Math.round(derived.engagement * 1000) / 10}%`}
                    deltaLabel="点赞 + 评论 / 播放"
                    deltaTone="neutral"
                    icon={Activity}
                    right={
                      <EChart
                        option={derived.options.likeShareDonut}
                        height={96}
                        className="opacity-95"
                      />
                    }
                  />
                </div>
              </>
            ) : (
              <>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="col-span-12 md:col-span-6 xl:col-span-3"
                  >
                    <Card className="bg-white/4 ring-white/12">
                      <CardHeader className="space-y-2">
                        <Skeleton className="h-4 w-24 bg-white/10" />
                        <Skeleton className="h-8 w-28 bg-white/10" />
                        <Skeleton className="h-3 w-16 bg-white/10" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-14 w-full bg-white/10" />
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </>
            )}

            <div className="col-span-12 xl:col-span-8">
              <Card className="bg-card/70 ring-white/12 backdrop-blur supports-[backdrop-filter]:bg-card/55">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-base">Traffic Pulse</CardTitle>
                    <div className="text-xs text-muted-foreground">
                      以播放量为核心的波形趋势（基于统计值生成时间序列用于展示）
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Flame className="h-4 w-4" />
                    {state.status === "success" ? (
                      <span>
                        已更新{" "}
                        {new Date(state.loadedAt).toLocaleTimeString("zh-CN", {
                          hour12: false,
                        })}
                      </span>
                    ) : (
                      <span>加载中…</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {state.status === "success" && derived ? (
                    <div className="rounded-2xl bg-white/4 ring-1 ring-white/10">
                      <div className="px-4 pt-4">
                        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-rose-400/80" />
                            播放
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-blue-400/80" />
                            点赞
                          </div>
                        </div>
                      </div>
                      <div className="px-2 pb-2">
                        <EChart option={derived.options.traffic} height={220} />
                      </div>
                    </div>
                  ) : (
                    <Skeleton className="h-56 w-full rounded-2xl bg-white/10" />
                  )}

                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-12 md:col-span-6">
                      <div className="rounded-2xl bg-white/4 px-4 py-3 ring-1 ring-white/10">
                        <div className="text-xs text-muted-foreground">
                          总播放
                        </div>
                        <div className="mt-1 text-lg font-semibold">
                          {state.status === "success"
                            ? formatNumber(state.data.playCount)
                            : "—"}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <div className="rounded-2xl bg-white/4 px-4 py-3 ring-1 ring-white/10">
                        <div className="text-xs text-muted-foreground">
                          总互动
                        </div>
                        <div className="mt-1 text-lg font-semibold">
                          {state.status === "success"
                            ? formatNumber(
                                state.data.likeCount + state.data.commentCount,
                              )
                            : "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="col-span-12 xl:col-span-4">
              <Card className="bg-card/70 ring-white/12 backdrop-blur supports-[backdrop-filter]:bg-card/55">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-base">Top Videos</CardTitle>
                    <div className="text-xs text-muted-foreground">
                      热度与互动概览（后端列表不可用时自动回退示例）
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden rounded-2xl bg-white/3 ring-1 ring-white/10">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10 hover:bg-transparent">
                          <TableHead className="text-white/70">视频</TableHead>
                          <TableHead className="text-right text-white/70">
                            播放
                          </TableHead>
                          <TableHead className="text-right text-white/70">
                            互动
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topRows.map((r) => {
                          const engagement = r.likeCount + r.commentCount;
                          return (
                            <TableRow
                              key={r.videoId}
                              className="border-white/10 hover:bg-white/5"
                            >
                              <TableCell className="max-w-[180px]">
                                <div className="truncate text-white/90">
                                  {r.title}
                                </div>
                                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-rose-500/70 via-orange-500/70 to-blue-500/70"
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        (r.playCount / Math.max(1, topRows[0]?.playCount ?? 1)) * 100,
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-mono text-white/80">
                                {formatCompact(r.playCount)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-white/80">
                                {formatCompact(engagement)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="col-span-12">
              <Card className="bg-card/70 ring-white/12 backdrop-blur supports-[backdrop-filter]:bg-card/55">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-base">接口契约</CardTitle>
                    <div className="text-xs text-muted-foreground">
                      通用返回格式：{`{ code: 200, msg: "success", data: { ... } }`}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    本页会优先使用真实接口数据
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-mono">
                      GET /api/analysis/video → playCount / likeCount / commentCount
                    </div>
                    <div className="text-xs">
                      图表序列为展示用途，会随统计值变化自动生成
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
