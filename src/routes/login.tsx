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

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Fitder X" }] }),
  component: LoginPage,
});

type UserType = "client" | "trainer";

function LoginPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const nav = useNavigate();
  const [userType, setUserType] = useState<UserType>("client");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) nav({ to: "/dashboard", replace: true });
  }, [user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Attempt sign in
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        setLoading(false);
        toast.error(error.message);
        return;
      }

      // Verify user type matches selection
      if (authData.user?.id) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("user_type")
          .eq("id", authData.user.id)
          .maybeSingle();

        if (profileError) {
          setLoading(false);
          toast.error("Failed to verify account type");
          return;
        }

        const accountType = profile?.user_type || "client";
        
        if (accountType !== userType) {
          // User type mismatch - sign them out and show error
          await supabase.auth.signOut();
          setLoading(false);
          toast.error(`This account is registered as a ${accountType}, not a ${userType}`);
          return;
        }
      }

      setLoading(false);
      nav({ to: "/dashboard", replace: true });
    } catch (err) {
      setLoading(false);
      toast.error("An error occurred during sign in");
      console.error(err);
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
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

        {/* Login Card */}
        <div className="glass rounded-[2rem] border border-white/10 p-8 shadow-card">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center font-bold text-primary-foreground">F</div>
            <span className="font-bold">Fitder X</span>
          </Link>
          
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in as a <span className="text-primary font-semibold capitalize">{userType}</span>
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
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
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2"
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full mt-6 bg-gradient-primary shadow-glow h-11 font-semibold">
              {loading ? "Signing in..." : "Sign in"}
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
            {t("sign_up")}? 
            <Link to="/signup" className="ml-1 text-primary-glow hover:underline font-semibold">
              {t("sign_up")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

