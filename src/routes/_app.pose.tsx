import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useEffect, useCallback } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Camera, Square, Save, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/pose")({
  head: () => ({ meta: [{ title: "Pose Analysis — Fitder X" }] }),
  component: PosePage,
});

const EXERCISES = [
  { id: "squat",         th: "สควอท",          en: "Squat",         tip_th: "หลังตรง เข่าไม่เกินปลายเท้า",            tip_en: "Keep back straight, knees behind toes" },
  { id: "pushup",        th: "วิดพื้น",          en: "Push Up",       tip_th: "ลำตัวตรง ข้อศอกชิดลำตัว",              tip_en: "Keep body straight, elbows close" },
  { id: "situp",         th: "ซิทอัพ",           en: "Sit Up",        tip_th: "หายใจออกตอนยก ค่อยๆ ลง",               tip_en: "Exhale on rise, slow descent" },
  { id: "lunge",         th: "ลันจ์",             en: "Lunge",         tip_th: "เข่าหน้า 90 องศา หลังตรง",              tip_en: "Front knee 90°, back straight" },
  { id: "jumping_jack",  th: "จัมพิ้งแจ็ก",      en: "Jumping Jack",  tip_th: "กระโดดพร้อมกาง-หุบแขนขา",              tip_en: "Sync arm and leg movements" },
  { id: "plank",         th: "พลังค์ (วินาที)",  en: "Plank (secs)",  tip_th: "สะโพกไม่ยกสูง ลำตัวตรง",               tip_en: "Hips level, body in straight line" },
];

const MOTION_HIGH = 18;
const MOTION_LOW = 6;
const SAMPLE_INTERVAL = 120;

