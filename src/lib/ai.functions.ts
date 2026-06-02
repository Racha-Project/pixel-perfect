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

export const recognizeMeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ description: z.string().min(1).max(500) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles").select("language").eq("id", userId).maybeSingle();

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured");

    const lang = profile?.language === "en" ? "en" : "th";
    const prompt = lang === "th"
      ? `วิเคราะห์อาหาร: "${data.description}"
ตอบเป็น JSON เท่านั้น (ไม่มี markdown):
{"meal":"<ชื่ออาหาร>","calories":<kcal>,"protein_g":<g>,"carbs_g":<g>,"fat_g":<g>}
ประมาณค่าให้สมเหตุสมผลสำหรับอาหารไทย`
      : `Analyze this food: "${data.description}"
Return ONLY JSON (no markdown):
{"meal":"<food name>","calories":<kcal>,"protein_g":<g>,"carbs_g":<g>,"fat_g":<g>}
Use reasonable nutritional estimates.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You output strict JSON only, no markdown fences." },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) throw new Error(`AI error: ${res.status}`);
    const json = await res.json();
    let text: string = json.choices?.[0]?.message?.content ?? "{}";
    text = text.replace(/```json|```/g, "").trim();
    try {
      const result = JSON.parse(text);
      return {
        meal: String(result.meal ?? data.description),
        calories: Number(result.calories ?? 0),
        protein_g: Number(result.protein_g ?? 0),
        carbs_g: Number(result.carbs_g ?? 0),
        fat_g: Number(result.fat_g ?? 0),
      };
    } catch {
      throw new Error("AI could not parse the meal. Try a more specific description.");
    }
  });

const ScreeningAnswersSchema = z.object({
  sleep_quality: z.number().min(1).max(10),
  energy_level: z.number().min(1).max(10),
  stress_level: z.number().min(1).max(10),
  symptoms: z.array(z.string()),
  diet_quality: z.string(),
  exercise_freq: z.string(),
});

export const screenHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ answers: ScreeningAnswersSchema }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles").select("*").eq("id", userId).maybeSingle();

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI is not configured");

    const lang = profile?.language === "en" ? "en" : "th";
    const a = data.answers;

    const prompt = lang === "th"
      ? `ประเมินสุขภาพสำหรับผู้ใช้: ${JSON.stringify({ profile, answers: a })}
ตอบเป็น JSON เท่านั้น (ไม่มี markdown):
{
  "health_score": <0-100>,
  "risk_level": "low"|"medium"|"high",
  "summary": "<สรุปสั้น 2-3 ประโยคเป็นภาษาไทย>",
  "recommendations": ["<คำแนะนำ 1>","<คำแนะนำ 2>","<คำแนะนำ 3>","<คำแนะนำ 4>","<คำแนะนำ 5>"]
}`
      : `Assess the health of this user: ${JSON.stringify({ profile, answers: a })}
Return ONLY JSON (no markdown):
{
  "health_score": <0-100>,
  "risk_level": "low"|"medium"|"high",
  "summary": "<2-3 sentence summary>",
  "recommendations": ["<rec 1>","<rec 2>","<rec 3>","<rec 4>","<rec 5>"]
}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You output strict JSON only, no markdown fences." },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) throw new Error(`AI error: ${res.status}`);
    const json = await res.json();
    let text: string = json.choices?.[0]?.message?.content ?? "{}";
    text = text.replace(/```json|```/g, "").trim();
    let result: { health_score: number; risk_level: string; summary: string; recommendations: string[] };
    try { result = JSON.parse(text); }
    catch { result = { health_score: 60, risk_level: "medium", summary: "Unable to parse AI response.", recommendations: [] }; }

    const { data: inserted, error } = await supabase
      .from("health_screenings")
      .insert({
        user_id: userId,
        answers: data.answers,
        health_score: result.health_score,
        risk_level: result.risk_level,
        ai_summary: result.summary,
        recommendations: result.recommendations,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return inserted;
  });
