import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Camera, Square } from "lucide-react";

export const Route = createFileRoute("/_app/pose")({
  head: () => ({ meta: [{ title: "Pose Analysis — Fitder X" }] }),
  component: PosePage,
});

function PosePage() {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [exercise] = useState("Squat");
  const [reps] = useState(0);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreaming(true);
    } catch {
      alert("Camera access denied");
    }
  };

  const stop = () => {
    const v = videoRef.current;
    if (v?.srcObject) (v.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
    setStreaming(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("pose")}</h1>
        <p className="text-muted-foreground mt-2">{t("pose_desc")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="glass rounded-2xl p-4 shadow-card">
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black/60 grid place-items-center">
            <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
            {!streaming && (
              <div className="absolute inset-0 grid place-items-center text-muted-foreground">
                <Camera className="h-12 w-12 opacity-40" />
              </div>
            )}
            {streaming && (
              <div className="absolute top-3 left-3 rounded-full bg-destructive/90 px-3 py-1 text-xs font-medium text-destructive-foreground animate-pulse">● LIVE</div>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            {!streaming ? (
              <Button onClick={start} className="bg-gradient-primary shadow-glow"><Camera className="h-4 w-4 mr-2" />{t("start_camera")}</Button>
            ) : (
              <Button onClick={stop} variant="outline"><Square className="h-4 w-4 mr-2" />Stop</Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-2xl p-5 shadow-card">
            <div className="text-xs uppercase text-muted-foreground">Exercise</div>
            <div className="mt-2 text-2xl font-bold">{exercise}</div>
          </div>
          <div className="glass rounded-2xl p-5 shadow-card">
            <div className="text-xs uppercase text-muted-foreground">Reps</div>
            <div className="mt-2 text-5xl font-bold text-gradient-primary">{reps}</div>
          </div>
          <div className="glass rounded-2xl p-5 shadow-card">
            <div className="text-xs uppercase text-muted-foreground">Form</div>
            <div className="mt-2 text-success font-medium">✓ Good</div>
            <p className="text-xs text-muted-foreground mt-2">Full MediaPipe/MoveNet integration {t("coming_soon")}.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
