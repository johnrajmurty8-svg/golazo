import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  getAuthUser,
  apiError,
  isValidUUID,
  requireOrganiser,
  getTripRole,
  sanitiseFilename,
} from "@/lib/utils/api-helpers";
import { createServiceClient } from "@/lib/supabase/server";

const BUCKET = "event-attachments";
const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = ["application/pdf", "text/plain"];
const SIGNED_URL_TTL = 60 * 60; // 60 minutes

interface Params {
  params: Promise<{ tripId: string; eventId: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { tripId, eventId } = await params;
    if (!isValidUUID(tripId) || !isValidUUID(eventId)) return apiError("Invalid ID", 400);

    const { user, supabase } = await getAuthUser();
    if (!user) return apiError("Unauthorised", 401);

    const role = await getTripRole(supabase, tripId, user.id);
    if (!role) return apiError("Not found", 404);

    const { data: attachments, error } = await supabase
      .from("event_attachments")
      .select("id, file_name, file_size, mime_type, uploaded_at, storage_path, uploaded_by")
      .eq("trip_id", tripId)
      .eq("event_id", eventId)
      .order("uploaded_at", { ascending: true });

    if (error) return apiError(error.message, 500);

    const service = await createServiceClient();
    const results = await Promise.all(
      (attachments ?? []).map(async (a) => {
        const { data: signed } = await service.storage
          .from(BUCKET)
          .createSignedUrl(a.storage_path, SIGNED_URL_TTL);
        return {
          id: a.id,
          file_name: a.file_name,
          file_size: a.file_size,
          mime_type: a.mime_type,
          uploaded_at: a.uploaded_at,
          uploaded_by: a.uploaded_by,
          download_url: signed?.signedUrl ?? null,
        };
      })
    );

    return NextResponse.json(results);
  } catch (err) {
    console.error("[GET /api/trips/[tripId]/itinerary/events/[eventId]/attachments]", err);
    return apiError("Internal server error", 500);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { tripId, eventId } = await params;
    if (!isValidUUID(tripId) || !isValidUUID(eventId)) return apiError("Invalid ID", 400);

    const { user, supabase } = await getAuthUser();
    if (!user) return apiError("Unauthorised", 401);

    const guard = await requireOrganiser(supabase, tripId, user.id);
    if (guard !== true) return guard;

    // Confirm event exists and belongs to this trip.
    const { data: event } = await supabase
      .from("itinerary_events")
      .select("id")
      .eq("id", eventId)
      .eq("trip_id", tripId)
      .maybeSingle();
    if (!event) return apiError("Event not found", 404);

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return apiError("No file provided", 400);

    if (file.size > MAX_SIZE_BYTES)
      return apiError("File too large. Max size is 10MB.", 400);
    if (!ALLOWED_MIME.includes(file.type))
      return apiError("Only PDF and plain text files are supported.", 400);

    const attachmentId = crypto.randomUUID();
    const safeName = sanitiseFilename(file.name);
    const storagePath = `${tripId}/${eventId}/${attachmentId}-${safeName}`;
    const buffer = await file.arrayBuffer();

    const service = await createServiceClient();
    const { error: uploadErr } = await service.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: file.type, upsert: false });
    if (uploadErr) return apiError(uploadErr.message, 500);

    const { data: row, error: dbErr } = await supabase
      .from("event_attachments")
      .insert({
        id: attachmentId,
        event_id: eventId,
        trip_id: tripId,
        file_name: file.name,
        storage_path: storagePath,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (dbErr || !row) {
      // Clean up storage on DB failure
      await service.storage.from(BUCKET).remove([storagePath]);
      return apiError(dbErr?.message ?? "Failed to record attachment", 500);
    }

    const { data: signed } = await service.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, SIGNED_URL_TTL);

    return NextResponse.json({
      id: row.id,
      file_name: row.file_name,
      file_size: row.file_size,
      mime_type: row.mime_type,
      uploaded_at: row.uploaded_at,
      uploaded_by: row.uploaded_by,
      download_url: signed?.signedUrl ?? null,
    }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/trips/[tripId]/itinerary/events/[eventId]/attachments]", err);
    return apiError("Internal server error", 500);
  }
}
