import { createServiceClient } from "@/lib/supabase/server";
import { runChatbotAgent } from "@/lib/claude/chatbot-agent";
import type { ChatContext } from "@/lib/claude/chatbot-agent";
import type { Database } from "@/types/database";

type UpdateBlock = import("@/lib/claude/chatbot-agent").UpdateBlock;

export interface ChatServiceResult {
  reply: string;
  messageId: string;
}

export async function sendChatMessage(
  tripId: string,
  userId: string,
  userMessage: string,
  userRole: "organiser" | "member"
): Promise<ChatServiceResult> {
  const supabase = await createServiceClient();

  // Fetch all context in parallel
  const [tripRes, flightsRes, accomRes, eventsRes, alertsRes, historyRes] =
    await Promise.all([
      supabase.from("trips").select("*").eq("id", tripId).single(),
      supabase
        .from("parsed_flights")
        .select("*")
        .eq("trip_id", tripId)
        .order("departure_date", { ascending: true }),
      supabase
        .from("parsed_accommodation")
        .select("*")
        .eq("trip_id", tripId)
        .order("check_in_date", { ascending: true }),
      supabase
        .from("itinerary_events")
        .select("*")
        .eq("trip_id", tripId)
        .order("time", { ascending: true }),
      supabase
        .from("action_alerts")
        .select("*")
        .eq("trip_id", tripId)
        .eq("is_resolved", false),
      supabase
        .from("chat_messages")
        .select("*")
        .eq("trip_id", tripId)
        .order("created_at", { ascending: true })
        .limit(20),
    ]);

  if (!tripRes.data) throw new Error("Trip not found");

  const ctx: ChatContext = {
    trip: tripRes.data,
    flights: flightsRes.data ?? [],
    accommodation: accomRes.data ?? [],
    events: eventsRes.data ?? [],
    alerts: alertsRes.data ?? [],
    history: historyRes.data ?? [],
    userRole,
    currentDate: new Date().toISOString().split("T")[0],
  };

  // Save user message
  const { data: savedUserMsg } = await supabase
    .from("chat_messages")
    .insert({ trip_id: tripId, user_id: userId, role: "user", content: userMessage })
    .select("id")
    .single();

  // Call the chatbot agent
  const result = await runChatbotAgent(userMessage, ctx, userId);

  // Apply update block if organiser confirmed a change
  if (result.updateBlock && userRole === "organiser") {
    await applyUpdateBlock(supabase, tripId, result.updateBlock);
  }

  // Save assistant reply
  const { data: savedAssistantMsg } = await supabase
    .from("chat_messages")
    .insert({ trip_id: tripId, user_id: userId, role: "assistant", content: result.reply })
    .select("id")
    .single();

  return {
    reply: result.reply,
    messageId: savedAssistantMsg?.id ?? savedUserMsg?.id ?? "",
  };
}

async function applyUpdateBlock(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  tripId: string,
  block: UpdateBlock
): Promise<void> {
  try {
    switch (block.type) {
      case "update_event":
        if (block.entityId) {
          await supabase
            .from("itinerary_events")
            .update({ ...block.data, is_locked: true } as Database["public"]["Tables"]["itinerary_events"]["Update"])
            .eq("id", block.entityId)
            .eq("trip_id", tripId);
        }
        break;

      case "add_event": {
        const eventData = block.data as {
          date: string;
          title: string;
          time?: string | null;
          location?: string | null;
          description?: string | null;
        };
        // Find or create the itinerary day
        const { data: day } = await supabase
          .from("itinerary_days")
          .select("id")
          .eq("trip_id", tripId)
          .eq("date", eventData.date)
          .maybeSingle();

        let dayId: string;
        if (day) {
          dayId = day.id;
        } else {
          const { data: newDay } = await supabase
            .from("itinerary_days")
            .insert({ trip_id: tripId, date: eventData.date })
            .select("id")
            .single();
          if (!newDay) return;
          dayId = newDay.id;
        }

        await supabase.from("itinerary_events").insert({
          trip_id: tripId,
          day_id: dayId,
          title: eventData.title,
          time: eventData.time ?? null,
          location: eventData.location ?? null,
          description: eventData.description ?? null,
          event_type: "general",
          confidence_score: 1.0,
          is_locked: true,
        });
        break;
      }

      case "delete_event":
        if (block.entityId) {
          await supabase
            .from("itinerary_events")
            .delete()
            .eq("id", block.entityId)
            .eq("trip_id", tripId);
        }
        break;

      case "update_flight":
        if (block.entityId) {
          await supabase
            .from("parsed_flights")
            .update({ ...block.data, is_locked: true, confidence_score: 1.0 } as Database["public"]["Tables"]["parsed_flights"]["Update"])
            .eq("id", block.entityId)
            .eq("trip_id", tripId);
        }
        break;

      case "update_accommodation":
        if (block.entityId) {
          await supabase
            .from("parsed_accommodation")
            .update({ ...block.data, is_locked: true, confidence_score: 1.0 } as Database["public"]["Tables"]["parsed_accommodation"]["Update"])
            .eq("id", block.entityId)
            .eq("trip_id", tripId);
        }
        break;
    }
  } catch {
    // Update failures should not break the chat response
  }
}
