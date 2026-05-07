import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const LIMITS = {
  parser: 20,
  chatbot: 100,
} as const;

/**
 * Checks whether the given agent has remaining calls for today (UTC).
 * Uses ai_audit_log to count completed calls for the trip.
 */
export async function checkRateLimit(
  supabase: SupabaseClient<Database>,
  agent: "parser" | "chatbot",
  tripId: string
): Promise<{ allowed: boolean; remaining: number }> {
  const limit = LIMITS[agent];

  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("ai_audit_log")
    .select("id", { count: "exact", head: true })
    .eq("agent", agent)
    .eq("trip_id", tripId)
    .is("error", null)
    .gte("created_at", startOfDay.toISOString());

  const used = count ?? 0;
  const remaining = Math.max(0, limit - used);
  return { allowed: remaining > 0, remaining };
}
