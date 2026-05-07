import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, apiError, isValidUUID, getTripRole, requireOrganiser } from "@/lib/utils/api-helpers";
import { validateFile, uploadFile } from "@/lib/services/storageService";
import crypto from "crypto";

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
      .from("documents")
      .select("id, file_name, mime_type, file_size_bytes, parse_status, parsed_at, parse_failure_reason, uploaded_by, uploaded_at")
      .eq("trip_id", tripId)
      .order("uploaded_at", { ascending: false });

    if (error) return apiError(error.message, 500);
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[GET /api/trips/[tripId]/vault]", err);
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

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return apiError("No file provided", 400);

    const validation = validateFile(file.size, file.type);
    if (!validation.ok) return apiError(validation.error, 400);

    const docId = crypto.randomUUID();
    const buffer = await file.arrayBuffer();

    const { path, error: uploadError } = await uploadFile(tripId, docId, file.name, buffer, file.type);
    if (uploadError) return apiError(uploadError, 500);

    const { data: doc, error: dbError } = await supabase
      .from("documents")
      .insert({
        id: docId,
        trip_id: tripId,
        file_name: file.name,
        mime_type: file.type,
        file_size_bytes: file.size,
        storage_path: path,
        uploaded_by: user.id,
        parse_status: "unparsed",
      })
      .select()
      .single();

    if (dbError || !doc) return apiError(dbError?.message ?? "Failed to save document record", 500);
    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    console.error("[POST /api/trips/[tripId]/vault]", err);
    return apiError("Internal server error", 500);
  }
}
