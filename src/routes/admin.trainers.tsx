import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dumbbell, ShieldCheck, ShieldX, Star, Clock, MapPin, User, CheckCircle, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/trainers")({
  head: () => ({ meta: [{ title: "Trainer Verification — Fitder X Admin" }] }),
  component: AdminTrainers,
});

type Trainer = {
  id: string;
  userId: string | null;
  displayName: string;
  bio: string | null;
  specialties: string[] | null;
  certifications: string[] | null;
  experienceYears: number | null;
  hourlyRateThb: number | null;
  trainingModality: string[] | null;
  trainingStyle: string | null;
  rating: string | null;
  reviewCount: number | null;
  gender: string | null;
  avatarUrl: string | null;
  isVerified: boolean | null;
  isActive: boolean | null;
  createdAt: string | null;
  email: string | null;
};

function AdminTrainers() {
  const qc = useQueryClient();

  const { data: trainerList = [], isLoading } = useQuery<Trainer[]>({
    queryKey: ["admin-trainers"],
    queryFn: async () => {
      const res = await fetch("/api/admin/trainers", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const verify = useMutation({
    mutationFn: async ({ id, isVerified }: { id: string; isVerified: boolean }) => {
      const res = await fetch(`/api/admin/trainers/${id}/verify`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-trainers"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("อัปเดตสถานะสำเร็จ");
    },
    onError: () => toast.error("เกิดข้อผิดพลาด"),
  });

  const pending = trainerList.filter(t => !t.isVerified);
  const verified = trainerList.filter(t => t.isVerified);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-amber-400 mb-1">Admin Portal</div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Dumbbell className="h-7 w-7 text-violet-400" />
          ยืนยันเทรนเนอร์
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          ทั้งหมด {trainerList.length} คน · รอยืนยัน {pending.length} · ยืนยันแล้ว {verified.length}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-xl p-4 border border-yellow-500/20 bg-yellow-500/5 text-center">
          <div className="text-2xl font-bold text-yellow-400">{pending.length}</div>
          <div className="text-xs text-muted-foreground">รอยืนยัน</div>
        </div>
        <div className="glass rounded-xl p-4 border border-green-500/20 bg-green-500/5 text-center">
          <div className="text-2xl font-bold text-green-400">{verified.length}</div>
          <div className="text-xs text-muted-foreground">ยืนยันแล้ว</div>
        </div>
        <div className="glass rounded-xl p-4 border border-violet-500/20 bg-violet-500/5 text-center">
          <div className="text-2xl font-bold text-violet-400">{trainerList.length}</div>
          <div className="text-xs text-muted-foreground">ทั้งหมด</div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass rounded-xl p-6 animate-pulse h-32" />
          ))}
        </div>
      ) : trainerList.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center shadow-card">
          <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">ยังไม่มีเทรนเนอร์</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending Section */}
          {pending.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                รอการยืนยัน ({pending.length})
              </h2>
              <div className="space-y-3">
                {pending.map((t) => (
                  <TrainerCard key={t.id} trainer={t} onVerify={verify.mutate} isPending />
                ))}
              </div>
            </div>
          )}

          {/* Verified Section */}
          {verified.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                ยืนยันแล้ว ({verified.length})
              </h2>
              <div className="space-y-3">
                {verified.map((t) => (
                  <TrainerCard key={t.id} trainer={t} onVerify={verify.mutate} isPending={false} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TrainerCard({
  trainer: t,
  onVerify,
  isPending,
}: {
  trainer: Trainer;
  onVerify: (v: { id: string; isVerified: boolean }) => void;
  isPending: boolean;
}) {
  return (
    <div
      className={`glass rounded-2xl p-5 shadow-card border transition-all ${
        isPending ? "border-yellow-500/20" : "border-green-500/10"
      }`}
    >
      <div className="flex flex-col md:flex-row gap-4">
        {/* Avatar & Basic Info */}
        <div className="flex items-start gap-3 flex-1">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-white/10 grid place-items-center shrink-0 overflow-hidden">
            {t.avatarUrl ? (
              <img src={t.avatarUrl} className="h-full w-full object-cover rounded-xl" />
            ) : (
              <User className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold">{t.displayName}</span>
              {t.isVerified ? (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-400">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400">
                  <Clock className="h-3 w-3" /> Pending
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mb-2">{t.email ?? "—"}</div>

            {/* Details */}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Star className="h-3 w-3 text-amber-400" />
                {Number(t.rating ?? 0).toFixed(1)} ({t.reviewCount ?? 0})
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{t.experienceYears ?? 0} ปี</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-amber-400 font-medium">฿{t.hourlyRateThb ?? 0}/ชม.</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground capitalize">{t.trainingStyle ?? "—"}</span>
            </div>

            {/* Specialties */}
            {t.specialties && t.specialties.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {t.specialties.map((s) => (
                  <span
                    key={s}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}

            {/* Certifications */}
            {t.certifications && t.certifications.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {t.certifications.map((c) => (
                  <span
                    key={c}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400"
                  >
                    📜 {c}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex md:flex-col gap-2 justify-end shrink-0">
          {isPending ? (
            <>
              <Button
                size="sm"
                className="h-8 bg-green-600 hover:bg-green-500 text-xs gap-1"
                onClick={() => onVerify({ id: t.id, isVerified: true })}
              >
                <CheckCircle className="h-3.5 w-3.5" />
                ยืนยัน
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10 gap-1"
                onClick={() => onVerify({ id: t.id, isVerified: false })}
              >
                <XCircle className="h-3.5 w-3.5" />
                ปฏิเสธ
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs border-red-500/30 text-red-400 hover:bg-red-500/10 gap-1"
              onClick={() => onVerify({ id: t.id, isVerified: false })}
            >
              <ShieldX className="h-3.5 w-3.5" />
              ยกเลิกการยืนยัน
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
