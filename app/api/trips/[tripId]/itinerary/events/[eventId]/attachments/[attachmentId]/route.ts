import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, apiError, isValidUUID, requireOrganiser } from "@/lib/utils/api-helpers";
import { createServiceClient } from "@/lib/supabase/server";

const BUCKET = "event-attachments";

interface Params {
  params: Promise<{ tripId: string; eventId: string; attachmentId: string }>;
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { tripId, eventId, attachmentId } = await params;
    if (!isValidUUID(tripId) || !isValidUUID(eventId) || !isValidUUID(attachmentId))
      return apiError("Invalid ID", 400);

    const { user, supabase } = await getAuthUser();
    if (!user) return apiError("Unauthorised", 401);

    const guard = await requireOrganiser(supabase, tripId, user.id);
    if (guard !== true) return guard;

    const { data: row, error: fetchErr } = await supabase
      .from("event_attachments")
      .select("storage_path")
      .eq("id", attachmentId)
      .eq("trip_id", tripId)
      .eq("event_id", eventId)
      .maybeSingle();

    if (fetchErr) return apiError(fetchErr.message, 500);
    if (!row) return apiError("Attachment not found", 404);

    const service = await createServiceClient();
    await service.storage.from(BUCKET).remove([row.storage_path]);

    const { error: delErr } = await supabase
      .from("event_attachments")
      .delete()
      .eq("id", attachmentId)
      .eq("trip_id", tripId);

    if (delErr) return apiError(delErr.message, 500);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/trips/[tripId]/itinerary/events/[eventId]/attachments/[attachmentId]]", err);
    return apiError("Internal server error", 500);
  }
}
