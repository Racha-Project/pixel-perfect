import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — Fitder X" }] }),
  component: SignupRedirect,
});

function SignupRedirect() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    if (!loading) nav({ to: "/login", search: { tab: "register" }, replace: true });
  }, [loading, nav]);

  return null;
}
