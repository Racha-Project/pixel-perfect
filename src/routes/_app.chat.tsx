import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { chatWithCoach } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/chat")({
  head: () => ({ meta: [{ title: "AI Coach — Fitder X" }] }),
  component: ChatPage,
});

type Msg = { role: "user" | "assistant"; content: string };

function ChatPage() {
  const { t } = useI18n();
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I'm your AI fitness coach. Ask me anything 💪" },
  ]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;
    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setText("");
    setLoading(true);
    try {
      const res = await chatWithCoach({ data: { messages: next } });
      setMsgs([...next, { role: "assistant", content: res.reply }]);
    } catch (err) {
      toast.error((err as Error).message);
      setMsgs(next.slice(0, -1));
      setText(next[next.length - 1].content);
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{t("chat")}</h1>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
              m.role === "user"
                ? "bg-gradient-primary text-primary-foreground shadow-glow"
                : "glass"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="flex justify-start"><div className="glass rounded-2xl px-4 py-3"><Loader2 className="h-4 w-4 animate-spin" /></div></div>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="mt-4 flex gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={t("chat_placeholder")} disabled={loading} />
        <Button type="submit" disabled={loading} className="bg-gradient-primary shadow-glow">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
