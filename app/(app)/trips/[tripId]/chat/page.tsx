import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatPage } from "@/components/chat/ChatPage";

interface ChatPageProps {
  params: Promise<{ tripId: string }>;
}

export default async function TripChatPage({ params }: ChatPageProps) {
  const { tripId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("trip_members")
    .select("role")
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .single();

  if (!membership) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  // Fetch last 50 messages
  const { data: messages } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: true })
    .limit(50);

  // Check rate limit — count today's messages
  const today = new Date().toISOString().slice(0, 10);
  const { count: todayCount } = await supabase
    .from("ai_audit_log")
    .select("id", { count: "exact", head: true })
    .eq("trip_id", tripId)
    .eq("agent", "chatbot")
    .gte("created_at", `${today}T00:00:00Z`);

  const rateLimitHit = (todayCount ?? 0) >= 100;

  const userName = profile?.display_name ?? user.email?.split("@")[0] ?? "You";

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <ChatPage
        tripId={tripId}
        initialMessages={messages ?? []}
        userName={userName}
        userRole={membership.role}
        rateLimitHit={rateLimitHit}
      />
    </div>
  );
}
