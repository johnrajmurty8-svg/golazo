import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, apiError, isValidUUID, getTripRole, requireOrganiser } from "@/lib/utils/api-helpers";
import { createAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type TripUpdate = Database["public"]["Tables"]["trips"]["Update"];

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
      .from("trips")
      .select("*")
      .eq("id", tripId)
      .is("deleted_at", null)
      .single();

    if (error || !data) return apiError("Trip not found", 404);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[GET /api/trips/[tripId]]", err);
    return apiError("Internal server error", 500);
  }
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

    const allowed: (keyof TripUpdate)[] = ["name", "description", "start_date", "end_date", "cover_image_url"];
    const updates: TripUpdate = {};
    for (const key of allowed) {
      if (key in (body as Record<string, unknown>)) {
        (updates as Record<string, unknown>)[key] = (body as Record<string, unknown>)[key];
      }
    }

    if (Object.keys(updates).length === 0)
      return apiError("No valid fields to update", 400);

    const { data, error } = await supabase
      .from("trips")
      .update(updates)
      .eq("id", tripId)
      .select()
      .single();

    if (error || !data) return apiError(error?.message ?? "Update failed", 500);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[PATCH /api/trips/[tripId]]", err);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { tripId } = await params;
    if (!isValidUUID(tripId)) return apiError("Invalid trip ID", 400);

    const { user, supabase } = await getAuthUser();
    if (!user) return apiError("Unauthorised", 401);

    const guard = await requireOrganiser(supabase, tripId, user.id);
    if (guard !== true) return guard;

    // requireOrganiser already validated the user is the trip's organiser
    // via trip_members. Use the admin client (service-role, no user JWT) so
    // the soft-delete bypasses the trips.organiser_id-based RLS — the two
    // organiser sources can drift (trip_members.role is the canonical source
    // of truth), and the user-scoped client was returning 42501 on the
    // post-update WITH CHECK phase.
    const admin = createAdminClient();
    const { error } = await admin
      .from("trips")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", tripId);

    if (error) {
      console.error("[DELETE /api/trips/[tripId]] supabase update error", {
        tripId,
        userId: user.id,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return apiError(error.message, 500);
    }
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/trips/[tripId]]", err);
    return apiError("Internal server error", 500);
  }
}
