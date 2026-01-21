"use client";

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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Music2,
  Sparkles,
  TrendingUp,
  Upload,
  UserRound,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { usePathname } from "next/navigation";

const itemsRecommend = [
  {
    title: "热门",
    url: "/trending",
    icon: TrendingUp,
  },
  {
    title: "推荐",
    url: "/recommend",
    icon: Sparkles,
  },
];

const itemsUser = [
  {
    title: "关注",
    url: "/following",
    icon: UserRoundCheck,
  },
  {
    title: "朋友",
    url: "/friends",
    icon: UsersRound,
  },
  {
    title: "我的",
    url: "/me",
    icon: UserRound,
  },
];

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Exact match for now (works for your current flat routes: /, /recommend, /trending, /following, /friends, /me)
  const isActive = pathname === href;

  const className = [
    "flex flex-row h-10 items-center gap-3 px-5 text-neutral-400 hover:bg-neutral-700! transition-colors rounded-xl",
    isActive ? "bg-neutral-700! text-white" : "",
  ].join(" ");

  return (
    <Link
      href={href}
      className={className}
      aria-current={isActive ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

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
                    <NavLink href={item.url}>
                      <item.icon className="h-5! w-5!" />
                      <span className="text-[16px] font-medium pt-0.5">
                        {item.title}
                      </span>
                    </NavLink>
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
                  <SidebarMenuButton asChild>
                    <NavLink href={item.url}>
                      <item.icon className="h-5! w-5!" />
                      <span className="text-[16px] font-medium pt-0.5">
                        {item.title}
                      </span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="mx-2 mb-2">
        <Button
          asChild
          className="h-10 w-full justify-start gap-3 rounded-xl px-5"
        >
          <Link href="/upload">
            <Upload className="h-5! w-5!" />
            <span className="text-[16px] font-medium pt-0.5">上传</span>
          </Link>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
