import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { LangToggle } from "@/components/lang-toggle";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !user) nav({ to: "/login", replace: true });
  }, [user, loading, nav]);

  if (loading || !user) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-30 h-14 border-b border-border/50 bg-background/70 backdrop-blur-lg flex items-center justify-between px-3">
            <SidebarTrigger />
            <LangToggle />
          </header>
          <main className="flex-1 p-4 md:p-8"><Outlet /></main>
        </div>
      </div>
    </SidebarProvider>
  );
}
