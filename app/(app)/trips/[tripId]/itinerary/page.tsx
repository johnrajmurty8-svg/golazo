import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ItineraryView } from "@/components/itinerary/ItineraryView";

interface ItineraryPageProps {
  params: Promise<{ tripId: string }>;
}

export default async function ItineraryPage({ params }: ItineraryPageProps) {
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

  const isOrganiser = membership.role === "organiser";

  const { data: trip } = await supabase
    .from("trips")
    .select("name, start_date, end_date")
    .eq("id", tripId)
    .single();

  if (!trip) notFound();

  // Fetch days, events, members (for traveller multi-select), and the supporting
  // tables needed to resolve event source documents.
  const [
    { data: days },
    { data: events },
    { data: members },
    { data: flights },
    { data: accommodation },
    { data: docs },
  ] = await Promise.all([
    supabase.from("itinerary_days").select("*").eq("trip_id", tripId).order("date", { ascending: true }),
    supabase.from("itinerary_events").select("*").eq("trip_id", tripId).order("sort_order", { ascending: true }),
    supabase
      .from("trip_members")
      .select("user_id, profiles:profiles!inner(display_name)")
      .eq("trip_id", tripId),
    supabase.from("parsed_flights").select("id, source_document_id").eq("trip_id", tripId),
    supabase.from("parsed_accommodation").select("id, source_document_id").eq("trip_id", tripId),
    supabase.from("documents").select("id, file_name").eq("trip_id", tripId),
  ]);

  // Build event → source document map (resolve via parsed_flights / parsed_accommodation)
  const docNameById: Record<string, string> = {};
  for (const d of docs ?? []) docNameById[d.id] = d.file_name;

  const entityToDocId = new Map<string, string>();
  for (const f of flights ?? []) {
    if (f.source_document_id) entityToDocId.set(f.id, f.source_document_id);
  }
  for (const a of accommodation ?? []) {
    if (a.source_document_id) entityToDocId.set(a.id, a.source_document_id);
  }

  const eventSourceById: Record<string, { docId: string; fileName: string }> = {};
  for (const ev of events ?? []) {
    // Prefer the direct event → document link. Fall back to the entity hop
    // (event → parsed_flight/accommodation → document) for legacy events
    // parsed before migration 016 added source_document_id.
    let docId: string | null = ev.source_document_id ?? null;
    if (!docId && ev.source_entity_id) {
      docId = entityToDocId.get(ev.source_entity_id) ?? null;
    }
    if (!docId) continue;
    const fileName = docNameById[docId];
    if (!fileName) continue;
    eventSourceById[ev.id] = { docId, fileName };
  }

  type MemberRow = {
    user_id: string;
    profiles: { display_name: string } | { display_name: string }[];
  };
  const tripMembers = (members as MemberRow[] | null ?? []).map((m) => {
    const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    return { user_id: m.user_id, display_name: p?.display_name ?? "Unknown" };
  });

  return (
    <div className="flex-1 p-6 lg:p-8 max-w-3xl">
      <ItineraryView
        tripId={tripId}
        tripName={trip.name}
        tripStart={trip.start_date}
        tripEnd={trip.end_date}
        isOrganiser={isOrganiser}
        initialDays={days ?? []}
        initialEvents={events ?? []}
        eventSourceById={eventSourceById}
        tripMembers={tripMembers}
      />
    </div>
  );
}
