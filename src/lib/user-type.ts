import { supabase } from "@/integrations/supabase/client";

export type UserType = "client" | "trainer";

/**
 * Fetch the user type (client or trainer) from the profiles table
 */
export async function getUserType(userId: string): Promise<UserType | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch user type:", error);
      return null;
    }

    return (data?.user_type as UserType) || "client";
  } catch (error) {
    console.error("Error fetching user type:", error);
    return null;
  }
}

/**
 * Check if the current user is a trainer
 */
export async function isTrainer(userId: string): Promise<boolean> {
  const userType = await getUserType(userId);
  return userType === "trainer";
}

/**
 * Check if the current user is a client
 */
export async function isClient(userId: string): Promise<boolean> {
  const userType = await getUserType(userId);
  return userType === "client";
}
