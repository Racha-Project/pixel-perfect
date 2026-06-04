import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Camera, Loader2, User2 } from "lucide-react";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — Fitder X" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const qc = useQueryClient();
  const uid = user?.id;
  const fileRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
      height_cm:    profile.heightCm?.toString() ?? "",
      weight_kg:    profile.weightKg?.toString() ?? "",
      age:          profile.age?.toString() ?? "",
      gender:       profile.gender ?? "male",
      goal:         profile.goal ?? "general_fitness",
    });
  }, [profile]);

  const avatarUrl = preview ?? profile?.avatarUrl ?? null;
  const initials  = (profile?.displayName || user?.firstName || "U").slice(0, 1).toUpperCase();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("ไฟล์ต้องไม่เกิน 5 MB");

    setPreview(URL.createObjectURL(file));
    setUploading(true);

    const fd = new FormData();
    fd.append("avatar", file);

    try {
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setPreview(null);
      toast.success("อัพโหลดรูปสำเร็จ! ✓");
      qc.invalidateQueries({ queryKey: ["profile", uid] });
    } catch {
      setPreview(null);
      toast.error("อัพโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        display_name: form.display_name || null,
        height_cm:    Number(form.height_cm) || null,
        weight_kg:    Number(form.weight_kg) || null,
        age:          Number(form.age) || null,
        gender:       form.gender,
        goal:         form.goal,
      }),
    });
    setSaving(false);
    if (!res.ok) return toast.error("บันทึกไม่สำเร็จ");
    toast.success("บันทึกข้อมูลแล้ว ✓");
    qc.invalidateQueries({ queryKey: ["profile", uid] });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-1">Profile</div>
        <h1 className="text-3xl font-bold tracking-tight">{t("profile")}</h1>
      </div>

      {/* Avatar upload */}
      <div className="glass rounded-2xl p-6 shadow-card flex items-center gap-6">
        <div className="relative shrink-0 group">
          <div className="h-24 w-24 rounded-2xl overflow-hidden border-2 border-border/50 bg-gradient-primary/20">
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full grid place-items-center">
                <span className="text-3xl font-bold text-primary">{initials}</span>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 grid place-items-center rounded-2xl">
                <Loader2 className="h-7 w-7 animate-spin text-white" />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-primary shadow-glow border-2 border-background grid place-items-center hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Camera className="h-3.5 w-3.5 text-primary-foreground" />
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div>
          <div className="font-semibold text-lg">{profile?.displayName || user?.firstName || "ผู้ใช้งาน"}</div>
          <div className="text-sm text-muted-foreground mb-3">{user?.email}</div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="gap-2 text-xs"
          >
            {uploading ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" />กำลังอัพโหลด…</>
            ) : (
              <><Camera className="h-3.5 w-3.5" />เปลี่ยนรูปโปรไฟล์</>
            )}
          </Button>
          <p className="text-[11px] text-muted-foreground mt-1.5">JPG, PNG, WebP · ไม่เกิน 5 MB</p>
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={save} className="glass rounded-2xl p-6 shadow-card grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>ชื่อที่แสดง</Label>
          <Input
            className="mt-1.5"
            value={form.display_name}
            onChange={(e) => setForm({ ...form, display_name: e.target.value })}
            placeholder="ชื่อของคุณ"
          />
        </div>

        <div>
          <Label>{t("height")} (cm)</Label>
          <Input className="mt-1.5" type="number" value={form.height_cm}
            onChange={(e) => setForm({ ...form, height_cm: e.target.value })} placeholder="170" />
        </div>
        <div>
          <Label>{t("weight")} (kg)</Label>
          <Input className="mt-1.5" type="number" value={form.weight_kg}
            onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} placeholder="65" />
        </div>
        <div>
          <Label>{t("age")}</Label>
          <Input className="mt-1.5" type="number" value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="25" />
        </div>
        <div>
          <Label>{t("gender")}</Label>
          <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">{t("male")}</SelectItem>
              <SelectItem value="female">{t("female")}</SelectItem>
              <SelectItem value="other">{t("other")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="sm:col-span-2">
          <Label>{t("goal")}</Label>
          <Select value={form.goal} onValueChange={(v) => setForm({ ...form, goal: v })}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="weight_loss">{t("weight_loss")}</SelectItem>
              <SelectItem value="muscle_gain">{t("muscle_gain")}</SelectItem>
              <SelectItem value="recomposition">{t("recomposition")}</SelectItem>
              <SelectItem value="general_fitness">{t("general_fitness")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          disabled={saving}
          className="sm:col-span-2 bg-gradient-primary shadow-glow h-11 font-semibold"
        >
          {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />กำลังบันทึก…</> : t("save")}
        </Button>
      </form>
    </div>
  );
}
