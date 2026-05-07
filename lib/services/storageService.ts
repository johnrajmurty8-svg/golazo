import { createServiceClient } from "@/lib/supabase/server";
import { sanitiseFilename } from "@/lib/utils/api-helpers";

const BUCKET = "documents";
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = ["application/pdf", "text/plain"];

export function validateFile(
  size: number,
  mimeType: string
): { ok: true } | { ok: false; error: string } {
  if (size > MAX_SIZE_BYTES)
    return { ok: false, error: "File too large. Max size is 10MB." };
  if (!ALLOWED_MIME.includes(mimeType))
    return { ok: false, error: "Only PDF and plain text files are supported." };
  return { ok: true };
}

export function storagePath(tripId: string, docId: string, filename: string) {
  return `trips/${tripId}/${docId}/${sanitiseFilename(filename)}`;
}

export async function uploadFile(
  tripId: string,
  docId: string,
  filename: string,
  buffer: ArrayBuffer,
  mimeType: string
): Promise<{ path: string; error?: string }> {
  const supabase = await createServiceClient();
  const path = storagePath(tripId, docId, filename);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: mimeType, upsert: false });

  if (error) return { path: "", error: error.message };
  return { path };
}

export async function deleteFile(storagePath: string): Promise<void> {
  const supabase = await createServiceClient();
  await supabase.storage.from(BUCKET).remove([storagePath]);
}

export async function downloadFile(path: string): Promise<Buffer | null> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) return null;
  const ab = await data.arrayBuffer();
  return Buffer.from(ab);
}
