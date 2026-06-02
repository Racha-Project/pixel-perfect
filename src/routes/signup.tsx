import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — Fitder X" }] }),
  component: SignupPage,
});

function SignupPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) nav({ to: "/onboarding", replace: true });
  }, [user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/onboarding` },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome!");
    nav({ to: "/onboarding", replace: true });
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/onboarding" });
    if (result.error) toast.error(result.error.message);
  };

  return (
    <div className="min-h-screen bg-gradient-hero grid place-items-center px-4">
      <div className="w-full max-w-md glass rounded-2xl p-8 shadow-glow">
        <Link to="/" className="flex items-center gap-2 mb-6">
          <div className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center font-bold text-primary-foreground">F</div>
          <span className="font-bold">Fitder X</span>
        </Link>
        <h1 className="text-2xl font-bold">{t("sign_up")}</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div><Label>{t("email")}</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label>{t("password")}</Label>
            <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button type="submit" disabled={loading} className="w-full bg-gradient-primary shadow-glow">{t("sign_up")}</Button>
        </form>
        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />{t("or")}<div className="h-px flex-1 bg-border" />
        </div>
        <Button variant="outline" className="w-full" onClick={google}>{t("continue_google")}</Button>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("sign_in")}? <Link to="/login" className="text-primary-glow hover:underline">{t("sign_in")}</Link>
        </p>
      </div>
    </div>
  );
}
