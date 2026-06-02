import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — Fitder X" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const uid = user?.id;

  const { data: profile } = useQuery({
    queryKey: ["profile", uid],
    queryFn: async () => {
      const res = await fetch("/api/profile", { credentials: "include" });
      return res.ok ? res.json() : null;
    },
    enabled: !!uid,
  });

  const [form, setForm] = useState({
    display_name: "", height_cm: "", weight_kg: "", age: "",
    gender: "male", goal: "general_fitness",
  });

  useEffect(() => {
    if (profile) setForm({
      display_name: profile.displayName ?? "",
      height_cm: profile.heightCm?.toString() ?? "",
      weight_kg: profile.weightKg?.toString() ?? "",
      age: profile.age?.toString() ?? "",
      gender: profile.gender ?? "male",
      goal: profile.goal ?? "general_fitness",
    });
  }, [profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        display_name: form.display_name || null,
        height_cm: Number(form.height_cm) || null,
        weight_kg: Number(form.weight_kg) || null,
        age: Number(form.age) || null,
        gender: form.gender,
        goal: form.goal,
      }),
    });
    if (!res.ok) return toast.error("Failed to save profile");
    toast.success("✓");
    qc.invalidateQueries({ queryKey: ["profile", uid] });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t("profile")}</h1>
      <form onSubmit={save} className="glass rounded-2xl p-6 shadow-card grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Label>Name</Label>
          <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} /></div>
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
        <div className="sm:col-span-2"><Label>{t("goal")}</Label>
          <Select value={form.goal} onValueChange={(v) => setForm({ ...form, goal: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="weight_loss">{t("weight_loss")}</SelectItem>
              <SelectItem value="muscle_gain">{t("muscle_gain")}</SelectItem>
              <SelectItem value="recomposition">{t("recomposition")}</SelectItem>
              <SelectItem value="general_fitness">{t("general_fitness")}</SelectItem>
            </SelectContent>
          </Select></div>
        <Button type="submit" className="sm:col-span-2 bg-gradient-primary shadow-glow">{t("save")}</Button>
      </form>
    </div>
  );
}
