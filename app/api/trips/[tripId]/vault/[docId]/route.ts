import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, apiError, isValidUUID, requireOrganiser } from "@/lib/utils/api-helpers";
import { validateFile, uploadFile, deleteFile } from "@/lib/services/storageService";

interface Params {
  params: Promise<{ tripId: string; docId: string }>;
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { tripId, docId } = await params;
  if (!isValidUUID(tripId) || !isValidUUID(docId)) return apiError("Invalid ID", 400);

  const { user, supabase } = await getAuthUser();
  if (!user) return apiError("Unauthorised", 401);

  const guard = await requireOrganiser(supabase, tripId, user.id);
  if (guard !== true) return guard;

  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", docId)
    .eq("trip_id", tripId)
    .single();

  if (!doc) return apiError("Document not found", 404);

  await deleteFile(doc.storage_path);

  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", docId)
    .eq("trip_id", tripId);

  if (error) return apiError(error.message, 500);
  return new NextResponse(null, { status: 204 });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { tripId, docId } = await params;
  if (!isValidUUID(tripId) || !isValidUUID(docId)) return apiError("Invalid ID", 400);

  const { user, supabase } = await getAuthUser();
  if (!user) return apiError("Unauthorised", 401);

  const guard = await requireOrganiser(supabase, tripId, user.id);
  if (guard !== true) return guard;

  const { data: existingDoc } = await supabase
    .from("documents")
    .select("storage_path")
    .eq("id", docId)
    .eq("trip_id", tripId)
    .single();

  if (!existingDoc) return apiError("Document not found", 404);

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return apiError("No file provided", 400);

  const validation = validateFile(file.size, file.type);
  if (!validation.ok) return apiError(validation.error, 400);

  await deleteFile(existingDoc.storage_path);

  const buffer = await file.arrayBuffer();
  const { path, error: uploadError } = await uploadFile(tripId, docId, file.name, buffer, file.type);
  if (uploadError) return apiError(uploadError, 500);

  const { data, error } = await supabase
    .from("documents")
    .update({
      file_name: file.name,
      mime_type: file.type,
      file_size_bytes: file.size,
      storage_path: path,
      parse_status: "unparsed",
      parsed_at: null,
      parse_failure_reason: null,
    })
    .eq("id", docId)
    .eq("trip_id", tripId)
    .select()
    .single();

  if (error || !data) return apiError(error?.message ?? "Replace failed", 500);
  return NextResponse.json(data);
}
