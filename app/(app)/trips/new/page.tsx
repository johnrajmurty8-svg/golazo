import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TripForm } from "@/components/trip/TripForm";
import { MapPin } from "lucide-react";

export default async function NewTripPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex-1 flex items-start justify-center p-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-primary-light)] flex items-center justify-center">
            <MapPin size={20} strokeWidth={1.5} className="text-[var(--color-primary)]" />
          </div>
          <div>
            <h1
              className="text-[var(--font-size-xl)] font-[var(--font-weight-bold)] text-[var(--color-text-primary)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              New trip
            </h1>
            <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
              Add your trip details to get started.
            </p>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border border-[var(--color-border)] shadow-[var(--shadow-md)] p-8">
          <TripForm mode="create" />
        </div>
      </div>
    </div>
  );
}
