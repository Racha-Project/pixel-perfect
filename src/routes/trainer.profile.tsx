import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/trainer/profile")({
  head: () => ({ meta: [{ title: "Trainer Profile — Fitder X" }] }),
  component: TrainerProfilePage,
});

const SPECIALTIES_OPTIONS = [
  "Weight Loss", "Muscle Building", "Cardio", "HIIT", "Yoga", "Pilates",
  "CrossFit", "Functional Training", "Sports Performance", "Rehabilitation",
  "Nutrition", "Stretching", "Prenatal Fitness", "Senior Fitness",
];
const MODALITY_OPTIONS = [
  { value: "online", label: "ออนไลน์" },
  { value: "gym",    label: "ยิม" },
  { value: "home",   label: "บ้าน" },
  { value: "studio", label: "สตูดิโอ" },
  { value: "outdoor",label: "กลางแจ้ง" },
];

function TrainerProfilePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    bio: "", hourly_rate_thb: "", experience_years: "",
    training_style: "supportive",
    specialties: [] as string[],
    certifications: [] as string[],
    training_modality: [] as string[],
    cert_input: "",
  });

  const { data: trainer } = useQuery({
    queryKey: ["trainer-profile"],
    queryFn: async () => {
      const res = await fetch("/api/trainer/profile", { credentials: "include" });
      return res.ok ? res.json() : null;
    },
  });

  useEffect(() => {
    if (trainer) setForm(p => ({
      ...p,
      bio:               trainer.bio ?? "",
      hourly_rate_thb:   String(trainer.hourlyRateThb ?? 500),
      experience_years:  String(trainer.experienceYears ?? 1),
      training_style:    trainer.trainingStyle ?? "supportive",
      specialties:       trainer.specialties ?? [],
      certifications:    trainer.certifications ?? [],
      training_modality: trainer.trainingModality ?? ["online"],
    }));
  }, [trainer]);

  const toggleSpecialty = (s: string) => {
    setForm(p => ({
      ...p,
      specialties: p.specialties.includes(s)
        ? p.specialties.filter(x => x !== s)
        : [...p.specialties, s],
    }));
  };

  const toggleModality = (m: string) => {
    setForm(p => ({
      ...p,
      training_modality: p.training_modality.includes(m)
        ? p.training_modality.filter(x => x !== m)
        : [...p.training_modality, m],
    }));
  };

  const addCert = () => {
    if (!form.cert_input.trim()) return;
    setForm(p => ({ ...p, certifications: [...p.certifications, p.cert_input.trim()], cert_input: "" }));
  };

  const removeCert = (c: string) => setForm(p => ({ ...p, certifications: p.certifications.filter(x => x !== c) }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/trainer/profile", {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: form.bio,
          hourly_rate_thb: Number(form.hourly_rate_thb),
          experience_years: Number(form.experience_years),
          training_style: form.training_style,
          specialties: form.specialties,
          certifications: form.certifications,
          training_modality: form.training_modality,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("บันทึกโปรไฟล์แล้ว ✓");
      qc.invalidateQueries({ queryKey: ["trainer-profile"] });
    } catch { toast.error("บันทึกไม่สำเร็จ"); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-purple-400 mb-1">Trainer Portal</div>
        <h1 className="text-3xl font-bold tracking-tight">โปรไฟล์เทรนเนอร์</h1>
      </div>

      {/* Trainer info card */}
      <div className="glass rounded-2xl p-5 shadow-card flex items-center gap-4 border border-violet-500/20">
        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 grid place-items-center shrink-0">
          <span className="text-2xl font-bold text-white">{((user?.profile as any)?.displayName || user?.firstName || "T")[0].toUpperCase()}</span>
        </div>
        <div>
          <div className="font-semibold text-lg">{(user?.profile as any)?.displayName || user?.firstName || "Trainer"}</div>
          <div className="text-sm text-muted-foreground">{user?.email}</div>
          {trainer?.isVerified && <div className="text-xs text-blue-400 mt-0.5">✓ Verified Trainer</div>}
        </div>
      </div>

      <form onSubmit={save} className="space-y-5">
        {/* Bio */}
        <div className="glass rounded-2xl p-5 shadow-card space-y-4">
          <h2 className="font-semibold">ข้อมูลพื้นฐาน</h2>
          <div>
            <Label>Bio / แนะนำตัว</Label>
            <textarea
              value={form.bio}
              onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
              placeholder="แนะนำตัวเอง ประสบการณ์ และแนวทางการสอน…"
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm placeholder-muted-foreground resize-none min-h-[100px] focus:border-primary/50 focus:outline-none"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>ค่าบริการ (฿/ชม.)</Label>
              <Input type="number" className="mt-1.5" value={form.hourly_rate_thb}
                onChange={e => setForm(p => ({ ...p, hourly_rate_thb: e.target.value }))} min={0} />
            </div>
            <div>
              <Label>ประสบการณ์ (ปี)</Label>
              <Input type="number" className="mt-1.5" value={form.experience_years}
                onChange={e => setForm(p => ({ ...p, experience_years: e.target.value }))} min={0} />
            </div>
          </div>
          <div>
            <Label>สไตล์การสอน</Label>
            <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {["supportive", "motivational", "technical", "holistic"].map(s => (
                <button key={s} type="button" onClick={() => setForm(p => ({ ...p, training_style: s }))}
                  className={`py-2 px-3 rounded-xl text-xs font-medium capitalize transition-all ${form.training_style === s ? "bg-violet-600 text-white" : "bg-white/5 border border-white/10 hover:border-white/20"}`}>
                  {s === "supportive" ? "สนับสนุน" : s === "motivational" ? "สร้างแรงบันดาล" : s === "technical" ? "เน้นเทคนิค" : "องค์รวม"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Specialties */}
        <div className="glass rounded-2xl p-5 shadow-card">
          <h2 className="font-semibold mb-3">ความเชี่ยวชาญ ({form.specialties.length} เลือก)</h2>
          <div className="flex flex-wrap gap-2">
            {SPECIALTIES_OPTIONS.map(s => (
              <button key={s} type="button" onClick={() => toggleSpecialty(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  form.specialties.includes(s)
                    ? "bg-violet-600/30 border-violet-500/60 text-violet-200"
                    : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Training modality */}
        <div className="glass rounded-2xl p-5 shadow-card">
          <h2 className="font-semibold mb-3">รูปแบบการสอน</h2>
          <div className="flex flex-wrap gap-2">
            {MODALITY_OPTIONS.map(({ value, label }) => (
              <button key={value} type="button" onClick={() => toggleModality(value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                  form.training_modality.includes(value)
                    ? "bg-violet-600/30 border-violet-500/60 text-violet-200"
                    : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="glass rounded-2xl p-5 shadow-card">
          <h2 className="font-semibold mb-3">ใบประกาศ / Certifications</h2>
          <div className="flex gap-2 mb-3">
            <Input value={form.cert_input} onChange={e => setForm(p => ({ ...p, cert_input: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCert())}
              placeholder="เช่น ACE CPT, NASM, etc." className="flex-1" />
            <Button type="button" onClick={addCert} size="sm" variant="outline">เพิ่ม</Button>
          </div>
          {form.certifications.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.certifications.map(c => (
                <div key={c} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                  {c}
                  <button type="button" onClick={() => removeCert(c)} className="hover:text-red-400">×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg h-11 font-semibold text-white">
          {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />กำลังบันทึก…</> : "บันทึกโปรไฟล์"}
        </Button>
      </form>
    </div>
  );
}
