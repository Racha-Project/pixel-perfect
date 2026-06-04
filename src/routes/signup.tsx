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
    if (!loading) nav({ to: "/login", replace: true });
  }, [loading, nav]);

  return null;
}
