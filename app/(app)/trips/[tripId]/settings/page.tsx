import { redirect, notFound } from "next/navigation";
import { Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TripForm } from "@/components/trip/TripForm";
import { ShareLinkSection } from "@/components/trip/ShareLinkSection";
import { MemberManagement } from "@/components/trip/MemberManagement";
import { DangerZone } from "@/components/trip/DangerZone";

interface SettingsPageProps {
  params: Promise<{ tripId: string }>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--color-border)]">
        <h2
          className="text-[var(--font-size-sm)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

export default async function SettingsPage({ params }: SettingsPageProps) {
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

  if (!membership || membership.role !== "organiser") {
    redirect(`/trips/${tripId}/dashboard`);
  }

  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .is("deleted_at", null)
    .single();

  if (!trip) notFound();

  const { data: members } = await supabase
    .from("trip_members")
    .select("user_id, role, profiles(display_name, avatar_url)")
    .eq("trip_id", tripId);

  return (
    <div className="flex-1 p-6 lg:p-8 max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-primary-light)] flex items-center justify-center">
          <Settings size={20} strokeWidth={1.5} className="text-[var(--color-primary)]" />
        </div>
        <div>
          <h1
            className="text-[var(--font-size-xl)] font-[var(--font-weight-bold)] text-[var(--color-text-primary)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Trip settings
          </h1>
          <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
            Manage {trip.name}
          </p>
        </div>
      </div>

      {/* Trip details */}
      <Section title="Trip details">
        <TripForm
          mode="edit"
          tripId={tripId}
          defaultValues={{
            name: trip.name,
            description: trip.description ?? "",
            start_date: trip.start_date,
            end_date: trip.end_date,
          }}
        />
      </Section>

      {/* Share link */}
      <Section title="Share link">
        <ShareLinkSection tripId={tripId} shareToken={trip.share_token} />
      </Section>

      {/* Members */}
      <Section title="Group members">
        <MemberManagement
          members={(members ?? []) as Parameters<typeof MemberManagement>[0]["members"]}
        />
      </Section>

      {/* Danger zone */}
      <DangerZone tripId={tripId} tripName={trip.name} />
    </div>
  );
}
