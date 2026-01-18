"use client";

import * as React from "react";
import { SendIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

import { getComments, createComment } from "@/services/videoService";
import type { Comment } from "@/types/video";

interface CommentsSheetProps {
  videoId: string;
  children?: React.ReactNode;
  triggerAsChild?: boolean;
}

export function CommentsSheet({
  videoId,
  children,
  triggerAsChild = false,
}: CommentsSheetProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // 加载评论
  const loadComments = React.useCallback(async () => {
    if (!videoId) return;
    setLoading(true);
    try {
      // 简单起见，目前只加载第一页，后续可加分页
      const { list } = await getComments(videoId, 1, 50);
      setComments(list);
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  // 打开时加载
  React.useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, loadComments]);

  // 发送评论
  const handleSubmit = async () => {
    if (!inputValue.trim() || submitting) return;

    setSubmitting(true);
    try {
      await createComment(videoId, inputValue);
      setInputValue("");
      // 重新加载评论
      await loadComments();
    } catch (error) {
      console.error("Failed to post comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild={triggerAsChild}>{children}</SheetTrigger>
      <SheetContent side="bottom" className="!h-[75vh] flex flex-col p-0 gap-0 rounded-t-xl max-w-lg mx-auto">
        <SheetHeader className="p-4 border-b relative flex flex-row items-center justify-center min-h-[60px]">
          <SheetTitle className="text-center text-sm font-bold">
            {comments.length > 0 ? `${comments.length} 条评论` : "评论"}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 p-4">
          {loading && comments.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              加载中...
            </div>
          ) : comments.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              暂无评论，快来抢沙发吧
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={comment.avatar} />
                    <AvatarFallback>
                      {comment.username?.slice(0, 1)?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">
                      {comment.username || "未知用户"} ·{" "}
                      {comment.createTime
                        ? formatDistanceToNow(new Date(comment.createTime), {
                            addSuffix: true,
                            locale: zhCN,
                          })
                        : ""}
                    </div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {comment.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <Separator />

        <div className="p-4 bg-background">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8 shrink-0">
              {/* 这里理论上应该显示当前登录用户的头像 */}
              <AvatarFallback>我</AvatarFallback>
            </Avatar>
            <div className="flex-1 relative flex items-center">
              <Textarea
                placeholder="留下你的精彩评论..."
                className="min-h-[40px] max-h-[100px] resize-none pr-10 py-2 w-full"
                rows={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                    }
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-1 h-8 w-8 text-primary hover:text-primary/80"
                onClick={handleSubmit}
                disabled={!inputValue.trim() || submitting}
              >
                <SendIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
