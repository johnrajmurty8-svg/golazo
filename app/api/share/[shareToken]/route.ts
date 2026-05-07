import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError } from "@/lib/utils/api-helpers";

interface Params {
  params: Promise<{ shareToken: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { shareToken } = await params;

    if (!shareToken || !/^[a-f0-9]{32}$/.test(shareToken))
      return apiError("Invalid share token", 400);

    const supabase = await createClient();

    const { data: trip, error } = await supabase
      .from("trips")
      .select(`
        id,
        name,
        destination,
        start_date,
        end_date,
        cover_image_url,
        parsed_flights(
          id, airline, flight_number, from_airport, to_airport,
          departure_date, departure_time, arrival_date, arrival_time,
          travellers
        ),
        parsed_accommodation(
          id, property_name, location, check_in_date, check_out_date, travellers
        ),
        itinerary_days(
          id, date, notes,
          itinerary_events(
            id, title, time, description, location, event_type
          )
        )
      `)
      .eq("share_token", shareToken)
      .is("deleted_at", null)
      .single();

    if (error || !trip) return apiError("Trip not found", 404);

    return NextResponse.json(trip);
  } catch (err) {
    console.error("[GET /api/share/[shareToken]]", err);
    return apiError("Internal server error", 500);
  }
}
