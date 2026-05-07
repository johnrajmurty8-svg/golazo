import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, apiError, isValidUUID, getTripRole } from "@/lib/utils/api-helpers";

interface Params {
  params: Promise<{ tripId: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { tripId } = await params;
    if (!isValidUUID(tripId)) return apiError("Invalid trip ID", 400);

    const { user, supabase } = await getAuthUser();
    if (!user) return apiError("Unauthorised", 401);

    const role = await getTripRole(supabase, tripId, user.id);
    if (!role) return apiError("Not found", 404);

    const { data, error } = await supabase
      .from("itinerary_days")
      .select(`
        id,
        date,
        title,
        itinerary_events(
          id,
          title,
          time,
          description,
          location,
          event_type,
          source_entity_id,
          confidence_score,
          is_locked,
          sort_order,
          created_at
        )
      `)
      .eq("trip_id", tripId)
      .order("date", { ascending: true });

    if (error) return apiError(error.message, 500);
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[GET /api/trips/[tripId]/itinerary]", err);
    return apiError("Internal server error", 500);
  }
}
