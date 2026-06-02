import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Compass, Sparkles, Calendar, Camera, User2, LogOut } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const NAV = [
  { url: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { url: "/discover",  icon: Compass,         label: "Discover"   },
  { url: "/matches",   icon: Sparkles,        label: "Matches"    },
  { url: "/bookings",  icon: Calendar,        label: "Bookings"   },
  { url: "/pose",      icon: Camera,          label: "AI Pose"    },
  { url: "/profile",   icon: User2,           label: "Profile"    },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, user } = useAuth();
  const path = useRouterState({ select: (r) => r.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary shadow-glow grid place-items-center font-bold text-primary-foreground shrink-0">
            F
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-bold tracking-tight">Fitder X</div>
              <div className="text-[10px] text-muted-foreground">AI Trainer Match</div>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((it) => {
                const active = path === it.url || path.startsWith(it.url + "/");
                return (
                  <SidebarMenuItem key={it.url}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link to={it.url} className="flex items-center gap-3">
                        <it.icon className="h-4 w-4 shrink-0" />
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
          <div className="px-2 py-1 text-xs text-muted-foreground truncate">{user.email}</div>
        )}
        <Button variant="ghost" size="sm" onClick={signOut} className="justify-start gap-2">
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sign out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
