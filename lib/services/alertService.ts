import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Runs gap detection after every parse.
 * Detects: missing accommodation for flight date ranges, date conflicts.
 * Writes new action_alerts; marks previously auto-generated resolved alerts
 * as is_resolved = true before inserting fresh ones.
 */
export async function runAlertService(
  supabase: SupabaseClient<Database>,
  tripId: string
): Promise<void> {
  const [flightsRes, accomRes] = await Promise.all([
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
  ]);

  const flights = flightsRes.data ?? [];
  const accommodation = accomRes.data ?? [];

  const newAlerts: Database["public"]["Tables"]["action_alerts"]["Insert"][] = [];

  // Resolve all previous auto-generated (non-confidence-flag) alerts
  await supabase
    .from("action_alerts")
    .update({ is_resolved: true })
    .eq("trip_id", tripId)
    .in("alert_type", ["missing_booking", "date_conflict", "traveller_gap", "general"]);

  // Check each arrival date is covered by accommodation
  for (const flight of flights) {
    if (!flight.arrival_date) continue;

    const arrivalDate = flight.arrival_date;
    const covered = accommodation.some(
      (a) =>
        a.check_in_date &&
        a.check_out_date &&
        a.check_in_date <= arrivalDate &&
        a.check_out_date > arrivalDate
    );

    if (!covered) {
      newAlerts.push({
        trip_id: tripId,
        alert_type: "missing_booking",
        severity: "warning",
        title: "No accommodation on arrival date",
        description: `Flight ${flight.flight_number ?? ""} arrives ${arrivalDate} (${flight.to_airport ?? "destination"}) but no accommodation is booked for that night.`,
        related_entity_type: "flight",
        related_entity_id: flight.id,
      });
    }
  }

  // Detect overlapping accommodation
  for (let i = 0; i < accommodation.length; i++) {
    for (let j = i + 1; j < accommodation.length; j++) {
      const a = accommodation[i];
      const b = accommodation[j];
      if (!a.check_in_date || !a.check_out_date || !b.check_in_date || !b.check_out_date) continue;

      const overlap = a.check_in_date < b.check_out_date && b.check_in_date < a.check_out_date;
      if (overlap) {
        newAlerts.push({
          trip_id: tripId,
          alert_type: "date_conflict",
          severity: "warning",
          title: "Overlapping accommodation",
          description: `"${a.property_name ?? "Property A"}" (${a.check_in_date}–${a.check_out_date}) overlaps with "${b.property_name ?? "Property B"}" (${b.check_in_date}–${b.check_out_date}).`,
        });
      }
    }
  }

  if (newAlerts.length > 0) {
    await supabase.from("action_alerts").insert(newAlerts);
  }
}
