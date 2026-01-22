"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { clearAdminAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  Video,
  Users,
  BarChart3,
  LogOut,
  Shield,
} from "lucide-react";

type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV: NavItem[] = [
  { title: "仪表盘", href: "/admin", icon: LayoutDashboard },
  { title: "视频管理", href: "/admin/videos", icon: Video },
  { title: "用户管理", href: "/admin/users", icon: Users },
  { title: "数据分析", href: "/admin/analysis", icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const handleLogout = () => {
    clearAdminAuth();

    // Clear cookie used by middleware route protection.
    // Must match `middleware.ts` and login page cookie name.
    const cookieName = "teektok_admin_token";
    document.cookie = `${cookieName}=; Path=/; Max-Age=0; SameSite=Lax`;

    // Use hard navigation so all client state resets.
    window.location.href = "/admin/login";
  };

  return (
    <SidebarProvider>
      <div className="flex h-dvh w-full bg-background">
        <Sidebar className="border-r">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Shield className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold leading-tight">
                  Teektok 管理后台
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  Admin Console
                </div>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>导航</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {NAV.map((item) => {
                    const active =
                      pathname === item.href ||
                      (item.href !== "/admin" &&
                        pathname?.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={active}>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center gap-2",
                              active && "font-medium",
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <Separator className="my-2" />

            <div className="px-3 pb-3 text-xs text-muted-foreground">
              <div className="leading-relaxed">
                API 基础路径（文档）:
                <span className="ml-1 font-mono">
                  http://localhost:8080/api
                </span>
              </div>
            </div>
          </SidebarContent>

          <SidebarFooter>
            <div className="px-2 py-2">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                退出登录
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center gap-3 border-b px-4">
            <SidebarTrigger className="md:hidden" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">管理后台</div>
              <div className="truncate text-xs text-muted-foreground">
                {pathname}
              </div>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-auto">
            <div className="mx-auto w-full max-w-screen-2xl px-4 py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
