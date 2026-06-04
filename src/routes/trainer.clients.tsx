import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users2, Loader2, User, Calendar, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/trainer/clients")({
  head: () => ({ meta: [{ title: "Clients — Trainer Portal" }] }),
  component: ClientsPage,
});

type Client = {
  id: string; name: string; avatar: string | null;
  sessions: number; lastDate: string | null; completedSessions: number;
};

function ClientsPage() {
  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["trainer-clients"],
    queryFn: async () => {
      const res = await fetch("/api/trainer/clients", { credentials: "include" });
      return res.ok ? res.json() : [];
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-purple-400 mb-1">Trainer Portal</div>
        <h1 className="text-3xl font-bold tracking-tight">ลูกค้า</h1>
        <p className="text-sm text-muted-foreground mt-1">{clients.length} ลูกค้าทั้งหมด</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : clients.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center shadow-card">
          <Users2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <p className="text-muted-foreground">ยังไม่มีลูกค้า</p>
          <p className="text-sm text-muted-foreground mt-1">เมื่อลูกค้าจองเซสชัน จะปรากฏที่นี่</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {clients.map(c => (
            <div key={c.id} className="glass rounded-2xl p-5 border border-white/10 shadow-card hover:border-white/20 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary/20 grid place-items-center shrink-0">
                  {c.avatar
                    ? <img src={c.avatar} alt={c.name} className="w-full h-full rounded-xl object-cover" />
                    : <span className="font-bold text-primary text-lg">{(c.name || "?")[0].toUpperCase()}</span>}
                </div>
                <div>
                  <div className="font-semibold">{c.name}</div>
                  {c.lastDate && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3" />ครั้งล่าสุด {c.lastDate}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="glass rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-violet-400">{c.sessions}</div>
                  <div className="text-[10px] text-muted-foreground">เซสชันทั้งหมด</div>
                </div>
                <div className="glass rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-green-400">{c.completedSessions}</div>
                  <div className="text-[10px] text-muted-foreground">เสร็จสมบูรณ์</div>
                </div>
              </div>

              {c.sessions > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Completion rate</span>
                    <span>{Math.round((c.completedSessions / c.sessions) * 100)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400"
                      style={{ width: `${Math.round((c.completedSessions / c.sessions) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
