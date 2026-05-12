import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { runParserAgent, type DocumentInput } from "@/lib/claude/parser-agent";
import { runAlertService } from "@/lib/services/alertService";
import { downloadFile } from "@/lib/services/storageService";

type ParsedFlightInsert = Database["public"]["Tables"]["parsed_flights"]["Insert"];
type ParsedAccomInsert = Database["public"]["Tables"]["parsed_accommodation"]["Insert"];
type ItineraryEventInsert = Database["public"]["Tables"]["itinerary_events"]["Insert"];
type ActionAlertInsert = Database["public"]["Tables"]["action_alerts"]["Insert"];

// Matches the itinerary_events_event_type_check constraint. Anything Claude
// returns outside this set (e.g. "match" for a World Cup ticket) falls back
// to "general" so the row is still saved instead of the whole batch failing.
const VALID_EVENT_TYPES = new Set<ItineraryEventInsert["event_type"]>([
  "flight",
  "accommodation",
  "activity",
  "transfer",
  "general",
]);

export interface ParseServiceResult {
  flightsWritten: number;
  accommodationWritten: number;
  eventsWritten: number;
  alertsWritten: number;
  skippedLocked: number;
  failedDocs: string[];
}

export async function runParseService(
  supabase: SupabaseClient<Database>,
  tripId: string,
  userId: string
): Promise<ParseServiceResult> {
  // Fetch trip name
  const { data: trip } = await supabase
    .from("trips")
    .select("name")
    .eq("id", tripId)
    .single();

  if (!trip) throw new Error("Trip not found");

  // Derive known travellers from trip members
  const { data: members } = await supabase
    .from("trip_members")
    .select("user_id")
    .eq("trip_id", tripId);

  const memberIds = (members ?? []).map((m) => m.user_id);
  let travellers: string[] = [];
  if (memberIds.length > 0) {
    const { data: profileRows } = await supabase
      .from("profiles")
      .select("display_name")
      .in("id", memberIds);
    travellers = (profileRows ?? []).map((p) => p.display_name);
  }

  // Fetch unparsed documents
  const { data: docs } = await supabase
    .from("documents")
    .select("*")
    .eq("trip_id", tripId)
    .eq("parse_status", "unparsed");

  if (!docs || docs.length === 0) {
    return { flightsWritten: 0, accommodationWritten: 0, eventsWritten: 0, alertsWritten: 0, skippedLocked: 0, failedDocs: [] };
  }

  const failedDocs: string[] = [];
  const documentInputs: DocumentInput[] = [];
  const docIds = docs.map((d) => d.id);

  // Mark all as parsing
  await supabase
    .from("documents")
    .update({ parse_status: "parsing" })
    .in("id", docIds);

  // Download each doc — Claude will read them natively (text or scanned PDF)
  for (const doc of docs) {
    try {
      const buffer = await downloadFile(doc.storage_path);
      if (!buffer) {
        failedDocs.push(doc.id);
        await supabase
          .from("documents")
          .update({ parse_status: "failed", parse_failure_reason: "Could not download file from storage." })
          .eq("id", doc.id);
        continue;
      }
      documentInputs.push({ name: doc.file_name, buffer, mimeType: doc.mime_type });
    } catch (err) {
      failedDocs.push(doc.id);
      const reason = err instanceof Error ? err.message : "Unknown error during download.";
      await supabase
        .from("documents")
        .update({ parse_status: "failed", parse_failure_reason: reason })
        .eq("id", doc.id);
    }
  }

  if (documentInputs.length === 0) {
    return { flightsWritten: 0, accommodationWritten: 0, eventsWritten: 0, alertsWritten: 0, skippedLocked: 0, failedDocs };
  }

  let parsed;
  try {
    parsed = await runParserAgent(documentInputs, trip.name, travellers, tripId, userId);
  } catch (err) {
    const realReason = err instanceof Error ? err.message : "Unknown parser error";
    console.error("[parseService] Parser agent failed:", err);
    const failureReason = `Claude parser error. Please try again or enter details manually. (${realReason})`;
    for (const docId of docIds) {
      await supabase
        .from("documents")
        .update({ parse_status: "failed", parse_failure_reason: failureReason })
        .eq("id", docId);
    }
    throw err;
  }

  console.log("[parseService] parser source attribution:", {
    docs: docs.map((d) => d.file_name),
    flightSources: parsed.flights.map((f) => f.source_document_name),
    accomSources: parsed.accommodation.map((a) => a.source_document_name),
    eventSources: parsed.events.map((e) => e.source_document_name),
  });

  // Build filename → doc.id maps for both exact and normalised lookup. We
  // normalise to lowercase + collapsed whitespace so minor formatting drift
  // in Claude's output (e.g. case/spacing) still resolves correctly.
  const normaliseName = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const docIdByName = new Map<string, string>();
  const docIdByNormalisedName = new Map<string, string>();
  for (const d of docs) {
    docIdByName.set(d.file_name, d.id);
    docIdByNormalisedName.set(normaliseName(d.file_name), d.id);
  }
  // Single-document fallback: if there's only one doc being parsed, every
  // extracted item must have come from it.
  const singleDocFallbackId = docs.length === 1 ? docs[0].id : null;

  function resolveDocId(name: string | null): string | null {
    if (!name) return singleDocFallbackId;
    const exact = docIdByName.get(name);
    if (exact) return exact;
    const normalised = docIdByNormalisedName.get(normaliseName(name));
    if (normalised) return normalised;
    return singleDocFallbackId;
  }

  // Fetch existing locked records to skip re-inserting them
  const { data: lockedFlights } = await supabase
    .from("parsed_flights")
    .select("id, flight_number, departure_date")
    .eq("trip_id", tripId)
    .eq("is_locked", true);

  const { data: lockedAccom } = await supabase
    .from("parsed_accommodation")
    .select("id, property_name, check_in_date")
    .eq("trip_id", tripId)
    .eq("is_locked", true);

  const lockedFlightKeys = new Set(
    (lockedFlights ?? []).map((f) => `${f.flight_number}|${f.departure_date}`)
  );
  const lockedAccomKeys = new Set(
    (lockedAccom ?? []).map((a) => `${a.property_name}|${a.check_in_date}`)
  );

  let skippedLocked = 0;

  // Delete non-locked parsed data before re-inserting
  await Promise.all([
    supabase.from("parsed_flights").delete().eq("trip_id", tripId).eq("is_locked", false),
    supabase.from("parsed_accommodation").delete().eq("trip_id", tripId).eq("is_locked", false),
  ]);

  // Build flight inserts
  const flightsToInsert: ParsedFlightInsert[] = [];
  for (const f of parsed.flights) {
    const key = `${f.flight_number}|${f.departure_date}`;
    if (lockedFlightKeys.has(key)) { skippedLocked++; continue; }
    flightsToInsert.push({
      trip_id: tripId,
      source_document_id: resolveDocId(f.source_document_name),
      airline: f.airline,
      flight_number: f.flight_number,
      from_airport: f.from_airport,
      to_airport: f.to_airport,
      departure_date: f.departure_date,
      departure_time: f.departure_time,
      arrival_date: f.arrival_date,
      arrival_time: f.arrival_time,
      confirmation_number: f.confirmation_number,
      travellers: f.travellers,
      confidence_score: f.confidence_score,
      is_locked: f.confidence_score === 1.0,
    });
  }

  // Build accommodation inserts
  const accomToInsert: ParsedAccomInsert[] = [];
  for (const a of parsed.accommodation) {
    const key = `${a.property_name}|${a.check_in_date}`;
    if (lockedAccomKeys.has(key)) { skippedLocked++; continue; }
    accomToInsert.push({
      trip_id: tripId,
      source_document_id: resolveDocId(a.source_document_name),
      property_name: a.property_name,
      location: a.location,
      check_in_date: a.check_in_date,
      check_out_date: a.check_out_date,
      confirmation_number: a.confirmation_number,
      travellers: a.travellers,
      confidence_score: a.confidence_score,
      is_locked: a.confidence_score === 1.0,
    });
  }

  type FlightRow = { id: string; flight_number: string | null; departure_date: string | null };
  type AccomRow = { id: string; property_name: string | null; check_in_date: string | null };

  const [flightsResult, accomResult] = await Promise.all([
    flightsToInsert.length > 0
      ? supabase.from("parsed_flights").insert(flightsToInsert).select("id, flight_number, departure_date")
      : Promise.resolve({ data: [] as FlightRow[], error: null }),
    accomToInsert.length > 0
      ? supabase.from("parsed_accommodation").insert(accomToInsert).select("id, property_name, check_in_date")
      : Promise.resolve({ data: [] as AccomRow[], error: null }),
  ]);

  if (flightsResult.error) throw new Error(`Failed to save flights: ${flightsResult.error.message}`);
  if (accomResult.error) throw new Error(`Failed to save accommodation: ${accomResult.error.message}`);

  // Build lookup maps so events that mention a flight/accom can link back to it via source_entity_id
  const insertedFlights = (flightsResult.data ?? []) as FlightRow[];
  const insertedAccom = (accomResult.data ?? []) as AccomRow[];

  // Best-effort match for events → parsed flight/accom by date so events can
  // dereference back to the source document via source_entity_id.
  const flightIdByDate = new Map<string, string>();
  for (const f of insertedFlights) {
    if (f.departure_date && !flightIdByDate.has(f.departure_date)) {
      flightIdByDate.set(f.departure_date, f.id);
    }
  }
  const accomIdByCheckIn = new Map<string, string>();
  for (const a of insertedAccom) {
    if (a.check_in_date && !accomIdByCheckIn.has(a.check_in_date)) {
      accomIdByCheckIn.set(a.check_in_date, a.id);
    }
  }

  // Replace AI-generated itinerary events
  await supabase
    .from("itinerary_events")
    .delete()
    .eq("trip_id", tripId)
    .eq("is_locked", false);

  const eventsToInsert: ItineraryEventInsert[] = [];
  const skippedEvents: { reason: string; event: unknown }[] = [];
  for (const e of parsed.events) {
    // Drop rows that would violate NOT NULL constraints on itinerary_events
    // before they poison the batch insert.
    const titleOk = typeof e.title === "string" && e.title.trim().length > 0;
    const dateOk = typeof e.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(e.date);
    const confidence = typeof e.confidence_score === "number" && Number.isFinite(e.confidence_score)
      ? Math.max(0, Math.min(1, e.confidence_score))
      : 0.5;
    if (!titleOk || !dateOk) {
      skippedEvents.push({ reason: !titleOk ? "missing title" : "missing/invalid date", event: e });
      continue;
    }

    const { data: day } = await supabase
      .from("itinerary_days")
      .select("id")
      .eq("trip_id", tripId)
      .eq("date", e.date)
      .maybeSingle();

    let dayId: string;
    if (day) {
      dayId = day.id;
    } else {
      const { data: newDay, error: dayError } = await supabase
        .from("itinerary_days")
        .insert({ trip_id: tripId, date: e.date })
        .select("id")
        .single();
      if (dayError || !newDay) {
        skippedEvents.push({ reason: `day insert failed: ${dayError?.message ?? "unknown"}`, event: e });
        continue;
      }
      dayId = newDay.id;
    }

    let sourceEntityId: string | null = null;
    if (e.event_type === "flight") {
      sourceEntityId = flightIdByDate.get(e.date) ?? null;
    } else if (e.event_type === "accommodation") {
      sourceEntityId = accomIdByCheckIn.get(e.date) ?? null;
    }

    // Direct event → document link, so every event type can show its origin
    // (not just flight/accommodation events).
    const sourceDocumentId = resolveDocId(e.source_document_name);

    const safeEventType = VALID_EVENT_TYPES.has(e.event_type as ItineraryEventInsert["event_type"])
      ? (e.event_type as ItineraryEventInsert["event_type"])
      : "general";

    eventsToInsert.push({
      trip_id: tripId,
      day_id: dayId,
      title: e.title.trim(),
      time: e.time,
      description: e.description,
      location: e.location,
      event_type: safeEventType,
      source_entity_id: sourceEntityId,
      source_document_id: sourceDocumentId,
      confidence_score: confidence,
      is_locked: confidence === 1.0,
    });
  }

  if (skippedEvents.length > 0) {
    console.warn("[parseService] skipped events:", skippedEvents);
  }

  if (eventsToInsert.length > 0) {
    const { error: eventsError } = await supabase
      .from("itinerary_events")
      .insert(eventsToInsert)
      .select("id");
    if (eventsError) {
      console.error("[parseService] events insert failed:", eventsError, "first row:", eventsToInsert[0]);
      throw new Error(`Failed to save itinerary events: ${eventsError.message}`);
    }
  }

  // Insert confidence_flag alerts from parser
  const alertsToInsert: ActionAlertInsert[] = parsed.alerts.map((a) => ({
    trip_id: tripId,
    alert_type: a.alert_type,
    severity: a.severity,
    title: a.title,
    description: a.description,
  }));

  if (alertsToInsert.length > 0) {
    await supabase.from("action_alerts").insert(alertsToInsert);
  }

  // Run gap detection (resolves old gap alerts, inserts fresh ones)
  await runAlertService(supabase, tripId);

  const { count: alertCount } = await supabase
    .from("action_alerts")
    .select("*", { count: "exact", head: true })
    .eq("trip_id", tripId)
    .eq("is_resolved", false);

  // Mark successfully processed docs as parsed
  const successfulDocIds = docIds.filter((id) => !failedDocs.includes(id));
  if (successfulDocIds.length > 0) {
    await supabase
      .from("documents")
      .update({ parse_status: "parsed", parsed_at: new Date().toISOString() })
      .in("id", successfulDocIds);
  }

  return {
    flightsWritten: flightsToInsert.length,
    accommodationWritten: accomToInsert.length,
    eventsWritten: eventsToInsert.length,
    alertsWritten: alertCount ?? 0,
    skippedLocked,
    failedDocs,
  };
}
