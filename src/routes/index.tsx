import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Activity, Apple, Camera, MessageCircle, Sparkles, ShieldCheck, ArrowRight, Check, Users, Zap, Brain } from "lucide-react";
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

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? "show" : "hidden"} className={className}>
      {children}
    </motion.div>
  );
}

function Landing() {
  const { t } = useI18n();

  const features = [
    { icon: Activity,      t: t("landing_feature_1_t"), d: t("landing_feature_1_d"), color: "from-green-500/20 to-emerald-500/5" },
    { icon: Camera,        t: t("landing_feature_2_t"), d: t("landing_feature_2_d"), color: "from-cyan-500/20 to-teal-500/5" },
    { icon: Apple,         t: t("landing_feature_3_t"), d: t("landing_feature_3_d"), color: "from-lime-500/20 to-green-500/5" },
    { icon: Sparkles,      t: t("landing_feature_4_t"), d: t("landing_feature_4_d"), color: "from-emerald-500/20 to-green-500/5" },
    { icon: ShieldCheck,   t: t("landing_feature_5_t"), d: t("landing_feature_5_d"), color: "from-teal-500/20 to-cyan-500/5" },
    { icon: MessageCircle, t: t("landing_feature_6_t"), d: t("landing_feature_6_d"), color: "from-green-400/20 to-emerald-400/5" },
  ];

  const stats = [
    { value: "10K+", label: "Active Users" },
    { value: "98%", label: "Accuracy" },
    { value: "500+", label: "Trainers" },
    { value: "4.9★", label: "Rating" },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Nav */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl"
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-primary shadow-glow grid place-items-center font-bold text-primary-foreground text-sm">F</div>
            <span className="font-bold tracking-tight text-foreground">Fitder X</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">{t("features")}</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">{t("pricing")}</a>
          </nav>
          <div className="flex items-center gap-2">
            <LangToggle />
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link to="/login">{t("sign_in")}</Link>
            </Button>
            <Button asChild size="sm" className="bg-gradient-primary shadow-glow hover:opacity-90 transition-opacity">
              <Link to="/signup">{t("get_started")}</Link>
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero min-h-[92vh] flex items-center">
        {/* Ambient blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <motion.div
            animate={{ scale: [1, 1.12, 1], opacity: [0.25, 0.4, 0.25] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-primary/20 blur-[120px]"
          />
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.15, 0.28, 0.15] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-emerald-400/15 blur-[100px]"
          />
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 4 }}
            className="absolute top-10 left-10 h-[300px] w-[300px] rounded-full bg-teal-500/10 blur-[80px]"
          />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "linear-gradient(oklch(0.72 0.21 142) 1px, transparent 1px), linear-gradient(90deg, oklch(0.72 0.21 142) 1px, transparent 1px)", backgroundSize: "60px 60px" }}
          />
        </div>

        <div className="container mx-auto px-4 py-24 md:py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/8 px-4 py-1.5 text-xs font-medium text-primary-glow backdrop-blur-sm mb-6">
              <Zap className="h-3 w-3 fill-current" />
              {t("tagline")}
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.02] mb-6"
          >
            <span className="shimmer-text">{t("hero_title")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed mb-10"
          >
            {t("hero_sub")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <Button asChild size="lg" className="bg-gradient-primary shadow-glow glow-green text-base px-8 h-12 hover:opacity-90 transition-opacity">
              <Link to="/signup">{t("get_started")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base px-8 h-12 border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all">
              <Link to="/login">{t("sign_in")}</Link>
            </Button>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16"
          >
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-gradient-primary">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Floating UI preview hint */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mt-16 mx-auto max-w-lg"
          >
            <div className="glass-strong rounded-2xl p-5 text-left border-glow glow-green">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
                  <Brain className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <div className="text-sm font-semibold">AI Health Coach</div>
                  <div className="text-xs text-muted-foreground">Analyzing your Digital Twin…</div>
                </div>
                <div className="ml-auto flex gap-1">
                  {[0.2, 0.4, 0.6].map((d) => (
                    <motion.div
                      key={d}
                      animate={{ scaleY: [1, 2, 1] }}
                      transition={{ duration: 0.9, repeat: Infinity, delay: d, ease: "easeInOut" }}
                      className="h-3 w-1 rounded-full bg-primary"
                    />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Health Score", value: "87", unit: "/100", color: "text-primary" },
                  { label: "Streak", value: "14", unit: " days", color: "text-orange-400" },
                  { label: "Match", value: "94%", unit: "", color: "text-cyan-400" },
                ].map((item) => (
                  <div key={item.label} className="glass rounded-xl p-2.5 text-center">
                    <div className={`text-xl font-bold ${item.color}`}>{item.value}<span className="text-xs text-muted-foreground">{item.unit}</span></div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-24 md:py-32">
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-16">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-xs font-medium text-primary-glow mb-4">
            <Sparkles className="h-3 w-3" /> Platform Features
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold tracking-tight">{t("features")}</motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-muted-foreground text-lg">Every tool you need. Powered by AI. In one platform.</motion.p>
        </AnimatedSection>

        <AnimatedSection className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.t}
              variants={scaleIn}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className="group glass rounded-2xl p-6 shadow-card cursor-default relative overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative z-10">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  className="h-12 w-12 rounded-xl bg-gradient-primary grid place-items-center shadow-glow mb-4"
                >
                  <f.icon className="h-5 w-5 text-primary-foreground" />
                </motion.div>
                <h3 className="font-semibold text-lg mb-2">{f.t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.d}</p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </AnimatedSection>
      </section>

      {/* Trainer Marketplace Teaser */}
      <section className="container mx-auto px-4 py-10 md:py-16">
        <AnimatedSection>
          <motion.div
            variants={scaleIn}
            className="glass-strong rounded-3xl p-8 md:p-12 border-glow relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-emerald-500/5" />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 border border-primary/25 px-3 py-1 text-xs font-medium text-primary-glow mb-4">
                  <Users className="h-3 w-3" /> Trainer Marketplace
                </div>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
                  AI-Powered Trainer Matching
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Our Explainable AI matches you with the perfect trainer based on your goals, budget, schedule, and preferred coaching style — with transparent scoring and reasoning.
                </p>
                <div className="space-y-2 mb-6">
                  {["Goal × Specialty alignment", "Schedule & budget compatibility", "Coaching style match", "Explainable AI scoring"].map((r) => (
                    <div key={r} className="flex items-center gap-2 text-sm">
                      <div className="h-4 w-4 rounded-full bg-primary/20 border border-primary/40 grid place-items-center">
                        <Check className="h-2.5 w-2.5 text-primary" />
                      </div>
                      <span className="text-muted-foreground">{r}</span>
                    </div>
                  ))}
                </div>
                <Button asChild size="lg" className="bg-gradient-primary shadow-glow">
                  <Link to="/signup">Explore Trainers <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
              <div className="w-full md:w-72 shrink-0">
                <div className="glass rounded-2xl p-5 space-y-3">
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">AI Match Result</div>
                  {[
                    { name: "Coach Nitaya", score: 94, badge: "Weight Loss" },
                    { name: "Kru Pituck", score: 88, badge: "Strength" },
                    { name: "Dr. Parichat", score: 82, badge: "Wellness" },
                  ].map((tr) => (
                    <div key={tr.name} className="flex items-center gap-3 p-2.5 rounded-xl border border-border/40 hover:border-primary/30 transition-colors">
                      <div className="h-8 w-8 rounded-lg bg-gradient-primary grid place-items-center text-xs font-bold text-primary-foreground shrink-0">
                        {tr.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{tr.name}</div>
                        <div className="text-[10px] text-muted-foreground">{tr.badge}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-primary">{tr.score}%</div>
                        <div className="text-[10px] text-muted-foreground">match</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatedSection>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container mx-auto px-4 py-24">
        <AnimatedSection className="text-center mb-12">
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold tracking-tight">{t("pricing")}</motion.h2>
          <motion.p variants={fadeUp} className="mt-3 text-muted-foreground">Simple, transparent pricing.</motion.p>
        </AnimatedSection>

        <AnimatedSection className="mx-auto grid max-w-3xl gap-5 md:grid-cols-2">
          <motion.div variants={scaleIn} className="glass rounded-2xl border border-border/50 p-8">
            <h3 className="font-semibold text-lg">{t("pricing_free")}</h3>
            <div className="mt-3 text-5xl font-bold tracking-tight">
              ฿0<span className="text-base font-normal text-muted-foreground">{t("per_month")}</span>
            </div>
            <ul className="mt-6 space-y-3">
              {["AI Fitness Coach", "AI Nutrition Tracker", "AI Chat Coach"].map((s) => (
                <li key={s} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <div className="h-4 w-4 rounded-full bg-primary/15 border border-primary/30 grid place-items-center shrink-0">
                    <Check className="h-2.5 w-2.5 text-primary" />
                  </div>
                  {s}
                </li>
              ))}
            </ul>
            <Button asChild className="mt-8 w-full" variant="outline">
              <Link to="/signup">{t("get_started")}</Link>
            </Button>
          </motion.div>

          <motion.div variants={scaleIn} className="glass-strong rounded-2xl border-glow p-8 relative glow-green">
            <div className="absolute -top-3 right-5 rounded-full bg-gradient-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-glow">
              ✦ Pro
            </div>
            <h3 className="font-semibold text-lg">{t("pricing_pro")}</h3>
            <div className="mt-3 text-5xl font-bold tracking-tight">
              ฿199<span className="text-base font-normal text-muted-foreground">{t("per_month")}</span>
            </div>
            <ul className="mt-6 space-y-3">
              {["Digital Twin Predictions", "AI Pose Analysis Pro", "Advanced Analytics", "Trainer Marketplace Access", "Priority AI Processing"].map((s) => (
                <li key={s} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <div className="h-4 w-4 rounded-full bg-primary/20 border border-primary/40 grid place-items-center shrink-0">
                    <Check className="h-2.5 w-2.5 text-primary" />
                  </div>
                  {s}
                </li>
              ))}
            </ul>
            <Button asChild className="mt-8 w-full bg-gradient-primary shadow-glow hover:opacity-90 transition-opacity">
              <Link to="/signup">{t("get_started")}</Link>
            </Button>
          </motion.div>
        </AnimatedSection>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-24">
        <AnimatedSection>
          <motion.div
            variants={scaleIn}
            className="glass-strong rounded-3xl p-12 md:p-16 text-center border-glow relative overflow-hidden glow-green"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary-glow mb-5">
                <Zap className="h-3 w-3" /> Get Started Today
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">{t("cta_subtitle")}</h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">Join thousands of users who improved their health with Fitder X.</p>
              <Button asChild size="lg" className="bg-gradient-primary shadow-glow glow-green px-10 h-13 text-base hover:opacity-90 transition-opacity">
                <Link to="/signup">{t("get_started")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </motion.div>
        </AnimatedSection>
      </section>

      <footer className="border-t border-border/30 py-8 text-center text-xs text-muted-foreground">
        <span className="text-gradient-primary font-semibold">Fitder X</span> © {new Date().getFullYear()} — AI Health Operating System
      </footer>
    </div>
  );
}
