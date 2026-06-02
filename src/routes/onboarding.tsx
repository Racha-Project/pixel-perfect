import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Setup — Fitder X" }] }),
  component: Onboarding,
});

function Onboarding() {
  const { t, lang } = useI18n();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
    height_cm: "", weight_kg: "", age: "",
    gender: "male", goal: "general_fitness",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login", replace: true });
  }, [user, loading, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      height_cm: Number(form.height_cm) || null,
      weight_kg: Number(form.weight_kg) || null,
      age: Number(form.age) || null,
      gender: form.gender as never,
      goal: form.goal as never,
      language: lang,
      onboarded: true,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("✨");
    nav({ to: "/dashboard", replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-hero grid place-items-center px-4 py-12">
      <div className="w-full max-w-lg glass rounded-2xl p-8 shadow-glow">
        <h1 className="text-2xl font-bold">{t("onboarding_title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("onboarding_sub")}</p>
        <form onSubmit={submit} className="mt-6 grid grid-cols-2 gap-4">
          <div><Label>{t("height")}</Label>
            <Input type="number" value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} /></div>
          <div><Label>{t("weight")}</Label>
            <Input type="number" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} /></div>
          <div><Label>{t("age")}</Label>
            <Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></div>
          <div><Label>{t("gender")}</Label>
            <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">{t("male")}</SelectItem>
                <SelectItem value="female">{t("female")}</SelectItem>
                <SelectItem value="other">{t("other")}</SelectItem>
              </SelectContent>
            </Select></div>
          <div className="col-span-2"><Label>{t("goal")}</Label>
            <Select value={form.goal} onValueChange={(v) => setForm({ ...form, goal: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weight_loss">{t("weight_loss")}</SelectItem>
                <SelectItem value="muscle_gain">{t("muscle_gain")}</SelectItem>
                <SelectItem value="recomposition">{t("recomposition")}</SelectItem>
                <SelectItem value="general_fitness">{t("general_fitness")}</SelectItem>
              </SelectContent>
            </Select></div>
          <Button type="submit" disabled={saving} className="col-span-2 bg-gradient-primary shadow-glow">{t("save")}</Button>
        </form>
      </div>
    </div>
  );
}
