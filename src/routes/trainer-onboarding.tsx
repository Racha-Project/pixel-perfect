import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowRight, ArrowLeft, Check, Dumbbell } from "lucide-react";

export const Route = createFileRoute("/trainer-onboarding")({
  head: () => ({ meta: [{ title: "Trainer Setup — Fitder X" }] }),
  component: TrainerOnboarding,
});

const SPECIALTIES = [
  "Weight Loss", "Muscle Building", "Cardio", "HIIT", "Yoga", "Pilates",
  "CrossFit", "Functional Training", "Sports Performance", "Rehabilitation",
  "Nutrition", "Stretching", "Prenatal Fitness", "Senior Fitness",
];

const MODALITIES = [
  { value: "online",  label: "ออนไลน์",    emoji: "💻" },
  { value: "gym",     label: "ยิม",         emoji: "🏋️" },
  { value: "home",    label: "บ้าน",        emoji: "🏠" },
  { value: "studio",  label: "สตูดิโอ",    emoji: "🎯" },
  { value: "outdoor", label: "กลางแจ้ง",   emoji: "🌳" },
];

const STYLES = [
  { value: "supportive",    label: "สนับสนุน",          desc: "ให้กำลังใจและสร้างความมั่นใจ" },
  { value: "motivational",  label: "สร้างแรงบันดาลใจ",  desc: "ผลักดันให้ทำสุดๆ" },
  { value: "technical",     label: "เน้นเทคนิค",        desc: "ความถูกต้องและฟอร์ม" },
  { value: "holistic",      label: "องค์รวม",           desc: "กาย จิต และโภชนาการ" },
];

const STEPS = ["ข้อมูลพื้นฐาน", "ความเชี่ยวชาญ", "รูปแบบการสอน", "ใบประกาศ"];

type Form = {
  displayName: string;
  bio: string;
  hourlyRate: string;
  experienceYears: string;
  specialties: string[];
  modalities: string[];
  trainingStyle: string;
  certifications: string[];
  certInput: string;
};

