import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, apiError, isValidUUID, requireOrganiser } from "@/lib/utils/api-helpers";
import type { Database } from "@/types/database";

type AccomUpdate = Database["public"]["Tables"]["parsed_accommodation"]["Update"];

interface Params {
  params: Promise<{ tripId: string; id: string }>;
}

const EDITABLE_FIELDS: (keyof AccomUpdate)[] = [
  "property_name", "location", "check_in_date", "check_out_date",
  "confirmation_number", "travellers",
];

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { tripId, id } = await params;
    if (!isValidUUID(tripId) || !isValidUUID(id)) return apiError("Invalid ID", 400);

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

    const updates: AccomUpdate = {};
    for (const key of EDITABLE_FIELDS) {
      if (key in (body as Record<string, unknown>)) {
        (updates as Record<string, unknown>)[key] = (body as Record<string, unknown>)[key];
      }
    }

    if (Object.keys(updates).length === 0)
      return apiError("No valid fields to update", 400);

    updates.is_locked = true;
    updates.confidence_score = 1.0;

    const { data, error } = await supabase
      .from("parsed_accommodation")
      .update(updates)
      .eq("id", id)
      .eq("trip_id", tripId)
      .select()
      .single();

    if (error || !data) return apiError(error?.message ?? "Update failed", 500);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[PATCH /api/trips/[tripId]/accommodation/[id]]", err);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { tripId, id } = await params;
    if (!isValidUUID(tripId) || !isValidUUID(id)) return apiError("Invalid ID", 400);

    const { user, supabase } = await getAuthUser();
    if (!user) return apiError("Unauthorised", 401);

    const guard = await requireOrganiser(supabase, tripId, user.id);
    if (guard !== true) return guard;

    const { error } = await supabase
      .from("parsed_accommodation")
      .delete()
      .eq("id", id)
      .eq("trip_id", tripId);

    if (error) return apiError(error.message, 500);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/trips/[tripId]/accommodation/[id]]", err);
    return apiError("Internal server error", 500);
  }
}
