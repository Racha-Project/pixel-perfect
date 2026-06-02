import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, Apple, Camera, MessageCircle, Sparkles, ShieldCheck, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { LangToggle } from "@/components/lang-toggle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fitder X — AI Health & Fitness Digital Twin" },
      { name: "description", content: "AI Coach, Pose Analysis, Nutrition และ Digital Twin ในแอปเดียว" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t } = useI18n();
  const features = [
    { icon: Activity, t: t("landing_feature_1_t"), d: t("landing_feature_1_d") },
    { icon: Camera, t: t("landing_feature_2_t"), d: t("landing_feature_2_d") },
    { icon: Apple, t: t("landing_feature_3_t"), d: t("landing_feature_3_d") },
    { icon: Sparkles, t: t("landing_feature_4_t"), d: t("landing_feature_4_d") },
    { icon: ShieldCheck, t: t("landing_feature_5_t"), d: t("landing_feature_5_d") },
    { icon: MessageCircle, t: t("landing_feature_6_t"), d: t("landing_feature_6_d") },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary shadow-glow grid place-items-center font-bold text-primary-foreground">F</div>
            <span className="font-bold tracking-tight">Fitder X</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground">{t("features")}</a>
            <a href="#pricing" className="hover:text-foreground">{t("pricing")}</a>
          </nav>
          <div className="flex items-center gap-2">
            <LangToggle />
            <Button asChild variant="ghost" size="sm"><Link to="/login">{t("sign_in")}</Link></Button>
            <Button asChild size="sm" className="bg-gradient-primary shadow-glow"><Link to="/signup">{t("get_started")}</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 -z-10 opacity-30">
          <div className="absolute top-20 left-20 h-72 w-72 rounded-full bg-primary blur-3xl animate-float" />
          <div className="absolute bottom-10 right-20 h-96 w-96 rounded-full bg-accent blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        </div>
        <div className="container mx-auto px-4 py-24 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary-glow">
            <Sparkles className="h-3.5 w-3.5" /> {t("tagline")}
          </div>
          <h1 className="mt-6 text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
            <span className="text-gradient-primary">{t("hero_title")}</span>
          </h1>
          <p className="mt-6 mx-auto max-w-2xl text-lg text-muted-foreground">{t("hero_sub")}</p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-primary shadow-glow text-base">
              <Link to="/signup">{t("get_started")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base">
              <Link to="/login">{t("sign_in")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-24">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t("features")}</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.t} className="glass rounded-2xl p-6 shadow-card transition hover:-translate-y-1 hover:shadow-glow">
              <div className="h-12 w-12 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
                <f.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="mt-4 font-semibold text-lg">{f.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container mx-auto px-4 py-24">
        <div className="text-center"><h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t("pricing")}</h2></div>
        <div className="mt-12 mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border p-8 bg-card">
            <h3 className="font-semibold text-lg">{t("pricing_free")}</h3>
            <div className="mt-4 text-4xl font-bold">฿0<span className="text-base font-normal text-muted-foreground">{t("per_month")}</span></div>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              {["AI Fitness Coach", "AI Nutrition", "AI Chat"].map((s) => (
                <li key={s} className="flex gap-2"><Check className="h-4 w-4 text-success" /> {s}</li>
              ))}
            </ul>
            <Button asChild className="mt-8 w-full" variant="outline"><Link to="/signup">{t("get_started")}</Link></Button>
          </div>
          <div className="relative rounded-2xl border border-primary/60 bg-card p-8 shadow-glow">
            <div className="absolute -top-3 right-6 rounded-full bg-gradient-primary px-3 py-1 text-xs font-medium text-primary-foreground">Pro</div>
            <h3 className="font-semibold text-lg">{t("pricing_pro")}</h3>
            <div className="mt-4 text-4xl font-bold">฿199<span className="text-base font-normal text-muted-foreground">{t("per_month")}</span></div>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              {["Digital Twin Predictions", "Pose Analysis Pro", "Advanced Analytics", "Premium Plans"].map((s) => (
                <li key={s} className="flex gap-2"><Check className="h-4 w-4 text-success" /> {s}</li>
              ))}
            </ul>
            <Button asChild className="mt-8 w-full bg-gradient-primary shadow-glow"><Link to="/signup">{t("get_started")}</Link></Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-24">
        <div className="glass rounded-3xl p-12 text-center shadow-glow">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t("cta_subtitle")}</h2>
          <Button asChild size="lg" className="mt-8 bg-gradient-primary shadow-glow">
            <Link to="/signup">{t("get_started")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border/50 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Fitder X
      </footer>
    </div>
  );
}
