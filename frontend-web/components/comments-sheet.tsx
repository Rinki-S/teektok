"use client";

import * as React from "react";
import { SendIcon, Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { cn } from "@/lib/utils";

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

import { getComments, createComment, toggleLikeComment } from "@/services/videoService";
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
  
  // 回复状态
  const [replyTo, setReplyTo] = React.useState<{ id: string; username: string } | null>(null);

  const toId = React.useCallback((value: unknown): string | null => {
    if (value === null || value === undefined) return null;
    return String(value);
  }, []);

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
      await createComment(videoId, inputValue, replyTo?.id);
      setInputValue("");
      setReplyTo(null); // 清除回复状态
      // 重新加载评论
      await loadComments();
    } catch (error) {
      console.error("Failed to post comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // 点赞评论
  const handleLike = async (comment: Comment) => {
    const commentId = toId(comment.id);
    if (!commentId) return;
    // 乐观更新
    const isLiked = !comment.isLiked;
    const newCount = (comment.likeCount || 0) + (isLiked ? 1 : -1);
    
    setComments((prev) =>
      prev.map((c) =>
        toId(c.id) === commentId ? { ...c, isLiked, likeCount: newCount } : c,
      ),
    );

    try {
      await toggleLikeComment(commentId, isLiked);
    } catch (error) {
      console.error("Failed to like comment:", error);
      // 回滚
      setComments((prev) =>
        prev.map((c) =>
          toId(c.id) === commentId
            ? {
                ...c,
                isLiked: !isLiked,
                likeCount: comment.likeCount || 0,
              }
            : c,
        ),
      );
    }
  };

  // 整理评论树 (将扁平列表转为树状结构)
  const { rootComments, childrenByParentId, commentById } = React.useMemo(() => {
    const map = new Map<string, Comment[]>();
    const roots: Comment[] = [];
    const byId = new Map<string, Comment>();

    for (const c of comments) {
      const cid = toId(c.id);
      if (cid) byId.set(cid, c);

      const pid = toId(c.parentId);
      if (!pid) {
        roots.push(c);
        continue;
      }
      const bucket = map.get(pid);
      if (bucket) bucket.push(c);
      else map.set(pid, [c]);
    }

    const byTimeAsc = (a: Comment, b: Comment) => {
      const at = a.createTime ? new Date(a.createTime).getTime() : 0;
      const bt = b.createTime ? new Date(b.createTime).getTime() : 0;
      return at - bt;
    };

    roots.sort(byTimeAsc);
    for (const bucket of map.values()) bucket.sort(byTimeAsc);

    return { rootComments: roots, childrenByParentId: map, commentById: byId };
  }, [comments, toId]);

  const renderChildren = (parentId: unknown) => {
    const pid = toId(parentId);
    if (!pid) return null;
    const children = childrenByParentId.get(pid) ?? [];
    if (children.length === 0) return null;
    return (
      <div className="w-full mt-3 space-y-3">
        {children.map((child) => (
          <React.Fragment key={toId(child.id) || ""}>
            <CommentItem comment={child} />
          </React.Fragment>
        ))}
      </div>
    );
  };

  const CommentItem = ({
    comment,
  }: {
    comment: Comment;
  }) => {
    const parentId = toId(comment.parentId);
    const parentUsername = parentId
      ? commentById.get(parentId)?.username || "未知用户"
      : null;
    const isChild = Boolean(parentId);

    return (
      <div className="w-full">
        <div className="w-full flex items-start justify-between gap-3">
          <div className={cn("min-w-0 flex items-start gap-3", isChild && "pl-10")}>
            <Avatar className={cn("shrink-0", isChild ? "w-6 h-6" : "w-8 h-8")}>
              <AvatarImage src={comment.avatar} />
              <AvatarFallback>
                {comment.username?.slice(0, 1)?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {comment.username || "未知用户"}
                </span>
                <span className="text-xs text-muted-foreground/60">
                  ·{" "}
                  {comment.createTime
                    ? formatDistanceToNow(new Date(comment.createTime), {
                        addSuffix: true,
                        locale: zhCN,
                      })
                    : ""}
                </span>
              </div>

              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {parentUsername
                  ? `回复 ${parentUsername}：${comment.content}`
                  : comment.content}
              </div>

              <div className="flex items-center gap-4 mt-1">
                <button
                  onClick={() =>
                    setReplyTo({
                      id: toId(comment.id) || "",
                      username: comment.username || "未知用户",
                    })
                  }
                  className="text-xs text-muted-foreground font-medium hover:text-foreground"
                >
                  回复
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
            <button
              onClick={() => handleLike(comment)}
              className="text-muted-foreground hover:text-red-500 transition-colors"
            >
              <Heart
                className={cn(
                  "w-4 h-4",
                  comment.isLiked && "fill-red-500 text-red-500",
                )}
              />
            </button>
            {(comment.likeCount || 0) > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {comment.likeCount}
              </span>
            )}
          </div>
        </div>

        {renderChildren(comment.id)}
      </div>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setReplyTo(null);
    }}>
      <SheetTrigger asChild={triggerAsChild}>{children}</SheetTrigger>
      <SheetContent side="bottom" className="!h-[75vh] flex flex-col min-h-0 overflow-hidden p-0 gap-0 rounded-t-xl max-w-lg mx-auto">
        <SheetHeader className="p-4 border-b relative flex flex-row items-center justify-center min-h-[60px]">
          <SheetTitle className="text-center text-sm font-bold">
            {comments.length > 0 ? `${comments.length} 条评论` : "评论"}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0 p-4">
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
              {rootComments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
            </div>
          )}
        </ScrollArea>

        <Separator />

        <div className="shrink-0 p-4 bg-background">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8 shrink-0">
              {/* 这里理论上应该显示当前登录用户的头像 */}
              <AvatarFallback>我</AvatarFallback>
            </Avatar>
            <div className="flex-1 relative flex items-center">
              <Textarea
                placeholder={replyTo ? `回复 @${replyTo.username}...` : "留下你的精彩评论..."}
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
