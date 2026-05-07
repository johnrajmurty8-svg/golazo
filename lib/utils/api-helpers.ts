import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

export function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Get the authenticated user from the current request context. */
export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Returns the caller's role for a given trip, or null if not a member. */
export async function getTripRole(
  supabase: SupabaseClient<Database>,
  tripId: string,
  userId: string
): Promise<"organiser" | "member" | null> {
  const { data } = await supabase
    .from("trip_members")
    .select("role")
    .eq("trip_id", tripId)
    .eq("user_id", userId)
    .single();

  return (data?.role as "organiser" | "member") ?? null;
}

/** Returns true if user is the organiser, otherwise returns a 403 response. */
export async function requireOrganiser(
  supabase: SupabaseClient<Database>,
  tripId: string,
  userId: string
): Promise<true | NextResponse> {
  const role = await getTripRole(supabase, tripId, userId);
  if (role !== "organiser") {
    return apiError("Forbidden — organiser access required.", 403);
  }
  return true;
}

/** Sanitise a filename: strip path traversal, keep alphanumeric + extension. */
export function sanitiseFilename(raw: string): string {
  const name = raw
    .replace(/[/\\]/g, "")
    .replace(/\.\./g, "")
    .replace(/[^\w.\-]/g, "_");
  return name || "document";
}
