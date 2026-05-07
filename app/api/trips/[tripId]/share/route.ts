import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, apiError, isValidUUID, requireOrganiser } from "@/lib/utils/api-helpers";
import crypto from "crypto";

interface Params {
  params: Promise<{ tripId: string }>;
}

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { tripId } = await params;
    if (!isValidUUID(tripId)) return apiError("Invalid trip ID", 400);

    const { user, supabase } = await getAuthUser();
    if (!user) return apiError("Unauthorised", 401);

    const guard = await requireOrganiser(supabase, tripId, user.id);
    if (guard !== true) return guard;

    const newToken = crypto.randomBytes(16).toString("hex");

    const { data, error } = await supabase
      .from("trips")
      .update({ share_token: newToken })
      .eq("id", tripId)
      .select("share_token")
      .single();

    if (error || !data) return apiError(error?.message ?? "Failed to regenerate token", 500);
    return NextResponse.json({ share_token: data.share_token });
  } catch (err) {
    console.error("[POST /api/trips/[tripId]/share]", err);
    return apiError("Internal server error", 500);
  }
}
