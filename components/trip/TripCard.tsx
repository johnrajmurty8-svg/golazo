import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { CountdownBadge } from "@/components/ui/CountdownBadge";
import type { Trip } from "@/types/database";

interface TripCardProps {
  trip: Trip;
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  return `${s.toLocaleDateString("en-GB", opts)} – ${e.toLocaleDateString("en-GB", opts)}`;
}

function nightsCount(start: string, end: string) {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export function TripCard({ trip }: TripCardProps) {
  const nights = nightsCount(trip.start_date, trip.end_date);
  const initial = trip.name.charAt(0).toUpperCase();

  return (
    <Link
      href={`/trips/${trip.id}/dashboard`}
      className="block group rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:border-[var(--color-border-strong)] transition-all duration-120 overflow-hidden"
    >
      {/* Cover area */}
      <div className="h-28 bg-gradient-to-br from-[var(--color-primary-light)] to-[#fde8d8] flex items-center justify-center relative">
        <div className="w-16 h-16 rounded-[var(--radius-lg)] bg-[var(--color-primary)] flex items-center justify-center shadow-[var(--shadow-md)]">
          <span
            className="text-white text-3xl font-[var(--font-weight-bold)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {initial}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <CountdownBadge startDate={trip.start_date} />
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h2
          className="text-[var(--font-size-md)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)] truncate mb-2 group-hover:text-[var(--color-primary)] transition-colors"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {trip.name}
        </h2>

        <div className="flex items-center gap-1.5 text-[var(--font-size-xs)] text-[var(--color-text-secondary)] mb-1">
          <CalendarDays size={12} strokeWidth={1.5} className="shrink-0" />
          <span>{formatDateRange(trip.start_date, trip.end_date)}</span>
        </div>

        {trip.description && (
          <div className="flex items-center gap-1.5 text-[var(--font-size-xs)] text-[var(--color-text-secondary)]">
            <MapPin size={12} strokeWidth={1.5} className="shrink-0" />
            <span className="truncate">{trip.description}</span>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center justify-between">
          <span className="text-[var(--font-size-xs)] text-[var(--color-text-muted)]">
            {nights} night{nights !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </Link>
  );
}
