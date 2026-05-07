import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, apiError, isValidUUID, requireOrganiser } from "@/lib/utils/api-helpers";

interface Params {
  params: Promise<{ tripId: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
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

    const { date, title, time, description, location, event_type } = body as Record<string, unknown>;

    const VALID_EVENT_TYPES = ["flight", "accommodation", "activity", "transfer", "general"] as const;
    type EventType = typeof VALID_EVENT_TYPES[number];

    if (typeof date !== "string" || !date.match(/^\d{4}-\d{2}-\d{2}$/))
      return apiError("date is required (YYYY-MM-DD)", 400);
    if (typeof title !== "string" || title.trim().length === 0)
      return apiError("title is required", 400);

    const { data: existingDay } = await supabase
      .from("itinerary_days")
      .select("id")
      .eq("trip_id", tripId)
      .eq("date", date)
      .maybeSingle();

    let dayId: string;
    if (existingDay) {
      dayId = existingDay.id;
    } else {
      const { data: newDay, error: dayError } = await supabase
        .from("itinerary_days")
        .insert({ trip_id: tripId, date })
        .select("id")
        .single();
      if (dayError || !newDay) return apiError(dayError?.message ?? "Failed to create day", 500);
      dayId = newDay.id;
    }

    const { data, error } = await supabase
      .from("itinerary_events")
      .insert({
        trip_id: tripId,
        day_id: dayId,
        title: title.trim(),
        time: typeof time === "string" ? time : null,
        description: typeof description === "string" ? description : null,
        location: typeof location === "string" ? location : null,
        event_type: (typeof event_type === "string" && VALID_EVENT_TYPES.includes(event_type as EventType))
          ? (event_type as EventType)
          : "general",
        confidence_score: 1.0,
        is_locked: true,
      })
      .select()
      .single();

    if (error || !data) return apiError(error?.message ?? "Failed to create event", 500);
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[POST /api/trips/[tripId]/itinerary/events]", err);
    return apiError("Internal server error", 500);
  }
}
