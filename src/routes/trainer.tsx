import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TrainerSidebar } from "@/components/trainer-sidebar";
import { LangToggle } from "@/components/lang-toggle";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/trainer")({
  component: TrainerLayout,
});

function TrainerLayout() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) { nav({ to: "/login", replace: true }); return; }
    const profile = user.profile as any;
    if (profile?.userType && profile.userType !== "trainer") { nav({ to: "/dashboard", replace: true }); return; }
    if (!profile?.onboarded) { nav({ to: "/trainer-onboarding", replace: true }); return; }
  }, [user, loading, nav]);

  if (loading || !user) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <TrainerSidebar />
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
