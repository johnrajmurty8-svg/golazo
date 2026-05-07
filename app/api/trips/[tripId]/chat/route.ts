import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, apiError, isValidUUID, getTripRole } from "@/lib/utils/api-helpers";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { sendChatMessage } from "@/lib/services/chatService";

interface Params {
  params: Promise<{ tripId: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { tripId } = await params;
    if (!isValidUUID(tripId)) return apiError("Invalid trip ID", 400);

    const { user, supabase } = await getAuthUser();
    if (!user) return apiError("Unauthorised", 401);

    const role = await getTripRole(supabase, tripId, user.id);
    if (!role) return apiError("Not found", 404);

    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 100);

    const { data, error } = await supabase
      .from("chat_messages")
      .select("id, role, content, created_at, user_id")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) return apiError(error.message, 500);
    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[GET /api/trips/[tripId]/chat]", err);
    return apiError("Internal server error", 500);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { tripId } = await params;
    if (!isValidUUID(tripId)) return apiError("Invalid trip ID", 400);

    const { user, supabase } = await getAuthUser();
    if (!user) return apiError("Unauthorised", 401);

    const role = await getTripRole(supabase, tripId, user.id);
    if (!role) return apiError("Not found", 404);

    const { allowed, remaining } = await checkRateLimit(supabase, "chatbot", tripId);
    if (!allowed) {
      return NextResponse.json(
        { error: "Chat limit reached (100/day). Try again tomorrow." },
        { status: 429, headers: { "X-RateLimit-Remaining": "0" } }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return apiError("Invalid JSON body", 400);
    }

    const { message } = body as Record<string, unknown>;
    if (typeof message !== "string" || message.trim().length === 0)
      return apiError("message is required", 400);
    if (message.length > 2000)
      return apiError("Message too long (max 2000 characters)", 400);

    try {
      const result = await sendChatMessage(tripId, user.id, message.trim(), role);
      return NextResponse.json(
        { ...result, rateLimitRemaining: remaining - 1 },
        { headers: { "X-RateLimit-Remaining": String(remaining - 1) } }
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Chat failed";
      return apiError(msg, 500);
    }
  } catch (err) {
    console.error("[POST /api/trips/[tripId]/chat]", err);
    return apiError("Internal server error", 500);
  }
}
