import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — Fitder X" }] }),
  component: SignupPage,
});

function SignupPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && user) nav({ to: "/onboarding", replace: true });
  }, [user, loading, nav]);

  return (
    <div className="min-h-screen bg-gradient-hero grid place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="glass rounded-[2rem] border border-white/10 p-8 shadow-card text-center">
          <div className="flex items-center gap-2 mb-8 justify-center">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center font-bold text-primary-foreground">F</div>
            <span className="font-bold">Fitder X</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Get started</h1>
          <p className="text-sm text-muted-foreground mb-8">Create your Fitder X account via Replit</p>
          <a
            href="/api/login"
            className="block w-full bg-gradient-primary text-primary-foreground font-semibold h-11 rounded-lg flex items-center justify-center shadow-glow"
          >
            Continue with Replit
          </a>
        </div>
      </div>
    </div>
  );
}
