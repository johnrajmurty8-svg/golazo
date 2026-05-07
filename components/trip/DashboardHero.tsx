import { CalendarDays } from "lucide-react";
import type { Trip } from "@/types/database";

interface DashboardHeroProps {
  trip: Trip;
  memberCount: number;
}

function getDaysRemaining(startDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  return Math.round((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function nightsCount(start: string, end: string) {
  return Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function DashboardHero({ trip, memberCount }: DashboardHeroProps) {
  const days = getDaysRemaining(trip.start_date);
  const nights = nightsCount(trip.start_date, trip.end_date);

  let countdownLabel: string;
  let countdownSub: string;

  if (days < 0) {
    countdownLabel = "In progress";
    countdownSub = `${nights} nights`;
  } else if (days === 0) {
    countdownLabel = "Today!";
    countdownSub = "Trip starts today";
  } else {
    countdownLabel = String(days);
    countdownSub = "days to go";
  }

  return (
    <div className="rounded-[var(--radius-xl)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
      {/* Top band */}
      <div className="h-3 bg-gradient-to-r from-[var(--color-primary)] to-[#f5883a]" />

      <div className="px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
        {/* Trip info */}
        <div className="flex-1 min-w-0">
          <h1
            className="text-[var(--font-size-2xl)] font-[var(--font-weight-bold)] text-[var(--color-text-primary)] truncate"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {trip.name}
          </h1>
          {trip.description && (
            <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)] mt-1 truncate">
              {trip.description}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-2 text-[var(--font-size-xs)] text-[var(--color-text-muted)]">
            <CalendarDays size={12} strokeWidth={1.5} />
            <span>
              {formatDate(trip.start_date)} – {formatDate(trip.end_date)}
            </span>
          </div>
        </div>

        {/* Countdown widget */}
        <div className="shrink-0 rounded-[var(--radius-xl)] bg-[var(--color-primary-light)] px-6 py-4 text-center min-w-[120px]">
          <p
            className="text-[var(--font-size-3xl)] font-[var(--font-weight-bold)] text-[var(--color-primary)] leading-none"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {countdownLabel}
          </p>
          <p className="text-[var(--font-size-xs)] text-[var(--color-text-secondary)] mt-1.5">
            {countdownSub}
          </p>
        </div>
      </div>
    </div>
  );
}
