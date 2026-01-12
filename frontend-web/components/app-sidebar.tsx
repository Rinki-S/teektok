import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
} from "@/components/ui/sidebar"
import { Divide, Music2, Sparkles, ThumbsUp, TrendingUp, UserRound, UserRoundCheck, UsersRound } from "lucide-react"
import { Separator } from "@/components/ui/separator"

const itemsRecommend = [
    {
        title: "精选",
        url: "#",
        icon: ThumbsUp,
    },
    {
        title: "推荐",
        url: "#",
        icon: Sparkles,
    },
    {
        title: "热门",
        url: "#",
        icon: TrendingUp,
    }
]

const itemsUser = [
    {
        title: "关注",
        url: "#",
        icon: UserRoundCheck,
    },
    {
        title: "朋友",
        url: "#",
        icon: UsersRound,
    },
    {
        title: "我的",
        url: "#",
        icon: UserRound,
    },
]

export function AppSidebar() {
    return (
        <Sidebar className="border-0!">
            <SidebarHeader>
                <div className="flex flex-row justify-left items-center mx-4 mt-2 gap-1">
                    <Music2 strokeWidth={4} size={24} />
                    <div className="font-bold text-xl">Teektok</div>
                </div>
            </SidebarHeader>
            <SidebarContent className="mx-2">
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu className="w-auto">
                            {itemsRecommend.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild className="h-10">
                                        <a href={item.url} className="flex flex-row gap-3 px-5 text-neutral-400 hover:bg-neutral-700! transition-colors rounded-xl">
                                            <item.icon className="h-5! w-5!" />
                                            <span className="text-[16px] font-medium pt-0.5">{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                <Separator className="mx-3! w-auto! border-neutral-700" />
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu className="w-auto">
                            {itemsUser.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild className="h-10">
                                        <a href={item.url} className="flex flex-row gap-3 px-5 text-neutral-400 hover:bg-neutral-700! transition-colors rounded-xl">
                                            <item.icon className="h-5! w-5!" />
                                            <span className="text-[16px] font-medium pt-0.5">{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter />
        </Sidebar>
    )
}