import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, apiError, isValidUUID, requireOrganiser } from "@/lib/utils/api-helpers";

interface Params {
  params: Promise<{ tripId: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { tripId } = await params;
    if (!isValidUUID(tripId)) return apiError("Invalid trip ID", 400);

    const { user, supabase } = await getAuthUser();
    if (!user) return apiError("Unauthorised", 401);

    const guard = await requireOrganiser(supabase, tripId, user.id);
    if (guard !== true) return guard;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return apiError("Invalid JSON body", 400);
    }

    const { dayId, orderedEventIds } = body as Record<string, unknown>;

    if (typeof dayId !== "string" || !isValidUUID(dayId))
      return apiError("dayId is required", 400);
    if (!Array.isArray(orderedEventIds) || orderedEventIds.some((id) => typeof id !== "string" || !isValidUUID(id)))
      return apiError("orderedEventIds must be an array of UUIDs", 400);

    // Verify all events belong to this trip + day to prevent cross-trip writes.
    const { data: existing, error: fetchErr } = await supabase
      .from("itinerary_events")
      .select("id")
      .eq("trip_id", tripId)
      .eq("day_id", dayId)
      .in("id", orderedEventIds as string[]);

    if (fetchErr) return apiError(fetchErr.message, 500);
    if (!existing || existing.length !== orderedEventIds.length)
      return apiError("One or more events not found in this day", 400);

    // Update sort_order one row at a time. Small N (events in one day) so this is fine.
    for (let i = 0; i < orderedEventIds.length; i++) {
      const id = orderedEventIds[i] as string;
      const { error } = await supabase
        .from("itinerary_events")
        .update({ sort_order: i })
        .eq("id", id)
        .eq("trip_id", tripId);
      if (error) return apiError(error.message, 500);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PATCH /api/trips/[tripId]/itinerary/reorder]", err);
    return apiError("Internal server error", 500);
  }
}