function TrainerOnboarding() {
  const { user, loading, refreshUser } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form>({
    displayName: "",
    bio: "",
    hourlyRate: "500",
    experienceYears: "1",
    specialties: [],
    modalities: ["online"],
    trainingStyle: "supportive",
    certifications: [],
    certInput: "",
  });

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login", replace: true });
    if (!loading && user) {
      const userType = (user.profile as any)?.userType;
      if (userType && userType !== "trainer") nav({ to: "/onboarding", replace: true });
      if ((user.profile as any)?.onboarded) nav({ to: "/trainer/dashboard", replace: true });
      if (user.firstName) setForm(p => ({ ...p, displayName: [user.firstName, user.lastName].filter(Boolean).join(" ") }));
    }
  }, [user, loading, nav]);

  const toggle = (field: "specialties" | "modalities", val: string) => {
    setForm(p => ({
      ...p,
      [field]: p[field].includes(val) ? p[field].filter(x => x !== val) : [...p[field], val],
    }));
  };

  const addCert = () => {
    if (!form.certInput.trim()) return;
    setForm(p => ({ ...p, certifications: [...p.certifications, p.certInput.trim()], certInput: "" }));
  };

  const canNext = () => {
    if (step === 0) return form.displayName.trim().length > 0;
    if (step === 1) return form.specialties.length > 0;
    if (step === 2) return form.modalities.length > 0;
    return true;
  };

  const finish = async () => {
    setSaving(true);
    try {
      const [trainerRes, profileRes] = await Promise.all([
        fetch("/api/trainer/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            bio: form.bio,
            hourly_rate_thb: Number(form.hourlyRate) || 500,
            experience_years: Number(form.experienceYears) || 1,
            training_style: form.trainingStyle,
            specialties: form.specialties,
            certifications: form.certifications,
            training_modality: form.modalities,
          }),
        }),
        fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            display_name: form.displayName,
            onboarded: true,
            userType: "trainer",
          }),
        }),
      ]);

      if (!trainerRes.ok || !profileRes.ok) throw new Error("บันทึกไม่สำเร็จ");
      await refreshUser();
      toast.success("ยินดีต้อนรับสู่ Fitder X! 🎉");
      nav({ to: "/trainer/dashboard", replace: true });
    } catch (e: any) {
      toast.error(e.message ?? "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center shrink-0">
            <Dumbbell className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-bold text-lg leading-none">Fitder X</div>
            <div className="text-xs text-violet-400">Trainer Setup</div>
          </div>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold shrink-0 transition-all ${
                i < step ? "bg-primary text-primary-foreground" :
                i === step ? "bg-gradient-primary text-primary-foreground shadow-glow ring-2 ring-primary/30" :
                "bg-muted/40 text-muted-foreground"
              }`}>
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${i === step ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s}</span>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px ${i < step ? "bg-primary/60" : "bg-white/10"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="glass rounded-2xl border border-white/10 p-6 shadow-card">

          {/* Step 0: Basic info */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold">ข้อมูลพื้นฐาน</h2>
                <p className="text-sm text-muted-foreground mt-0.5">ให้ลูกค้ารู้จักคุณ</p>
              </div>
              <div>
                <Label>ชื่อที่แสดง *</Label>
                <Input
                  className="mt-1.5"
                  placeholder="ชื่อ นามสกุล หรือชื่อเล่น"
                  value={form.displayName}
                  onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>ประสบการณ์ (ปี)</Label>
                  <Input
                    className="mt-1.5" type="number" min={0}
                    value={form.experienceYears}
                    onChange={e => setForm(p => ({ ...p, experienceYears: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>ค่าบริการ (฿/ชม.)</Label>
                  <Input
                    className="mt-1.5" type="number" min={0}
                    value={form.hourlyRate}
                    onChange={e => setForm(p => ({ ...p, hourlyRate: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label>แนะนำตัวเอง</Label>
                <textarea
                  value={form.bio}
                  onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                  placeholder="ประสบการณ์ แนวทางการสอน และสิ่งที่คุณช่วยลูกค้าได้…"
                  className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm placeholder:text-muted-foreground resize-none min-h-[90px] focus:border-primary/50 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Step 1: Specialties */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold">ความเชี่ยวชาญ</h2>
                <p className="text-sm text-muted-foreground mt-0.5">เลือกอย่างน้อย 1 รายการ</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {SPECIALTIES.map(s => (
                  <button
                    key={s} type="button" onClick={() => toggle("specialties", s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      form.specialties.includes(s)
                        ? "bg-violet-600/30 border-violet-500/60 text-violet-200"
                        : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {form.specialties.length > 0 && (
                <p className="text-xs text-violet-400">เลือกแล้ว {form.specialties.length} รายการ</p>
              )}
            </div>
          )}

          {/* Step 2: Modality + Style */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold">รูปแบบการสอน</h2>
                <p className="text-sm text-muted-foreground mt-0.5">เลือกได้หลายรูปแบบ</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">สถานที่ / วิธีสอน</Label>
                <div className="grid grid-cols-3 gap-2">
                  {MODALITIES.map(({ value, label, emoji }) => (
                    <button
                      key={value} type="button" onClick={() => toggle("modalities", value)}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-medium transition-all ${
                        form.modalities.includes(value)
                          ? "border-violet-500/60 bg-violet-600/20 text-violet-200"
                          : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20"
                      }`}
                    >
                      <span className="text-xl">{emoji}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">สไตล์การสอน</Label>
                <div className="space-y-2">
                  {STYLES.map(({ value, label, desc }) => (
                    <button
                      key={value} type="button" onClick={() => setForm(p => ({ ...p, trainingStyle: value }))}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                        form.trainingStyle === value
                          ? "border-violet-500/60 bg-violet-600/20"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className={`h-4 w-4 rounded-full border-2 shrink-0 transition-all ${
                        form.trainingStyle === value ? "border-violet-400 bg-violet-400" : "border-white/30"
                      }`} />
                      <div>
                        <div className="text-sm font-medium">{label}</div>
                        <div className="text-xs text-muted-foreground">{desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Certifications */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold">ใบประกาศ & ใบรับรอง</h2>
                <p className="text-sm text-muted-foreground mt-0.5">ข้ามได้ถ้าไม่มี</p>
              </div>
              <div className="flex gap-2">
                <Input
                  value={form.certInput}
                  onChange={e => setForm(p => ({ ...p, certInput: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCert())}
                  placeholder="เช่น ACE CPT, NASM, etc."
                  className="flex-1"
                />
                <Button type="button" onClick={addCert} variant="outline" size="sm">เพิ่ม</Button>
              </div>
              {form.certifications.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {form.certifications.map(c => (
                    <div key={c} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                      {c}
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, certifications: p.certifications.filter(x => x !== c) }))}
                        className="hover:text-red-400 ml-1"
                      >×</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-muted-foreground">
                  ยังไม่มีใบประกาศ — ข้ามได้เลย
                </div>
              )}

              {/* Summary preview */}
              <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2 text-sm">
                <div className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-3">สรุปโปรไฟล์</div>
                <div className="flex justify-between"><span className="text-muted-foreground">ชื่อ</span><span className="font-medium">{form.displayName}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">ประสบการณ์</span><span>{form.experienceYears} ปี</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">ค่าบริการ</span><span>฿{Number(form.hourlyRate).toLocaleString()}/ชม.</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">ความเชี่ยวชาญ</span><span>{form.specialties.length} รายการ</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">รูปแบบสอน</span><span>{form.modalities.join(", ")}</span></div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-1.5" /> ย้อนกลับ
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext()}
                className="flex-1 bg-gradient-primary shadow-glow"
              >
                ถัดไป <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={finish}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg text-white font-semibold"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>เริ่มต้นเลย! 🚀</>}
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          สามารถแก้ไขข้อมูลได้ภายหลังที่หน้า Trainer Profile
        </p>
      </div>
    </div>
  );
}
