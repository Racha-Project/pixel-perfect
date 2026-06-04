import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Dumbbell, User } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Fitder X" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    tab: s.tab === "register" ? "register" as const : "login" as const,
  }),
  component: LoginPage,
});

type Role = "client" | "trainer";

function LoginPage() {
  const { user, loading, refreshUser } = useAuth();
  const nav = useNavigate();
  const { tab: initialTab } = Route.useSearch();
  const [tab, setTab] = useState<"login" | "register">(initialTab);
  const [role, setRole] = useState<Role>("client");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) nav({ to: "/dashboard", replace: true });
  }, [user, loading, nav]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setSubmitting(true);
    try {
      const endpoint = tab === "login" ? "/api/auth/login" : "/api/auth/register";
      const body: Record<string, string> = { email, password };
      if (tab === "register") {
        if (firstName) body.firstName = firstName;
        if (lastName) body.lastName = lastName;
        body.role = role;
      }
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Something went wrong");
        return;
      }
      await refreshUser();
      nav({ to: tab === "register" ? "/onboarding" : "/dashboard", replace: true });
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero grid place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="glass rounded-[2rem] border border-white/10 p-8 shadow-card">
          <Link to="/" className="flex items-center gap-2 mb-8 justify-center">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center font-bold text-primary-foreground text-sm">F</div>
            <span className="font-bold text-lg">Fitder X</span>
          </Link>

          {/* Login / Register tabs */}
          <div className="flex rounded-xl bg-muted/30 p-1 mb-6">
            <button
              type="button"
              onClick={() => setTab("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === "login" ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"}`}
            >
              เข้าสู่ระบบ
            </button>
            <button
              type="button"
              onClick={() => setTab("register")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === "register" ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"}`}
            >
              สมัครสมาชิก
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Role selector — only on register */}
            {tab === "register" && (
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">คุณเป็น...</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("client")}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 py-4 px-3 transition-all ${
                      role === "client"
                        ? "border-primary bg-primary/10 shadow-glow text-primary"
                        : "border-white/10 bg-muted/20 text-muted-foreground hover:border-white/20 hover:text-foreground"
                    }`}
                  >
                    <User className={`h-6 w-6 ${role === "client" ? "text-primary" : ""}`} />
                    <span className="text-sm font-semibold">Client</span>
                    <span className="text-[10px] leading-tight text-center opacity-70">ออกกำลังกาย<br/>ดูแลสุขภาพ</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("trainer")}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 py-4 px-3 transition-all ${
                      role === "trainer"
                        ? "border-primary bg-primary/10 shadow-glow text-primary"
                        : "border-white/10 bg-muted/20 text-muted-foreground hover:border-white/20 hover:text-foreground"
                    }`}
                  >
                    <Dumbbell className={`h-6 w-6 ${role === "trainer" ? "text-primary" : ""}`} />
                    <span className="text-sm font-semibold">Trainer</span>
                    <span className="text-[10px] leading-tight text-center opacity-70">เทรนเนอร์<br/>ผู้เชี่ยวชาญ</span>
                  </button>
                </div>
              </div>
            )}

            {/* Name fields — only on register */}
            {tab === "register" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">ชื่อ</Label>
                  <Input
                    placeholder="ชื่อ"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">นามสกุล</Label>
                  <Input
                    placeholder="นามสกุล"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs text-muted-foreground">อีเมล</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">
                รหัสผ่าน{" "}
                {tab === "register" && (
                  <span className="text-muted-foreground/60">(อย่างน้อย 6 ตัวอักษร)</span>
                )}
              </Label>
              <div className="relative mt-1">
                <Input
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={tab === "login" ? "current-password" : "new-password"}
                  className="pr-10"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-primary shadow-glow h-11 font-semibold mt-2"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : tab === "login" ? (
                "เข้าสู่ระบบ"
              ) : (
                `สมัครเป็น ${role === "trainer" ? "Trainer" : "Client"}`
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {tab === "login" ? (
              <>
                ยังไม่มีบัญชี?{" "}
                <button
                  type="button"
                  onClick={() => setTab("register")}
                  className="text-primary-glow hover:underline font-semibold"
                >
                  สมัครสมาชิก
                </button>
              </>
            ) : (
              <>
                มีบัญชีแล้ว?{" "}
                <button
                  type="button"
                  onClick={() => setTab("login")}
                  className="text-primary-glow hover:underline font-semibold"
                >
                  เข้าสู่ระบบ
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
