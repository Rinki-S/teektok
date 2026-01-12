"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar" // if you have avatar; otherwise use a simple circle div
import { Bookmark, Heart, MessageCircle, Plus, Share2 } from "lucide-react"

export function ShortsActions() {
    return (
        <div className="flex flex-col items-center gap-2 p-4 rounded-2xl">
            <div className="relative flex flex-col items-center mb-4">
                <Avatar className="w-14 h-14 border-2 border-primary">
                    <AvatarFallback>UP</AvatarFallback>
                </Avatar>
                <Button size="icon-xs" className="absolute bottom-0 translate-y-1/2 rounded-full">
                    <Plus strokeWidth={4} />
                </Button>
            </div>
            <div className="flex flex-col">
                <Button variant="ghost" className="rounded-full w-14 h-14">
                    <Heart className="size-8" />
                </Button>
                <div className="text-center text-[16px] font-bold mt-1">1.2K</div>
            </div>

            <div className="flex flex-col">
                <Button variant="ghost" className="rounded-full w-14 h-14">
                    <MessageCircle className="size-8" />
                </Button>
                <div className="text-center text-[16px] font-bold mt-1">345</div>
            </div>

            <div className="flex flex-col">
                <Button variant="ghost" className="rounded-full w-14 h-14">
                    <Bookmark className="size-8" />
                </Button>
                <div className="text-center text-[16px] font-bold mt-1">收藏</div>
            </div>

            <div className="flex flex-col">
                <Button variant="ghost" className="rounded-full w-14 h-14">
                    <Share2 className="size-8" />
                </Button>
                <div className="text-center text-[16px] font-bold mt-1">分享</div>
            </div>
        </div>
    )
}