function PosePage() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null);
  const motionStateRef = useRef<"still" | "moving">("still");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [streaming, setStreaming] = useState(false);
  const [exerciseId, setExerciseId] = useState("squat");
  const [reps, setReps] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [motionLevel, setMotionLevel] = useState(0);
  const [saving, setSaving] = useState(false);

  const exercise = EXERCISES.find((e) => e.id === exerciseId)!;
  const isPlank = exerciseId === "plank";

  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    const W = 160, H = 90;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, W, H);

    const frame = ctx.getImageData(0, 0, W, H);
    if (!prevFrameRef.current) {
      prevFrameRef.current = new Uint8ClampedArray(frame.data);
      return;
    }

    let diff = 0;
    for (let i = 0; i < frame.data.length; i += 8) {
      diff += Math.abs(frame.data[i] - prevFrameRef.current[i]);
    }
    const score = diff / (frame.data.length / 8);
    prevFrameRef.current = new Uint8ClampedArray(frame.data);
    setMotionLevel(Math.min(100, Math.round(score * 3)));

    if (!isPlank) {
      if (score > MOTION_HIGH && motionStateRef.current === "still") {
        motionStateRef.current = "moving";
      } else if (score < MOTION_LOW && motionStateRef.current === "moving") {
        motionStateRef.current = "still";
        setReps((r) => r + 1);
      }
    }
  }, [isPlank]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreaming(true);
      setReps(0);
      setSeconds(0);
      prevFrameRef.current = null;
      motionStateRef.current = "still";
    } catch {
      toast.error("Camera access denied");
    }
  };

  const stop = () => {
    const v = videoRef.current;
    if (v?.srcObject) (v.srcObject as MediaStream).getTracks().forEach((tr) => tr.stop());
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    intervalRef.current = null;
    timerRef.current = null;
    setStreaming(false);
  };

  useEffect(() => {
    if (streaming) {
      intervalRef.current = setInterval(processFrame, SAMPLE_INTERVAL);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [streaming, processFrame]);

  const saveSession = async () => {
    if (!user?.id) return;
    setSaving(true);
    const count = isPlank ? Math.round(seconds) : reps;
    const res = await fetch("/api/workout/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        exercise: lang === "th" ? exercise.th : exercise.en,
        reps: isPlank ? null : count,
        sets: isPlank ? null : 1,
        duration_sec: isPlank ? seconds : null,
      }),
    });
    setSaving(false);
    if (!res.ok) return toast.error("Failed to save session");
    toast.success(t("pose_session_saved"));
    stop();
    setReps(0);
    setSeconds(0);
  };

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("pose")}</h1>
        <p className="text-muted-foreground mt-1">{t("pose_desc")}</p>
      </div>

      <div className="glass rounded-2xl p-4 shadow-card">
        <div className="text-sm font-medium mb-2">{t("pose_select_exercise")}</div>
        <div className="flex flex-wrap gap-2">
          {EXERCISES.map((ex) => (
            <button
              key={ex.id}
              onClick={() => { setExerciseId(ex.id); setReps(0); setSeconds(0); }}
              disabled={streaming}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                exerciseId === ex.id
                  ? "bg-primary/20 border-primary text-primary-foreground"
                  : "border-border/40 bg-muted/20 hover:bg-muted/40"
              } disabled:opacity-50`}
            >
              {lang === "th" ? ex.th : ex.en}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="glass rounded-2xl p-4 shadow-card">
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black/70 grid place-items-center">
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
            <canvas ref={canvasRef} className="hidden" />
            {!streaming && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Camera className="h-14 w-14 opacity-30" />
                <span className="text-sm opacity-60">{lang === "th" ? "กดเปิดกล้องเพื่อเริ่ม" : "Press Start Camera to begin"}</span>
              </div>
            )}
            {streaming && (
              <>
                <div className="absolute top-3 left-3 rounded-full bg-destructive/90 px-3 py-1 text-xs font-medium text-destructive-foreground animate-pulse">
                  ● LIVE
                </div>
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur rounded-lg px-3 py-1 text-xs font-mono">
                  {fmtTime(seconds)}
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="text-[10px] text-white/60 mb-1">{t("pose_motion_detected")}</div>
                  <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-100"
                      style={{
                        width: `${motionLevel}%`,
                        background: motionLevel > 60 ? "oklch(0.62 0.22 275)" : motionLevel > 25 ? "oklch(0.78 0.18 195)" : "oklch(0.7 0.03 275)",
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="mt-4 flex gap-2 flex-wrap">
            {!streaming ? (
              <Button onClick={start} className="bg-gradient-primary shadow-glow">
                <Camera className="h-4 w-4 mr-2" />{t("start_camera")}
              </Button>
            ) : (
              <>
                <Button onClick={stop} variant="outline">
                  <Square className="h-4 w-4 mr-2" />Stop
                </Button>
                <Button onClick={() => { setReps(0); setSeconds(0); prevFrameRef.current = null; }} variant="ghost" size="sm">
                  <RefreshCw className="h-4 w-4 mr-1" />Reset
                </Button>
                {(reps > 0 || (isPlank && seconds > 0)) && (
                  <Button onClick={saveSession} disabled={saving} className="bg-gradient-primary ml-auto">
                    <Save className="h-4 w-4 mr-2" />{t("pose_save_session")}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-2xl p-5 shadow-card">
            <div className="text-xs uppercase text-muted-foreground">{lang === "th" ? "ท่าปัจจุบัน" : "Exercise"}</div>
            <div className="mt-2 text-xl font-bold">{lang === "th" ? exercise.th : exercise.en}</div>
          </div>

          {isPlank ? (
            <div className="glass rounded-2xl p-5 shadow-card">
              <div className="text-xs uppercase text-muted-foreground">{t("pose_timer")}</div>
              <div className="mt-2 text-5xl font-bold font-mono text-gradient-primary">{fmtTime(seconds)}</div>
              <div className="mt-2 text-xs text-muted-foreground">{lang === "th" ? "ถือค้างให้นานที่สุด!" : "Hold as long as you can!"}</div>
            </div>
          ) : (
            <div className="glass rounded-2xl p-5 shadow-card">
              <div className="text-xs uppercase text-muted-foreground">{t("pose_rep_count")}</div>
              <div className={`mt-2 text-6xl font-bold text-gradient-primary transition-all ${streaming ? "scale-100" : "opacity-50"}`}>
                {reps}
              </div>
              {streaming && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {motionLevel > 25
                    ? (lang === "th" ? "🏃 กำลังเคลื่อนไหว..." : "🏃 Moving...")
                    : (lang === "th" ? "⏸ หยุดนิ่ง" : "⏸ Still")}
                </div>
              )}
            </div>
          )}

          <div className="glass rounded-2xl p-5 shadow-card">
            <div className="text-xs uppercase text-muted-foreground">{t("pose_form_tip")}</div>
            <div className="mt-2 text-sm leading-relaxed text-primary-glow font-medium">
              💡 {lang === "th" ? exercise.tip_th : exercise.tip_en}
            </div>
          </div>

          {!streaming && (reps > 0 || seconds > 0) && (
            <div className="glass rounded-2xl p-5 shadow-card border border-primary/30">
              <div className="text-xs uppercase text-muted-foreground mb-2">{lang === "th" ? "สรุปเซสชัน" : "Session Summary"}</div>
              {isPlank
                ? <div className="text-2xl font-bold">{fmtTime(seconds)}</div>
                : <div className="text-2xl font-bold">{reps} {lang === "th" ? "ครั้ง" : "reps"}</div>}
              <Button onClick={saveSession} disabled={saving} className="bg-gradient-primary w-full mt-3" size="sm">
                <Save className="h-4 w-4 mr-2" />{t("pose_save_session")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
