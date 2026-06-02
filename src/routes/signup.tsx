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
import { Users, Award } from "lucide-react";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — Fitder X" }] }),
  component: SignupPage,
});

type UserType = "client" | "trainer";

function SignupPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const nav = useNavigate();
  const [userType, setUserType] = useState<UserType>("client");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) nav({ to: "/onboarding", replace: true });
  }, [user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email, 
      password,
      options: { emailRedirectTo: `${window.location.origin}/onboarding` },
    });
    
    if (authError) {
      setLoading(false);
      return toast.error(authError.message);
    }

    // Create profile with user_type
    if (authData.user?.id) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: authData.user.id,
          display_name: displayName || email.split("@")[0],
          user_type: userType,
          language: "th",
          onboarded: false,
        });

      if (profileError) {
        setLoading(false);
        return toast.error("Failed to create profile: " + profileError.message);
      }
    }

    setLoading(false);
    toast.success("Account created! Welcome to Fitder X");
    nav({ to: "/onboarding", replace: true });
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/onboarding" });
    if (result.error) toast.error(result.error.message);
  };

  return (
    <div className="min-h-screen bg-gradient-hero grid place-items-center px-4">
      <div className="w-full max-w-md">
        {/* Type Selector */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setUserType("client")}
            className={`flex-1 rounded-2xl border-2 px-4 py-3 transition-all duration-200 flex items-center justify-center gap-2 font-semibold ${
              userType === "client"
                ? "border-[#00ff85] bg-[#00ff85]/15 text-foreground shadow-glow"
                : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20"
            }`}
          >
            <Users className="h-4 w-4" />
            <span className="text-sm">Client</span>
          </button>
          <button
            onClick={() => setUserType("trainer")}
            className={`flex-1 rounded-2xl border-2 px-4 py-3 transition-all duration-200 flex items-center justify-center gap-2 font-semibold ${
              userType === "trainer"
                ? "border-[#00ff85] bg-[#00ff85]/15 text-foreground shadow-glow"
                : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20"
            }`}
          >
            <Award className="h-4 w-4" />
            <span className="text-sm">Trainer</span>
          </button>
        </div>

        {/* Signup Card */}
        <div className="glass rounded-[2rem] border border-white/10 p-8 shadow-card">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center font-bold text-primary-foreground">F</div>
            <span className="font-bold">Fitder X</span>
          </Link>
          
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Get started</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Create account as a <span className="text-primary font-semibold capitalize">{userType}</span>
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Display Name</Label>
              <Input 
                type="text" 
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-2"
                placeholder="Your name"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold">{t("email")}</Label>
              <Input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold">{t("password")}</Label>
              <Input 
                type="password" 
                required 
                minLength={6} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-muted-foreground">At least 6 characters</p>
            </div>
            <Button type="submit" disabled={loading} className="w-full mt-6 bg-gradient-primary shadow-glow h-11 font-semibold">
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />{t("or")}<div className="h-px flex-1 bg-border" />
          </div>

          <Button 
            variant="outline" 
            className="w-full border-white/15 bg-white/5 hover:bg-white/10 h-11 font-semibold"
            onClick={google}
          >
            {t("continue_google")}
          </Button>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account? 
            <Link to="/login" className="ml-1 text-primary-glow hover:underline font-semibold">
              {t("sign_in")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

