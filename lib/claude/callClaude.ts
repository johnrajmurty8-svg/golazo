import Anthropic from "@anthropic-ai/sdk";
import { createServiceClient } from "@/lib/supabase/server";
import crypto from "crypto";

const MODEL = "claude-sonnet-4-20250514";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type ContentBlock = Anthropic.Messages.MessageParam["content"];

interface CallClaudeOptions {
  agent: "parser" | "chatbot";
  systemPrompt: string;
  /** Simple text prompt — used by chatbot. Ignored when userContent is provided. */
  userPrompt?: string;
  /** Rich content array (text + document blocks) — used by parser for PDF support. */
  userContent?: ContentBlock;
  maxTokens: number;
  tripId?: string;
  userId?: string;
}

interface CallClaudeResult {
  content: string;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Core Claude API call. Logs every call to ai_audit_log.
 * Used by both the /api/claude proxy and server-side services.
 */
export async function callClaude(
  opts: CallClaudeOptions
): Promise<CallClaudeResult> {
  const { agent, systemPrompt, userPrompt, userContent, maxTokens, tripId, userId } = opts;

  const hashInput = systemPrompt + (userPrompt ?? "[rich-content]");
  const promptHash = crypto
    .createHash("sha256")
    .update(hashInput)
    .digest("hex");

  const messageContent: ContentBlock = userContent ?? (userPrompt ?? "");

  let content = "";
  let inputTokens = 0;
  let outputTokens = 0;
  let error: string | undefined;

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: messageContent }],
    });

    content =
      message.content[0].type === "text" ? message.content[0].text : "";
    inputTokens = message.usage.input_tokens;
    outputTokens = message.usage.output_tokens;
  } catch (err) {
    error = err instanceof Error ? err.message : "Unknown error";
    throw err;
  } finally {
    // Always log — even on error
    try {
      const serviceClient = await createServiceClient();
      await serviceClient.from("ai_audit_log").insert({
        trip_id: tripId ?? null,
        user_id: userId ?? null,
        agent,
        input_tokens: inputTokens || null,
        output_tokens: outputTokens || null,
        prompt_hash: promptHash,
        response_summary: content ? content.slice(0, 500) : null,
        error: error ?? null,
      });
    } catch (auditErr) {
      console.error("[callClaude] ai_audit_log insert failed:", auditErr);
    }
  }

  return { content, inputTokens, outputTokens };
}
