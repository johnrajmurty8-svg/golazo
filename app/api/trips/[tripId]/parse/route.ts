import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getAuthUser, apiError, isValidUUID, requireOrganiser } from "@/lib/utils/api-helpers";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { runParseService } from "@/lib/services/parseService";

interface Params {
  params: Promise<{ tripId: string }>;
}

export async function POST(_req: NextRequest, { params }: Params) {
  const { tripId } = await params;
  if (!isValidUUID(tripId)) return apiError("Invalid trip ID", 400);

  const { user, supabase } = await getAuthUser();
  if (!user) return apiError("Unauthorised", 401);

  const guard = await requireOrganiser(supabase, tripId, user.id);
  if (guard !== true) return guard;

  const { allowed, remaining } = await checkRateLimit(supabase, "parser", tripId);
  if (!allowed) {
    return NextResponse.json(
      { error: "Parse limit reached (20/day). Try again tomorrow." },
      { status: 429, headers: { "X-RateLimit-Remaining": "0" } }
    );
  }

  const serviceClient = await createServiceClient();

  try {
    const result = await runParseService(serviceClient, tripId, user.id);
    return NextResponse.json({ ...result, rateLimitRemaining: remaining - 1 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Parse failed";
    return apiError(message, 500);
  }
}
