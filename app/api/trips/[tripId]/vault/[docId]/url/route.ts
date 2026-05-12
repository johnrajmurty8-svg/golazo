import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getAuthUser, apiError, isValidUUID, getTripRole } from "@/lib/utils/api-helpers";

interface Params {
  params: Promise<{ tripId: string; docId: string }>;
}

const BUCKET = "documents";

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { tripId, docId } = await params;
    if (!isValidUUID(tripId) || !isValidUUID(docId)) return apiError("Invalid ID", 400);

    const { user, supabase } = await getAuthUser();
    if (!user) return apiError("Unauthorised", 401);

    const role = await getTripRole(supabase, tripId, user.id);
    if (!role) return apiError("Forbidden — not a trip member.", 403);

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("storage_path, file_name, mime_type")
      .eq("id", docId)
      .eq("trip_id", tripId)
      .maybeSingle();

    if (docError) {
      console.error("[GET vault url] doc query error:", { docError, docId, tripId, userId: user.id, role });
      return apiError(`Document query error: ${docError.message}`, 500);
    }
    if (!doc) {
      console.error("[GET vault url] doc not found:", { docId, tripId, userId: user.id, role });
      return apiError("Document not found", 404);
    }

    const serviceClient = await createServiceClient();
    const { data: signed, error } = await serviceClient.storage
      .from(BUCKET)
      .createSignedUrl(doc.storage_path, 30);

    if (error || !signed) return apiError(error?.message ?? "Failed to generate URL", 500);

    // Proxy the file through our server so the browser never sees Supabase's
    // X-Frame-Options / CSP headers that block iframe embedding.
    const upstream = await fetch(signed.signedUrl);
    if (!upstream.ok) return apiError("Failed to fetch document from storage", 502);

    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": doc.mime_type ?? "application/octet-stream",
        "Content-Disposition": `inline; filename="${encodeURIComponent(doc.file_name)}"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err) {
    console.error("[GET /api/trips/[tripId]/vault/[docId]/url]", err);
    return apiError("Internal server error", 500);
  }
}
