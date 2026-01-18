"use client";

import * as React from "react";
import { Copy, Link, Send, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface ShareSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCopyLink: () => void;
  onShareToFriend: () => void;
}

export function ShareSheet({
  isOpen,
  onOpenChange,
  onCopyLink,
  onShareToFriend,
}: ShareSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex flex-col p-0 gap-0 rounded-t-xl max-w-lg mx-auto">
        <SheetHeader className="p-4 border-b relative flex flex-row items-center justify-center min-h-[60px]">
          <SheetTitle className="text-center text-sm font-bold">
            分享给
          </SheetTitle>
        </SheetHeader>
        
        <div className="p-4 pb-8">
          {/* 第一行：好友列表（模拟） */}
          <div className="mb-6">
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
               {/* 模拟好友头像 */}
            <div className="flex flex-col items-center gap-2 min-w-[60px]">
               <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full border-dashed"
                onClick={onShareToFriend}
               >
                 <User className="h-6 w-6" />
               </Button>
               <span className="text-xs text-muted-foreground">好友</span>
            </div>
             {/* 也可以添加几个假头像 */}
             {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2 min-w-[60px] opacity-50">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <span className="text-xs text-muted-foreground">用户{i}</span>
                </div>
             ))}
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
