import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { runParserAgent } from "@/lib/claude/parser-agent";
import { runAlertService } from "@/lib/services/alertService";
import { downloadFile } from "@/lib/services/storageService";
import { extractPdfText } from "@/lib/utils/pdf-extract";

type ParsedFlightInsert = Database["public"]["Tables"]["parsed_flights"]["Insert"];
type ParsedAccomInsert = Database["public"]["Tables"]["parsed_accommodation"]["Insert"];
type ItineraryEventInsert = Database["public"]["Tables"]["itinerary_events"]["Insert"];
type ActionAlertInsert = Database["public"]["Tables"]["action_alerts"]["Insert"];

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
  const allDocTexts: string[] = [];
  const docIds = docs.map((d) => d.id);

  // Mark all as parsing
  await supabase
    .from("documents")
    .update({ parse_status: "parsing" })
    .in("id", docIds);

  // Download and extract text from each doc
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

      let text: string | null = null;
      if (doc.mime_type === "application/pdf") {
        text = await extractPdfText(buffer);
        if (!text) {
          await supabase
            .from("documents")
            .update({ parse_status: "failed", parse_failure_reason: "Scanned or image-only PDF — text could not be extracted. Please enter details manually." })
            .eq("id", doc.id);
          failedDocs.push(doc.id);
          continue;
        }
      } else {
        text = buffer.toString("utf-8");
      }

      allDocTexts.push(`--- ${doc.file_name} ---\n${text}`);
    } catch (err) {
      failedDocs.push(doc.id);
      const reason = err instanceof Error ? err.message : "Unknown error during extraction.";
      await supabase
        .from("documents")
        .update({ parse_status: "failed", parse_failure_reason: reason })
        .eq("id", doc.id);
    }
  }

  if (allDocTexts.length === 0) {
    return { flightsWritten: 0, accommodationWritten: 0, eventsWritten: 0, alertsWritten: 0, skippedLocked: 0, failedDocs };
  }

  let parsed;
  try {
    parsed = await runParserAgent(allDocTexts.join("\n\n"), trip.name, travellers, tripId, userId);
  } catch (err) {
    for (const docId of docIds) {
      await supabase
        .from("documents")
        .update({ parse_status: "failed", parse_failure_reason: "Claude parser error. Please try again or enter details manually." })
        .eq("id", docId);
    }
    throw err;
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

  const [flightsResult, accomResult] = await Promise.all([
    flightsToInsert.length > 0
      ? supabase.from("parsed_flights").insert(flightsToInsert)
      : Promise.resolve({ error: null }),
    accomToInsert.length > 0
      ? supabase.from("parsed_accommodation").insert(accomToInsert)
      : Promise.resolve({ error: null }),
  ]);

  if (flightsResult.error) throw new Error(`Failed to save flights: ${flightsResult.error.message}`);
  if (accomResult.error) throw new Error(`Failed to save accommodation: ${accomResult.error.message}`);

  // Replace AI-generated itinerary events
  await supabase
    .from("itinerary_events")
    .delete()
    .eq("trip_id", tripId)
    .eq("is_locked", false);

  const eventsToInsert: ItineraryEventInsert[] = [];
  for (const e of parsed.events) {
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
      if (dayError || !newDay) continue;
      dayId = newDay.id;
    }

    eventsToInsert.push({
      trip_id: tripId,
      day_id: dayId,
      title: e.title,
      time: e.time,
      description: e.description,
      location: e.location,
      event_type: e.event_type,
      confidence_score: e.confidence_score,
      is_locked: e.confidence_score === 1.0,
    });
  }

  if (eventsToInsert.length > 0) {
    await supabase.from("itinerary_events").insert(eventsToInsert);
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
