"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  deleteVideo as deleteVideoApi,
  getVideoList,
  markVideoHot,
} from "@/services/videoAdminService";
import type { AdminVideoVO } from "@/types/api";
import { cn } from "@/lib/utils";
import {
  Flame,
  ClipboardCheck,
  RefreshCw,
  ShieldAlert,
  Trash2,
} from "lucide-react";

type VideoRow = AdminVideoVO;

type LoadState =
  | { status: "idle" | "loading" }
  | { status: "success"; items: VideoRow[] }
  | { status: "error"; message: string };

function formatNumber(n: number | undefined) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  try {
    return new Intl.NumberFormat("zh-CN").format(n);
  } catch {
    return String(n);
  }
}

function parseId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

// Pagination helper: simple page window for UI.
function getPageItems(current: number, total: number) {
  const pages: (number | "…")[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }
  const push = (x: number | "…") => pages.push(x);

  push(1);
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);

  if (left > 2) push("…");
  for (let i = left; i <= right; i++) push(i);
  if (right < total - 1) push("…");
  push(total);

  return pages;
}

export default function AdminVideosPage() {
  const [state, setState] = useState<LoadState>({ status: "idle" });

  // Docs: GET /video/list?page&size
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);

  // Docs don't support filtering; keep client-side keyword filter for usability.
  const [keyword, setKeyword] = useState("");

  // Action-level pending states to avoid double-submit per row.
  const [pendingById, setPendingById] = useState<
    Record<number, { audit?: boolean; hot?: boolean; del?: boolean }>
  >({});

  // Total is unknown from docs (no pagination metadata). Keep it UI-only.
  const [totalPages, setTotalPages] = useState<number>(1);

  const filteredItems = useMemo(() => {
    if (state.status !== "success") return [];
    const kw = keyword.trim().toLowerCase();
    if (!kw) return state.items;
    return state.items.filter((x) => x.title?.toLowerCase().includes(kw));
  }, [state, keyword]);

  async function load() {
    setState({ status: "loading" });
    try {
      const result = await getVideoList({ page, size });
      setState({ status: "success", items: result.list ?? [] });

      const nextTotalPages = Math.max(1, Math.ceil((result.total ?? 0) / size));
      setTotalPages(nextTotalPages);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "加载失败（后端接口尚未实现或不可达）";
      setState({ status: "error", message });
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size]);

  function setPending(
    videoId: number,
    patch: Partial<{ audit: boolean; hot: boolean; del: boolean }>,
  ) {
    setPendingById((prev) => ({
      ...prev,
      [videoId]: { ...(prev[videoId] ?? {}), ...patch },
    }));
  }

  function updateLocal(videoId: number, updater: (row: VideoRow) => VideoRow) {
    setState((prev) => {
      if (prev.status !== "success") return prev;
      return {
        status: "success",
        items: prev.items.map((r) => (r.videoId === videoId ? updater(r) : r)),
      };
    });
  }

  async function onToggleHot(videoId: number, nextHot: 0 | 1) {
    setPending(videoId, { hot: true });
    try {
      await markVideoHot(videoId, nextHot);
      updateLocal(videoId, (r) => ({ ...r, isHot: nextHot }));
    } finally {
      setPending(videoId, { hot: false });
    }
  }

  async function onDelete(videoId: number) {
    setPending(videoId, { del: true });
    try {
      // Docs: DELETE /admin/video/delete/{videoId}
      await deleteVideoApi({ videoId });
      setState((prev) => {
        if (prev.status !== "success") return prev;
        return {
          status: "success",
          items: prev.items.filter((x) => x.videoId !== videoId),
        };
      });
    } finally {
      setPending(videoId, { del: false });
    }
  }

  const pageItems = useMemo(
    () => getPageItems(page, totalPages),
    [page, totalPages],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold">视频管理</h1>
          <div className="mt-1 text-sm text-muted-foreground">
            接口：<span className="font-mono">GET /api/admin/video/list</span>、{" "}
            <span className="font-mono">POST /admin/video/audit</span>、{" "}
            <span className="font-mono">POST /admin/video/hot</span>、{" "}
            <span className="font-mono">
              DELETE /admin/video/delete/{`{videoId}`}
            </span>
          </div>
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

          <Button asChild variant="secondary">
            <Link href="/admin/analysis">
              <ClipboardCheck className="mr-2 h-4 w-4" />
              查看分析
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-base">列表</CardTitle>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Field>
              <FieldLabel>关键词（仅前端过滤）</FieldLabel>
              <FieldContent>
                <Input
                  placeholder="按标题搜索"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>每页条数（page size）</FieldLabel>
              <FieldContent>
                <Input
                  inputMode="numeric"
                  value={String(size)}
                  onChange={(e) => {
                    const n = parseId(e.target.value);
                    if (!n) return;
                    const next = Math.max(1, Math.min(50, n));
                    setSize(next);
                    setPage(1);
                  }}
                />
              </FieldContent>
            </Field>

            <div className="flex items-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setKeyword("");
                }}
              >
                清空过滤
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {state.status === "error" ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                <span>{state.message}</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                当前后端未实现时，你依然可以检查 UI 流程与接口对齐情况。
              </div>
            </div>
          ) : null}

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">视频ID</TableHead>
                  <TableHead>标题</TableHead>
                  <TableHead className="w-[140px] text-right">播放量</TableHead>
                  <TableHead className="w-[160px]">热门</TableHead>
                  <TableHead className="w-[200px]">状态</TableHead>
                  <TableHead className="w-[140px]">审核</TableHead>
                  <TableHead className="w-[220px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {state.status === "loading" ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      加载中…
                    </TableCell>
                  </TableRow>
                ) : null}

                {state.status === "success" && filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : null}

                {state.status === "success"
                  ? filteredItems.map((row) => {
                      const videoId = row.videoId;
                      const pending = pendingById[videoId] ?? {};

                      const auditBadge =
                        row.status === 1 ? (
                          <Badge variant="secondary">已通过</Badge>
                        ) : row.status === 2 ? (
                          <Badge variant="destructive">已拒绝</Badge>
                        ) : (
                          <Badge variant="outline">待审核</Badge>
                        );

                      return (
                        <TableRow key={videoId}>
                          <TableCell className="font-mono">{videoId}</TableCell>
                          <TableCell className="max-w-[520px]">
                            <div className="truncate font-medium">
                              {row.title}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatNumber(row.playCount)}
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={(row.isHot ?? 0) === 1}
                                disabled={!!pending.hot}
                                onCheckedChange={(checked) => {
                                  const nextHot: 0 | 1 = checked ? 1 : 0;
                                  void onToggleHot(videoId, nextHot);
                                }}
                              />
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Flame
                                  className={cn(
                                    "h-3.5 w-3.5",
                                    (row.isHot ?? 0) === 1 && "text-orange-500",
                                  )}
                                />
                                <span>
                                  {(row.isHot ?? 0) === 1 ? "热门" : "普通"}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            {auditBadge}
                          </TableCell>

                          <TableCell>
                            <Button asChild type="button" size="sm" variant="outline">
                              <Link href={`/admin/videos/${videoId}/audit`}>审核</Link>
                            </Button>
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    disabled={!!pending.del}
                                    className="gap-2"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    删除
                                  </Button>
                                </AlertDialogTrigger>

                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      确认删除该视频？
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      将调用接口：{" "}
                                      <span className="font-mono">
                                        DELETE /admin/video/delete/{videoId}
                                      </span>
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>取消</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => void onDelete(videoId)}
                                      className={cn("gap-2")}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      删除
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  : null}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              当前页：<span className="font-mono">{page}</span>，每页：{" "}
              <span className="font-mono">{size}</span>（总页数为前端推断）
            </div>

            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.max(1, p - 1));
                    }}
                    className={cn(
                      page <= 1 && "pointer-events-none opacity-50",
                    )}
                  />
                </PaginationItem>

                {pageItems.map((p, idx) =>
                  p === "…" ? (
                    <PaginationItem key={`ellipsis-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={p}>
                      <PaginationLink
                        href="#"
                        isActive={p === page}
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(p);
                        }}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.min(totalPages, p + 1));
                    }}
                    className={cn(
                      page >= totalPages && "pointer-events-none opacity-50",
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>

          <div className="text-xs text-muted-foreground">
            <span className="font-mono">status</span>：0待审核 / 1通过 / 2拒绝，
            <span className="font-mono">isHot</span>：0否 / 1是
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
