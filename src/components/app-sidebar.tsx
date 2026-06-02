import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Dumbbell, Apple, Camera, Sparkles, MessageCircle, User2, LogOut, Trophy, Heart } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { t } = useI18n();
  const { signOut, user } = useAuth();
  const path = useRouterState({ select: (r) => r.location.pathname });

  const items = [
    { url: "/dashboard",    icon: LayoutDashboard, label: t("dashboard") },
    { url: "/workout",      icon: Dumbbell,        label: t("workout") },
    { url: "/nutrition",    icon: Apple,           label: t("nutrition") },
    { url: "/pose",         icon: Camera,          label: t("pose") },
    { url: "/twin",         icon: Sparkles,        label: t("twin") },
    { url: "/chat",         icon: MessageCircle,   label: t("chat") },
    { url: "/achievements", icon: Trophy,          label: t("achievements") },
    { url: "/screening",    icon: Heart,           label: t("screening") },
    { url: "/profile",      icon: User2,           label: t("profile") },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary shadow-glow grid place-items-center font-bold text-primary-foreground">
            F
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-bold tracking-tight">Fitder X</div>
              <div className="text-[10px] text-muted-foreground">AI Health Twin</div>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Menu</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => {
                const active = path === it.url;
                return (
                  <SidebarMenuItem key={it.url}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link to={it.url} className="flex items-center gap-3">
                        <it.icon className="h-4 w-4" />
                        {!collapsed && <span>{it.label}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed && user && (
          <div className="px-2 py-2 text-xs text-muted-foreground truncate">{user.email}</div>
        )}
        <Button variant="ghost" size="sm" onClick={signOut} className="justify-start gap-2">
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>{t("sign_out")}</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
