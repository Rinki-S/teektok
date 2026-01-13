"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { setUserStatus } from "@/services/adminService";
import type { AdminUserRow, DbUserStatus } from "@/types/admin";
import { mapDbUserStatusToAdminUserStatusAction } from "@/types/admin";
import {
  Ban,
  CheckCircle2,
  RefreshCw,
  Search,
  ShieldAlert,
  Users,
} from "lucide-react";

type LoadState =
  | { status: "idle" | "loading"; items: AdminUserRow[] }
  | { status: "success"; items: AdminUserRow[] }
  | { status: "error"; items: AdminUserRow[]; message: string };

type ConfirmState =
  | { open: false }
  | {
      open: true;
      user: AdminUserRow;
      nextDbStatus: DbUserStatus;
    };

function fmtTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

function statusBadge(status: DbUserStatus) {
  // DB design: 0 normal, 1 frozen
  if (status === 0) {
    return (
      <Badge variant="secondary" className="gap-1">
        <CheckCircle2 className="h-3.5 w-3.5" />
        正常
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="gap-1">
      <Ban className="h-3.5 w-3.5" />
      冻结
    </Badge>
  );
}

function mockUsers(): AdminUserRow[] {
  // Backend docs currently do not provide an admin user list API.
  // This mock lets you build the UI now and replace it later with real endpoints.
  const now = Date.now();
  return [
    {
      id: 1,
      username: "testuser",
      status: 0,
      avatarUrl: null,
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 12).toISOString(),
    },
    {
      id: 2,
      username: "normal_user_02",
      status: 0,
      avatarUrl: null,
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 5).toISOString(),
    },
    {
      id: 3,
      username: "frozen_user_03",
      status: 1,
      avatarUrl: null,
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
    },
  ];
}

export default function AdminUsersPage() {
  const [state, setState] = useState<LoadState>({ status: "idle", items: [] });
  const [keyword, setKeyword] = useState("");
  const [onlyFrozen, setOnlyFrozen] = useState(false);

  const [confirm, setConfirm] = useState<ConfirmState>({ open: false });
  const [isMutating, setIsMutating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setToast(null);
    // No /admin/user/list in docs, so we keep mock for now.
    setState({ status: "loading", items: state.items });
    try {
      // Replace this with a real call once backend provides user list API.
      const items = mockUsers();
      setState({ status: "success", items });
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "加载失败（后端接口尚未实现或不可达）";
      setState({ status: "error", items: state.items, message });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return state.items.filter((u) => {
      if (onlyFrozen && u.status !== 1) return false;
      if (!kw) return true;
      return String(u.id).includes(kw) || u.username.toLowerCase().includes(kw);
    });
  }, [state.items, keyword, onlyFrozen]);

  const openConfirm = (user: AdminUserRow, nextDbStatus: DbUserStatus) => {
    setConfirm({ open: true, user, nextDbStatus });
  };

  const closeConfirm = () => setConfirm({ open: false });

  const doUpdateStatus = async () => {
    if (!confirm.open) return;

    const { user, nextDbStatus } = confirm;

    setIsMutating(true);
    setToast(null);

    try {
      // Docs endpoint: POST /admin/user/status
      // Body: { userId, status } with status meaning:
      //   status: 0 冻结, 1 正常  (API doc)
      //
      // DB status: 0 正常, 1 冻结 (DB doc)
      //
      // So we must map: nextDbStatus -> action.
      const actionStatus = mapDbUserStatusToAdminUserStatusAction(nextDbStatus);

      await setUserStatus({ userId: user.id, status: actionStatus });

      setState((prev) => {
        const next = prev.items.map((it) =>
          it.id === user.id ? { ...it, status: nextDbStatus } : it,
        );
        return prev.status === "error"
          ? { status: "success", items: next }
          : { ...prev, items: next };
      });

      setToast("操作已提交（待后端实现后可验证真实效果）");
      closeConfirm();
    } catch (e) {
      const message = e instanceof Error ? e.message : "操作失败，请稍后再试";
      setToast(message);
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Users className="h-5 w-5" />
            用户管理
          </h1>
          <p className="text-sm text-muted-foreground">
            重点动作来自文档接口：
            <span className="font-mono">POST /admin/user/status</span>
            （列表接口文档未提供，当前使用 mock）
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
            <Link href="/admin">返回仪表盘</Link>
          </Button>
        </div>
      </div>

      {state.status === "error" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">加载失败</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {state.message}
          </CardContent>
        </Card>
      ) : null}

      {toast ? (
        <div className="rounded-md border px-3 py-2 text-sm">{toast}</div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">筛选</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field>
            <FieldLabel>关键词（ID / 用户名）</FieldLabel>
            <FieldContent>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="例如：testuser / 3"
                  className="pl-9"
                />
              </div>
            </FieldContent>
          </Field>

          <div className="flex items-end gap-3">
            <div className="flex flex-1 items-center justify-between rounded-md border px-3 py-2">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">仅看冻结</div>
                <div className="text-xs text-muted-foreground">
                  status = 冻结
                </div>
              </div>
              <Switch checked={onlyFrozen} onCheckedChange={setOnlyFrozen} />
            </div>
          </div>

          <div className="text-xs text-muted-foreground md:self-end">
            当前显示：{filtered.length} / {state.items.length}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">用户列表</CardTitle>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[90px]">用户ID</TableHead>
                <TableHead>用户名</TableHead>
                <TableHead className="w-[120px]">状态</TableHead>
                <TableHead className="w-[180px]">注册时间</TableHead>
                <TableHead className="w-[220px]" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-sm text-muted-foreground"
                  >
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => {
                  const isFrozen = u.status === 1;

                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-mono">{u.id}</TableCell>
                      <TableCell className="font-medium">
                        {u.username}
                      </TableCell>
                      <TableCell>{statusBadge(u.status)}</TableCell>
                      <TableCell>{fmtTime(u.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {isFrozen ? (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => openConfirm(u, 0)}
                              disabled={isMutating}
                            >
                              解封
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() => openConfirm(u, 1)}
                              disabled={isMutating}
                            >
                              冻结
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          <div className="mt-3 text-xs text-muted-foreground">
            说明：当前页面仅实现「冻结/解封」动作对接文档接口，
            用户列表数据来源待后端补充（建议新增{" "}
            <span className="font-mono">GET /admin/user/list</span>{" "}
            或复用现有用户模块接口）。
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={confirm.open}
        onOpenChange={(open) => (open ? null : closeConfirm())}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-muted-foreground" />
              确认操作
            </DialogTitle>
            <DialogDescription>
              {confirm.open ? (
                <>
                  你将对用户{" "}
                  <span className="font-mono">#{confirm.user.id}</span>{" "}
                  <span className="font-semibold">{confirm.user.username}</span>{" "}
                  执行：
                  <span className="ml-1 font-semibold">
                    {confirm.nextDbStatus === 1 ? "冻结" : "解封"}
                  </span>
                  。
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            将调用接口：
            <span className="font-mono">POST /admin/user/status</span>
            <br />
            Body 示例：
            <span className="ml-1 font-mono">{"{ userId, status }"}</span>
            （文档 status：0 冻结，1 正常）
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeConfirm}
              disabled={isMutating}
            >
              取消
            </Button>
            <Button
              type="button"
              onClick={() => void doUpdateStatus()}
              disabled={isMutating}
            >
              {isMutating ? "提交中..." : "确认提交"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
