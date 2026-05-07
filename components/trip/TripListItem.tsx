"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { CountdownBadge } from "@/components/ui/CountdownBadge";
import type { Trip } from "@/types/database";

interface TripListItemProps {
  trip: Trip;
}

export function TripListItem({ trip }: TripListItemProps) {
  const pathname = usePathname();
  const isActive = pathname.includes(`/trips/${trip.id}`);
  const initial = trip.name.charAt(0).toUpperCase();

  return (
    <Link
      href={`/trips/${trip.id}/dashboard`}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] transition-all duration-100 group",
        isActive
          ? "bg-[var(--color-sidebar-hover)]"
          : "hover:bg-[var(--color-sidebar-hover)]"
      )}
    >
      {/* Thumbnail */}
      <div className="w-8 h-8 shrink-0 rounded-[var(--radius-sm)] bg-[var(--color-primary)] flex items-center justify-center">
        <span className="text-white text-[var(--font-size-xs)] font-[var(--font-weight-bold)]">
          {initial}
        </span>
      </div>
      {/* Name */}
      <span className="flex-1 text-[var(--font-size-sm)] text-[var(--color-sidebar-text)] truncate min-w-0 group-hover:text-white transition-colors">
        {trip.name}
      </span>
      {/* Countdown */}
      <CountdownBadge startDate={trip.start_date} />
    </Link>
  );
}
