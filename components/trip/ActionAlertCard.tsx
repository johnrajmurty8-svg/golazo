"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight } from "lucide-react";
import type { ActionAlert } from "@/types/database";

interface ActionAlertCardProps {
  alert: ActionAlert;
  tripId: string;
}

const SECTION_MAP: Record<string, string> = {
  parsed_flights: "flights",
  parsed_accommodation: "accommodation",
  itinerary_events: "itinerary",
};

export function ActionAlertCard({ alert, tripId }: ActionAlertCardProps) {
  const router = useRouter();

  const target = alert.related_entity_type
    ? SECTION_MAP[alert.related_entity_type] ?? "dashboard"
    : "dashboard";

  const severityStyles = {
    critical: "border-[var(--color-danger)] bg-[var(--color-danger-bg)]",
    warning: "border-[var(--color-warning)] bg-[var(--color-warning-bg)]",
    info: "border-blue-400 bg-blue-50",
  }[alert.severity];

  const iconColor = {
    critical: "text-[var(--color-danger)]",
    warning: "text-[var(--color-warning)]",
    info: "text-blue-500",
  }[alert.severity];

  return (
    <div
      className={`flex items-start gap-3 rounded-[var(--radius-md)] border-l-4 p-4 cursor-pointer hover:brightness-95 transition-all duration-100 ${severityStyles}`}
      onClick={() => router.push(`/trips/${tripId}/${target}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && router.push(`/trips/${tripId}/${target}`)}
    >
      <AlertTriangle size={16} strokeWidth={1.5} className={`shrink-0 mt-0.5 ${iconColor}`} />
      <div className="flex-1 min-w-0">
        <p className="text-[var(--font-size-sm)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)]">
          {alert.title}
        </p>
        <p className="text-[var(--font-size-xs)] text-[var(--color-text-secondary)] mt-0.5">
          {alert.description}
        </p>
      </div>
      <ArrowRight size={14} strokeWidth={1.5} className="shrink-0 text-[var(--color-text-muted)] mt-0.5" />
    </div>
  );
}
