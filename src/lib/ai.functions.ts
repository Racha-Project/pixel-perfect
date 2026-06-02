async function post(path: string, body: unknown) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? "Request failed");
  }
  return res.json();
}

export async function generateWorkoutPlan(_args: unknown) {
  return post("/api/ai/workout-plan", {});
}

export async function matchTrainers(args: { data: { trainers: unknown[] } }) {
  return post("/api/ai/match-trainers", { trainers: args.data.trainers });
}

export async function recognizeMeal(args: { data: { description: string } }) {
  return post("/api/ai/recognize-meal", { description: args.data.description });
}

export async function screenHealth(args: { data: { answers: unknown } }) {
  return post("/api/ai/screen-health", { answers: args.data.answers });
}

export async function chatWithCoach(args: { data: { messages: { role: string; content: string }[] } }) {
  return post("/api/ai/chat", { messages: args.data.messages });
}
