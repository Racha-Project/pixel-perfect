import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Fitder X" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && user) nav({ to: "/dashboard", replace: true });
  }, [user, loading, nav]);

  return (
    <div className="min-h-screen bg-gradient-hero grid place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="glass rounded-[2rem] border border-white/10 p-8 shadow-card text-center">
          <Link to="/" className="flex items-center gap-2 mb-8 justify-center">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center font-bold text-primary-foreground">F</div>
            <span className="font-bold">Fitder X</span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back</h1>
          <p className="text-sm text-muted-foreground mb-8">Sign in with your Replit account to continue</p>
          <a
            href="/api/login"
            className="block w-full bg-gradient-primary text-primary-foreground font-semibold h-11 rounded-lg flex items-center justify-center shadow-glow"
          >
            Sign in with Replit
          </a>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New here?{" "}
            <a href="/api/login" className="text-primary-glow hover:underline font-semibold">
              Create account
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
