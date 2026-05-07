import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, apiError, isValidUUID, getTripRole, requireOrganiser } from "@/lib/utils/api-helpers";

interface Params {
  params: Promise<{ tripId: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { tripId } = await params;
  if (!isValidUUID(tripId)) return apiError("Invalid trip ID", 400);

  const { user, supabase } = await getAuthUser();
  if (!user) return apiError("Unauthorised", 401);

  const role = await getTripRole(supabase, tripId, user.id);
  if (!role) return apiError("Not found", 404);

  const { data, error } = await supabase
    .from("parsed_flights")
    .select("*")
    .eq("trip_id", tripId)
    .order("departure_date", { ascending: true });

  if (error) return apiError(error.message, 500);
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest, { params }: Params) {
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

  const b = body as Record<string, unknown>;
  if (!b.departure_date) return apiError("departure_date is required", 400);

  const { data, error } = await supabase
    .from("parsed_flights")
    .insert({
      trip_id: tripId,
      airline: typeof b.airline === "string" ? b.airline : null,
      flight_number: typeof b.flight_number === "string" ? b.flight_number : null,
      from_airport: typeof b.from_airport === "string" ? b.from_airport : null,
      to_airport: typeof b.to_airport === "string" ? b.to_airport : null,
      departure_date: b.departure_date as string,
      departure_time: typeof b.departure_time === "string" ? b.departure_time : null,
      arrival_date: typeof b.arrival_date === "string" ? b.arrival_date : null,
      arrival_time: typeof b.arrival_time === "string" ? b.arrival_time : null,
      confirmation_number: typeof b.confirmation_number === "string" ? b.confirmation_number : null,
      travellers: Array.isArray(b.travellers) ? b.travellers : null,
      confidence_score: 1.0,
      is_locked: true,
    })
    .select()
    .single();

  if (error || !data) return apiError(error?.message ?? "Failed to create flight", 500);
  return NextResponse.json(data, { status: 201 });
}
