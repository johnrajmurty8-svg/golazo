import { NextRequest, NextResponse } from "next/server";
import { callClaude } from "@/lib/claude/callClaude";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { getAuthUser, apiError, isValidUUID } from "@/lib/utils/api-helpers";

export async function POST(req: NextRequest) {
  const { user, supabase } = await getAuthUser();
  if (!user) return apiError("Unauthorised", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const { agent, systemPrompt, userPrompt, maxTokens, tripId } = body as Record<string, unknown>;

  if (typeof agent !== "string" || !["parser", "chatbot"].includes(agent))
    return apiError("Invalid agent", 400);
  if (typeof systemPrompt !== "string" || typeof userPrompt !== "string")
    return apiError("systemPrompt and userPrompt are required", 400);
  if (typeof maxTokens !== "number" || maxTokens < 1 || maxTokens > 4096)
    return apiError("maxTokens must be a number between 1 and 4096", 400);
  if (tripId !== undefined && (typeof tripId !== "string" || !isValidUUID(tripId)))
    return apiError("Invalid tripId", 400);

  let rateLimitRemaining: number | undefined;
  if (typeof tripId === "string") {
    const { allowed, remaining } = await checkRateLimit(supabase, agent as "parser" | "chatbot", tripId);
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit reached. Try again tomorrow.", remaining: 0 },
        { status: 429 }
      );
    }
    rateLimitRemaining = remaining;
  }

  const result = await callClaude({
    agent: agent as "parser" | "chatbot",
    systemPrompt,
    userPrompt,
    maxTokens,
    tripId: typeof tripId === "string" ? tripId : undefined,
    userId: user.id,
  });

  const headers: Record<string, string> = {};
  if (rateLimitRemaining !== undefined) {
    headers["X-RateLimit-Remaining"] = String(rateLimitRemaining);
  }

  return NextResponse.json(result, { headers });
}
