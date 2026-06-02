import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(8000),
});

export const chatWithCoach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      messages: z.array(MessageSchema).min(1).max(40),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // fetch profile for personalization
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name,height_cm,weight_kg,age,gender,goal,activity_level,language")
      .eq("id", userId)
      .maybeSingle();

    const lang = profile?.language === "en" ? "en" : "th";
    const sys =
      lang === "th"
        ? `คุณคือ AI Fitness & Health Coach ของ Fitder X ตอบเป็นภาษาไทย กระชับ ใช้น้ำเสียงให้กำลังใจ. ข้อมูลผู้ใช้: ${JSON.stringify(profile ?? {})}`
        : `You are Fitder X's AI Fitness & Health Coach. Reply concisely and encouragingly. User profile: ${JSON.stringify(profile ?? {})}`;

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: sys }, ...data.messages],
      }),
    });

    if (res.status === 429) throw new Error("Rate limit reached. Please try again in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please add credits in workspace settings.");
    if (!res.ok) throw new Error(`AI error: ${res.status}`);

    const json = await res.json();
    const reply: string = json.choices?.[0]?.message?.content ?? "";

    // persist last exchange
    const last = data.messages[data.messages.length - 1];
    await supabase.from("chat_history").insert([
      { user_id: userId, role: last.role, content: last.content },
      { user_id: userId, role: "assistant", content: reply },
    ]);

    return { reply };
  });

export const generateWorkoutPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles").select("*").eq("id", userId).maybeSingle();

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured");

    const lang = profile?.language === "en" ? "en" : "th";
    const prompt =
      lang === "th"
        ? `สร้างแผนออกกำลังกาย 7 วัน สำหรับ: ${JSON.stringify(profile)}. ตอบเป็น JSON {days:[{day:number,focus:string,exercises:[{name:string,sets:number,reps:string}]}]} เท่านั้น`
        : `Create a 7-day workout plan for: ${JSON.stringify(profile)}. Return ONLY JSON {days:[{day:number,focus:string,exercises:[{name:string,sets:number,reps:string}]}]}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You output strict JSON only, no markdown." },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) throw new Error(`AI error: ${res.status}`);
    const json = await res.json();
    let text: string = json.choices?.[0]?.message?.content ?? "{}";
    text = text.replace(/```json|```/g, "").trim();
    let plan: unknown;
    try { plan = JSON.parse(text); } catch { plan = { raw: text }; }

    const goal = (profile?.goal as string | null) ?? "general_fitness";
    const { data: inserted, error } = await supabase
      .from("workout_plans")
      .insert({
        user_id: userId,
        title: lang === "th" ? "แผน AI 7 วัน" : "AI 7-Day Plan",
        goal: goal as never,
        days_per_week: 7,
        plan: plan as never,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return inserted;
  });
