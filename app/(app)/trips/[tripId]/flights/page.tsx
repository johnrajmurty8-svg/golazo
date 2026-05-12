import { redirect, notFound } from "next/navigation";
import { Plane } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FlightsTable } from "@/components/flights/FlightsTable";

interface FlightsPageProps {
  params: Promise<{ tripId: string }>;
}

export default async function FlightsPage({ params }: FlightsPageProps) {
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

  const [{ data: flights }, { data: docs }] = await Promise.all([
    supabase
      .from("parsed_flights")
      .select("*")
      .eq("trip_id", tripId)
      .order("departure_date", { ascending: true }),
    supabase
      .from("documents")
      .select("id, file_name")
      .eq("trip_id", tripId),
  ]);

  const docNameById: Record<string, string> = {};
  for (const d of docs ?? []) docNameById[d.id] = d.file_name;

  return (
    <div className="flex-1 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-primary-light)] flex items-center justify-center">
          <Plane size={20} strokeWidth={1.5} className="text-[var(--color-primary)]" />
        </div>
        <div>
          <h1
            className="text-[var(--font-size-xl)] font-[var(--font-weight-bold)] text-[var(--color-text-primary)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Flights
          </h1>
          <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
            {isOrganiser ? "Click any cell to edit. Changes save automatically." : "Read-only view."}
          </p>
        </div>
      </div>

      <FlightsTable
        tripId={tripId}
        initialFlights={flights ?? []}
        isOrganiser={isOrganiser}
        docNameById={docNameById}
      />
    </div>
  );
}
