"use client";

import * as React from "react";
import { Link, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getCurrentUserId, getFriendList } from "@/services/videoService";

interface ShareSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCopyLink: () => void;
  onShareToFriend: (targetUserId: number) => void;
}

export function ShareSheet({
  isOpen,
  onOpenChange,
  onCopyLink,
  onShareToFriend,
}: ShareSheetProps) {
  const [friends, setFriends] = React.useState<
    { id: number; username: string; avatar?: string }[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    if (!getCurrentUserId()) {
      setFriends([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    getFriendList()
      .then((data) => {
        if (cancelled) return;
        setFriends(data || []);
      })
      .catch(() => {
        if (cancelled) return;
        setFriends([]);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex flex-col p-0 gap-0 rounded-t-xl max-w-lg mx-auto">
        <SheetHeader className="p-4 border-b relative flex flex-row items-center justify-center min-h-[60px]">
          <SheetTitle className="text-center text-sm font-bold">
            分享给
          </SheetTitle>
        </SheetHeader>
        
        <div className="p-4 pb-8">
          <div className="mb-6">
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {!getCurrentUserId() ? (
                <div className="flex items-center gap-3">
                  <div className="text-sm text-muted-foreground">
                    登录后可分享给好友
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(new Event("teektok:open-login"));
                      }
                    }}
                  >
                    去登录
                  </Button>
                </div>
              ) : isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-2 min-w-[60px]"
                  >
                    <div className="h-12 w-12 rounded-full bg-muted" />
                    <span className="text-xs text-muted-foreground">加载中</span>
                  </div>
                ))
              ) : friends.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  暂无朋友（互相关注）
                </div>
              ) : (
                friends.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className="flex flex-col items-center gap-2 min-w-[60px]"
                    onClick={() => onShareToFriend(u.id)}
                  >
                    <Avatar className="h-12 w-12 border border-border">
                      <AvatarImage src={u.avatar} alt={u.username} />
                      <AvatarFallback>{u.username.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span className="max-w-[60px] truncate text-xs text-muted-foreground">
                      {u.username}
                    </span>
                  </button>
                ))
              )}
          </div>
        </div>

        <div className="h-px w-full bg-border mb-6" />

        {/* 第二行：操作按钮 */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex flex-col items-center gap-2 min-w-[60px]">
            <Button
              variant="secondary"
              size="icon"
              className="h-12 w-12 rounded-full bg-secondary hover:bg-secondary/80"
              onClick={onCopyLink}
            >
              <Link className="h-6 w-6" />
            </Button>
            <span className="text-xs text-muted-foreground">复制链接</span>
          </div>
          
           <div className="flex flex-col items-center gap-2 min-w-[60px]">
            <Button
              variant="secondary"
              size="icon"
              className="h-12 w-12 rounded-full bg-green-100 hover:bg-green-200 dark:bg-green-900"
              onClick={() => toast.info("微信分享开发中")}
            >
              <Send className="h-6 w-6 text-green-600 dark:text-green-400" />
            </Button>
            <span className="text-xs text-muted-foreground">微信</span>
          </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
