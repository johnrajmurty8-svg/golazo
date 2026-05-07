import { redirect, notFound } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DaySection } from "@/components/itinerary/DaySection";

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

  // Fetch days
  const { data: days } = await supabase
    .from("itinerary_days")
    .select("*")
    .eq("trip_id", tripId)
    .order("date", { ascending: true });

  // Fetch all events for this trip
  const { data: events } = await supabase
    .from("itinerary_events")
    .select("*")
    .eq("trip_id", tripId)
    .order("sort_order", { ascending: true });

  const eventsByDay = (events ?? []).reduce<Record<string, typeof events>>((acc, ev) => {
    if (!ev) return acc;
    acc[ev.day_id] = acc[ev.day_id] ?? [];
    acc[ev.day_id]!.push(ev);
    return acc;
  }, {});

  return (
    <div className="flex-1 p-6 lg:p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-primary-light)] flex items-center justify-center">
          <CalendarDays size={20} strokeWidth={1.5} className="text-[var(--color-primary)]" />
        </div>
        <div>
          <h1
            className="text-[var(--font-size-xl)] font-[var(--font-weight-bold)] text-[var(--color-text-primary)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Itinerary
          </h1>
          <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
            {trip.name}
          </p>
        </div>
      </div>

      {/* Days */}
      {!days || days.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-[var(--color-surface-secondary)] flex items-center justify-center mb-4">
            <CalendarDays size={24} strokeWidth={1.5} className="text-[var(--color-text-muted)]" />
          </div>
          <p className="text-[var(--font-size-md)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)]">
            No itinerary yet
          </p>
          <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)] mt-1 max-w-xs">
            Parse your booking documents to automatically build your itinerary.
          </p>
        </div>
      ) : (
        <div className="space-y-0">
          {days.map((day) => (
            <DaySection
              key={day.id}
              day={day}
              events={eventsByDay[day.id] ?? []}
              isOrganiser={isOrganiser}
              tripId={tripId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
