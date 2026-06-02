export type UserType = "client" | "trainer";

export async function getUserType(userId: string): Promise<UserType | null> {
  try {
    const res = await fetch("/api/profile", { credentials: "include" });
    if (!res.ok) return "client";
    const data = await res.json();
    return (data?.userType as UserType) || "client";
  } catch {
    return null;
  }
}

export async function isTrainer(userId: string): Promise<boolean> {
  const userType = await getUserType(userId);
  return userType === "trainer";
}

export async function isClient(userId: string): Promise<boolean> {
  const userType = await getUserType(userId);
  return userType === "client";
}
