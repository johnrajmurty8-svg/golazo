import { notFound } from "next/navigation";
import { CalendarDays, Plane, Building2, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SharedTripHeader } from "@/components/trip/SharedTripHeader";

interface SharedTripPageProps {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ token?: string }>;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function nightsCount(start: string, end: string) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));
}

export default async function SharedTripPage({ params, searchParams }: SharedTripPageProps) {
  const { tripId } = await params;
  const { token } = await searchParams;

  if (!token) notFound();

  const supabase = await createClient();

  // Validate share token
  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .eq("share_token", token)
    .is("deleted_at", null)
    .single();

  if (!trip) notFound();

  const nights = nightsCount(trip.start_date, trip.end_date);

  // Fetch members count
  const { count: memberCount } = await supabase
    .from("trip_members")
    .select("id", { count: "exact", head: true })
    .eq("trip_id", tripId);

  // Fetch itinerary days + events
  const { data: days } = await supabase
    .from("itinerary_days")
    .select("*")
    .eq("trip_id", tripId)
    .order("date", { ascending: true });

  const { data: events } = await supabase
    .from("itinerary_events")
    .select("*")
    .eq("trip_id", tripId)
    .order("sort_order", { ascending: true });

  // Fetch flights + accommodation
  const { data: flights } = await supabase
    .from("parsed_flights")
    .select("*")
    .eq("trip_id", tripId)
    .order("departure_date", { ascending: true });

  const { data: accommodation } = await supabase
    .from("parsed_accommodation")
    .select("*")
    .eq("trip_id", tripId)
    .order("check_in_date", { ascending: true });

  const eventsByDay = (events ?? []).reduce<Record<string, typeof events>>((acc, ev) => {
    if (!ev) return acc;
    acc[ev.day_id] = acc[ev.day_id] ?? [];
    acc[ev.day_id]!.push(ev);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <SharedTripHeader tripName={trip.name} />

      <div className="max-w-3xl mx-auto px-5 py-8 space-y-8">
        {/* Hero */}
        <div className="rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-[var(--color-primary)] to-[#f5883a]" />
          <div className="px-6 py-6">
            <h1
              className="text-[var(--font-size-2xl)] font-[var(--font-weight-bold)] text-[var(--color-text-primary)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {trip.name}
            </h1>
            {trip.description && (
              <div className="flex items-center gap-1.5 mt-1 text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
                <MapPin size={13} strokeWidth={1.5} />
                {trip.description}
              </div>
            )}
            <div className="flex items-center gap-1.5 mt-2 text-[var(--font-size-xs)] text-[var(--color-text-muted)]">
              <CalendarDays size={12} strokeWidth={1.5} />
              {formatDate(trip.start_date)} – {formatDate(trip.end_date)} · {nights} nights · {memberCount ?? 0} travellers
            </div>
          </div>
        </div>

        {/* Flights */}
        {flights && flights.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Plane size={16} strokeWidth={1.5} className="text-[var(--color-primary)]" />
              <h2 className="text-[var(--font-size-md)] font-[var(--font-weight-semibold)]" style={{ fontFamily: "var(--font-display)" }}>
                Flights
              </h2>
            </div>
            <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] divide-y divide-[var(--color-border)]">
              {flights.map((f) => (
                <div key={f.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--font-size-sm)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)]">
                      {f.from_airport ?? "?"} → {f.to_airport ?? "?"}
                    </p>
                    <p className="text-[var(--font-size-xs)] text-[var(--color-text-secondary)] mt-0.5">
                      {f.airline ?? "Unknown airline"} {f.flight_number ? `· ${f.flight_number}` : ""}
                      {f.departure_date ? ` · ${formatDate(f.departure_date)}` : ""}
                      {f.departure_time ? ` at ${f.departure_time}` : ""}
                    </p>
                  </div>
                  {f.confirmation_number && (
                    <span className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] font-mono shrink-0">
                      {f.confirmation_number}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Accommodation */}
        {accommodation && accommodation.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Building2 size={16} strokeWidth={1.5} className="text-[var(--color-primary)]" />
              <h2 className="text-[var(--font-size-md)] font-[var(--font-weight-semibold)]" style={{ fontFamily: "var(--font-display)" }}>
                Accommodation
              </h2>
            </div>
            <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] divide-y divide-[var(--color-border)]">
              {accommodation.map((a) => (
                <div key={a.id} className="px-4 py-3">
                  <p className="text-[var(--font-size-sm)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)]">
                    {a.property_name ?? "Unknown property"}
                  </p>
                  <p className="text-[var(--font-size-xs)] text-[var(--color-text-secondary)] mt-0.5">
                    {a.location ? `${a.location} · ` : ""}
                    {a.check_in_date ? `Check in ${formatDate(a.check_in_date)}` : ""}
                    {a.check_out_date ? ` → ${formatDate(a.check_out_date)}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Itinerary */}
        {days && days.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays size={16} strokeWidth={1.5} className="text-[var(--color-primary)]" />
              <h2 className="text-[var(--font-size-md)] font-[var(--font-weight-semibold)]" style={{ fontFamily: "var(--font-display)" }}>
                Itinerary
              </h2>
            </div>
            <div className="space-y-4">
              {days.map((day) => {
                const dayEvents = eventsByDay[day.id] ?? [];
                return (
                  <div key={day.id} className="flex gap-4">
                    <div className="w-14 shrink-0 text-right pt-1">
                      <p className="text-[var(--font-size-lg)] font-[var(--font-weight-bold)] text-[var(--color-primary)]" style={{ fontFamily: "var(--font-display)" }}>
                        {new Date(day.date).toLocaleDateString("en-GB", { day: "numeric" })}
                      </p>
                      <p className="text-[10px] text-[var(--color-text-muted)]">
                        {new Date(day.date).toLocaleDateString("en-GB", { month: "short" })}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] divide-y divide-[var(--color-border)] overflow-hidden shadow-[var(--shadow-sm)]">
                      {dayEvents.length === 0 ? (
                        <p className="px-4 py-3 text-[var(--font-size-xs)] text-[var(--color-text-muted)] italic">
                          No events scheduled.
                        </p>
                      ) : (
                        dayEvents.map((ev) => (
                          <div key={ev!.id} className="px-4 py-3">
                            <p className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text-primary)]">
                              {ev!.time && <span className="text-[var(--color-text-muted)] mr-2">{ev!.time}</span>}
                              {ev!.title}
                            </p>
                            {ev!.location && (
                              <p className="text-[var(--font-size-xs)] text-[var(--color-text-secondary)] mt-0.5">{ev!.location}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Footer CTA */}
        <div className="text-center py-4">
          <p className="text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
            Built with{" "}
            <a href="/signup" className="text-[var(--color-primary)] hover:underline font-[var(--font-weight-medium)]">
              Golazo
            </a>{" "}
            — AI-powered group trip planning
          </p>
        </div>
      </div>
    </div>
  );
}
