import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { FolderOpen, Plane, Building2, CalendarDays, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DashboardHero } from "@/components/trip/DashboardHero";
import { TripStats } from "@/components/trip/TripStats";
import { MemberAvatarStack } from "@/components/trip/MemberAvatarStack";
import { ActionAlertList } from "@/components/trip/ActionAlertList";
import { ParseCTA } from "@/components/trip/ParseCTA";

interface DashboardPageProps {
  params: Promise<{ tripId: string }>;
}

function nightsCount(start: string, end: string) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { tripId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Validate membership
  const { data: membership } = await supabase
    .from("trip_members")
    .select("role")
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .single();

  if (!membership) notFound();

  const isOrganiser = membership.role === "organiser";

  // Fetch trip
  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .is("deleted_at", null)
    .single();

  if (!trip) notFound();

  // Fetch members with profiles
  const { data: members } = await supabase
    .from("trip_members")
    .select("user_id, role, profiles(display_name, avatar_url)")
    .eq("trip_id", tripId);

  // Fetch alerts
  const { data: alerts } = await supabase
    .from("action_alerts")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false });

  // Fetch document stats
  const { data: docs } = await supabase
    .from("documents")
    .select("id, parse_status")
    .eq("trip_id", tripId);

  const unparsedCount = docs?.filter((d) => d.parse_status === "unparsed").length ?? 0;
  const nights = nightsCount(trip.start_date, trip.end_date);

  // Quick-link sections
  const quickLinks = [
    { label: "Documents", icon: FolderOpen, href: `/trips/${tripId}/vault` },
    { label: "Itinerary", icon: CalendarDays, href: `/trips/${tripId}/itinerary` },
    { label: "Flights", icon: Plane, href: `/trips/${tripId}/flights` },
    { label: "Accommodation", icon: Building2, href: `/trips/${tripId}/accommodation` },
  ];

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 max-w-4xl">
      {/* Hero */}
      <DashboardHero trip={trip} memberCount={members?.length ?? 0} />

      {/* Stats + members row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <TripStats
          nightsCount={nights}
          memberCount={members?.length ?? 0}
          destinations={trip.description}
        />
        <MemberAvatarStack members={(members ?? []) as Parameters<typeof MemberAvatarStack>[0]["members"]} />
      </div>

      {/* Parse CTA */}
      {isOrganiser && unparsedCount > 0 && (
        <ParseCTA tripId={tripId} unparsedCount={unparsedCount} />
      )}

      {/* Alerts */}
      <section>
        <h2
          className="text-[var(--font-size-md)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)] mb-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Action needed
        </h2>
        <ActionAlertList alerts={alerts ?? []} tripId={tripId} />
      </section>

      {/* Quick links */}
      <section>
        <h2
          className="text-[var(--font-size-md)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)] mb-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Quick access
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickLinks.map(({ label, icon: Icon, href }) => (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center gap-2 p-4 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] hover:shadow-[var(--shadow-md)] hover:border-[var(--color-border-strong)] transition-all duration-120 text-center group"
            >
              <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-surface-secondary)] flex items-center justify-center group-hover:bg-[var(--color-primary-light)] transition-colors">
                <Icon size={18} strokeWidth={1.5} className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)] transition-colors" />
              </div>
              <span className="text-[var(--font-size-xs)] font-[var(--font-weight-medium)] text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)] transition-colors">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
