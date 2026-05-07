import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, apiError, isValidUUID, getTripRole, requireOrganiser } from "@/lib/utils/api-helpers";

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
      .from("parsed_accommodation")
      .select("*")
      .eq("trip_id", tripId)
      .order("check_in_date", { ascending: true });

    if (error) return apiError(error.message, 500);
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[GET /api/trips/[tripId]/accommodation]", err);
    return apiError("Internal server error", 500);
  }
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

    const b = body as Record<string, unknown>;
    if (!b.check_in_date || !b.check_out_date)
      return apiError("check_in_date and check_out_date are required", 400);

    const { data, error } = await supabase
      .from("parsed_accommodation")
      .insert({
        trip_id: tripId,
        property_name: typeof b.property_name === "string" ? b.property_name : null,
        location: typeof b.location === "string" ? b.location : null,
        check_in_date: b.check_in_date as string,
        check_out_date: b.check_out_date as string,
        confirmation_number: typeof b.confirmation_number === "string" ? b.confirmation_number : null,
        travellers: Array.isArray(b.travellers) ? b.travellers : null,
        confidence_score: 1.0,
        is_locked: true,
      })
      .select()
      .single();

    if (error || !data) return apiError(error?.message ?? "Failed to create accommodation", 500);
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("[POST /api/trips/[tripId]/accommodation]", err);
    return apiError("Internal server error", 500);
  }
}
