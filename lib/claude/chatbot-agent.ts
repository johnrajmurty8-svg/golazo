import { callClaude } from "./callClaude";
import type { Trip, ParsedFlight, ParsedAccommodation, ItineraryEvent, ActionAlert, ChatMessage } from "@/types/database";

export interface ChatContext {
  trip: Trip;
  flights: ParsedFlight[];
  accommodation: ParsedAccommodation[];
  events: ItineraryEvent[];
  alerts: ActionAlert[];
  history: ChatMessage[];
  userRole: "organiser" | "member";
  currentDate: string;
}

export interface ChatbotResult {
  reply: string;
  updateBlock: UpdateBlock | null;
}

export interface UpdateBlock {
  type: "update_event" | "add_event" | "delete_event" | "update_flight" | "update_accommodation";
  entityId?: string;
  data: Record<string, unknown>;
}

const ANSWER_SYSTEM = `You are a helpful travel assistant for the trip "{{TRIP_NAME}}".

Answer questions ONLY using the trip data provided. If the answer is not in the data, say: "I don't have that information in your trip details."

Never make up, infer, or guess information that isn't explicitly in the trip data.
Be concise. Use plain language. Current date: {{DATE}}.`;

const UPDATE_SYSTEM = `You are a helpful travel assistant for the trip "{{TRIP_NAME}}". The user is the trip organiser.

You can answer questions AND propose changes to the trip. Always confirm intent before executing changes.

When the organiser has confirmed a change (they said yes/confirm/do it/proceed), include an update block at the end of your response in this exact format:
<update>{"type":"update_event","entityId":"<id>","data":{"field":"value"}}</update>

Valid update types: update_event, add_event, delete_event, update_flight, update_accommodation.
For add_event, include: date (YYYY-MM-DD), title, time (HH:MM or null), location (optional), description (optional).
For delete_event / delete_flight / delete_accommodation, include only entityId.
For updates, include only the fields being changed.

If proposing a change (not yet confirmed), describe it in natural language and ask for confirmation. Do NOT include the update block yet.

Answer questions ONLY using the trip data provided. Current date: {{DATE}}.`;

function buildSystemPrompt(role: "organiser" | "member", tripName: string, date: string): string {
  const template = role === "organiser" ? UPDATE_SYSTEM : ANSWER_SYSTEM;
  return template.replace(/{{TRIP_NAME}}/g, tripName).replace(/{{DATE}}/g, date);
}

function buildTripContext(ctx: ChatContext): string {
  const lines: string[] = [`TRIP: ${ctx.trip.name}`, `Dates: ${ctx.trip.start_date} to ${ctx.trip.end_date}`];

  if (ctx.flights.length > 0) {
    lines.push("\nFLIGHTS:");
    ctx.flights.forEach((f) => {
      lines.push(
        `- [${f.id}] ${f.airline ?? "?"} ${f.flight_number ?? ""} | ${f.from_airport} → ${f.to_airport} | ${f.departure_date} ${f.departure_time ?? ""} → ${f.arrival_date} ${f.arrival_time ?? ""} | Conf: ${f.confirmation_number ?? "N/A"} | Travellers: ${(f.travellers ?? []).join(", ")}`
      );
    });
  }

  if (ctx.accommodation.length > 0) {
    lines.push("\nACCOMMODATION:");
    ctx.accommodation.forEach((a) => {
      lines.push(
        `- [${a.id}] ${a.property_name ?? "?"} | ${a.location ?? "?"} | Check-in: ${a.check_in_date} | Check-out: ${a.check_out_date} | Conf: ${a.confirmation_number ?? "N/A"} | Travellers: ${(a.travellers ?? []).join(", ")}`
      );
    });
  }

  if (ctx.events.length > 0) {
    lines.push("\nITINERARY EVENTS:");
    ctx.events.forEach((e) => {
      lines.push(`- [${e.id}] ${e.time ?? "All day"} | ${e.title} | ${e.location ?? ""} | ${e.description ?? ""}`);
    });
  }

  if (ctx.alerts.filter((a) => !a.is_resolved).length > 0) {
    lines.push("\nACTION ALERTS:");
    ctx.alerts
      .filter((a) => !a.is_resolved)
      .forEach((a) => lines.push(`- [${a.severity.toUpperCase()}] ${a.title}: ${a.description}`));
  }

  return lines.join("\n");
}

function buildConversationPrompt(tripContext: string, history: ChatMessage[], newMessage: string): string {
  const historyText = history
    .slice(-10)
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  return `${tripContext}\n\n--- CONVERSATION ---\n${historyText}\nUser: ${newMessage}\nAssistant:`;
}

function extractUpdateBlock(text: string): { reply: string; updateBlock: UpdateBlock | null } {
  const match = text.match(/<update>([\s\S]*?)<\/update>/);
  if (!match) return { reply: text.trim(), updateBlock: null };

  const reply = text.replace(/<update>[\s\S]*?<\/update>/, "").trim();
  try {
    const updateBlock = JSON.parse(match[1]) as UpdateBlock;
    return { reply, updateBlock };
  } catch {
    return { reply: text.trim(), updateBlock: null };
  }
}

export async function runChatbotAgent(
  message: string,
  ctx: ChatContext,
  userId: string
): Promise<ChatbotResult> {
  const systemPrompt = buildSystemPrompt(ctx.userRole, ctx.trip.name, ctx.currentDate);
  const tripContext = buildTripContext(ctx);
  const userPrompt = buildConversationPrompt(tripContext, ctx.history, message);

  const result = await callClaude({
    agent: "chatbot",
    systemPrompt,
    userPrompt,
    maxTokens: 500,
    tripId: ctx.trip.id,
    userId,
  });

  return extractUpdateBlock(result.content);
}
