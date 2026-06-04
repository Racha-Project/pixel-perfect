import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/trainer/availability")({
  head: () => ({ meta: [{ title: "Availability — Fitder X" }] }),
  component: AvailabilityPage,
});

type Slot = { id: string; dayOfWeek: number; startTime: string; endTime: string };

const DAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัส", "ศุกร์", "เสาร์"];
const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIME_BLOCKS = [
  { label: "เช้า",   start: "09:00", end: "12:00" },
  { label: "บ่าย",  start: "12:00", end: "17:00" },
  { label: "เย็น",  start: "17:00", end: "21:00" },
];

function AvailabilityPage() {
  const qc = useQueryClient();

  const { data: slots = [], isLoading } = useQuery<Slot[]>({
    queryKey: ["trainer-availability"],
    queryFn: async () => {
      const res = await fetch("/api/trainer/availability", { credentials: "include" });
      return res.ok ? res.json() : [];
    },
  });

  const addSlot = useMutation({
    mutationFn: async ({ day, start, end }: { day: number; start: string; end: string }) => {
      const res = await fetch("/api/trainer/availability", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day_of_week: day, start_time: start, end_time: end }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["trainer-availability"] }); toast.success("เพิ่มช่วงเวลาแล้ว"); },
    onError: () => toast.error("เกิดข้อผิดพลาด"),
  });

  const removeSlot = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/trainer/availability/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["trainer-availability"] }); toast.success("ลบช่วงเวลาแล้ว"); },
    onError: () => toast.error("เกิดข้อผิดพลาด"),
  });

  const isActive = (day: number, start: string, end: string) =>
    slots.some(s => s.dayOfWeek === day && s.startTime === start && s.endTime === end);

  const getSlot = (day: number, start: string, end: string) =>
    slots.find(s => s.dayOfWeek === day && s.startTime === start && s.endTime === end);

  const toggle = (day: number, start: string, end: string) => {
    const existing = getSlot(day, start, end);
    if (existing) removeSlot.mutate(existing.id);
    else addSlot.mutate({ day, start, end });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-purple-400 mb-1">Trainer Portal</div>
        <h1 className="text-3xl font-bold tracking-tight">ตารางเวลาว่าง</h1>
        <p className="text-sm text-muted-foreground mt-1">คลิกช่องเวลาเพื่อเปิด/ปิดรับการจอง</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-violet-500/30 border border-violet-500/50" />ว่าง / รับจอง</div>
            <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-muted/20 border border-border/30" />ไม่ว่าง</div>
          </div>

          {/* Weekly grid */}
          <div className="glass rounded-2xl shadow-card overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-8 border-b border-border/30">
              <div className="p-3 text-xs text-muted-foreground font-medium">ช่วงเวลา</div>
              {DAYS.map((d, i) => (
                <div key={i} className="p-3 text-center">
                  <div className="text-xs font-semibold">{DAYS_EN[i]}</div>
                  <div className="text-[10px] text-muted-foreground">{d}</div>
                </div>
              ))}
            </div>

            {/* Rows */}
            {TIME_BLOCKS.map(({ label, start, end }) => (
              <div key={start} className="grid grid-cols-8 border-b border-border/20 last:border-0">
                <div className="p-3">
                  <div className="text-xs font-medium">{label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{start}–{end}</div>
                </div>
                {DAYS.map((_, dayIdx) => {
                  const active = isActive(dayIdx, start, end);
                  const busy = addSlot.isPending || removeSlot.isPending;
                  return (
                    <div key={dayIdx} className="p-2 flex items-center justify-center">
                      <button
                        onClick={() => toggle(dayIdx, start, end)}
                        disabled={busy}
                        className={`w-full h-12 rounded-xl border text-xs font-medium transition-all ${
                          active
                            ? "bg-violet-500/20 border-violet-500/50 text-violet-300 hover:bg-violet-500/30"
                            : "bg-muted/10 border-border/20 text-muted-foreground hover:border-border/50"
                        }`}
                      >
                        {active ? "✓" : "–"}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Slots summary */}
          {slots.length > 0 && (
            <div className="glass rounded-2xl p-5 shadow-card">
              <h2 className="font-semibold mb-3 text-sm">ช่วงเวลาที่เปิดรับ ({slots.length} ช่วง)</h2>
              <div className="flex flex-wrap gap-2">
                {slots.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)).map(s => (
                  <div key={s.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-xs">
                    <span className="font-medium text-violet-300">{DAYS_EN[s.dayOfWeek]}</span>
                    <span className="text-muted-foreground">{s.startTime}–{s.endTime}</span>
                    <button onClick={() => removeSlot.mutate(s.id)} className="text-muted-foreground hover:text-red-400 ml-0.5">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
