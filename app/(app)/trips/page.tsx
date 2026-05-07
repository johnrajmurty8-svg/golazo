import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TripCard } from "@/components/trip/TripCard";
import { EmptyTripsState } from "@/components/trip/EmptyTripsState";

export default async function TripsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .is("deleted_at", null)
    .order("start_date", { ascending: true });

  return (
    <div className="flex-1 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-[var(--font-size-2xl)] font-[var(--font-weight-bold)] text-[var(--color-text-primary)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            My Trips
          </h1>
          <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)] mt-0.5">
            {trips?.length
              ? `${trips.length} trip${trips.length !== 1 ? "s" : ""}`
              : "No trips yet"}
          </p>
        </div>
        <Link
          href="/trips/new"
          className="inline-flex items-center gap-2 h-10 px-4 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white text-[var(--font-size-sm)] font-[var(--font-weight-medium)] hover:bg-[var(--color-primary-hover)] active:scale-[0.97] transition-all duration-100 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
        >
          <Plus size={16} strokeWidth={2} />
          New Trip
        </Link>
      </div>

      {/* Grid or empty state */}
      {!trips || trips.length === 0 ? (
        <EmptyTripsState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}
