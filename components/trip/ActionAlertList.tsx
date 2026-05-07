import { CheckCircle2 } from "lucide-react";
import { ActionAlertCard } from "./ActionAlertCard";
import type { ActionAlert } from "@/types/database";

interface ActionAlertListProps {
  alerts: ActionAlert[];
  tripId: string;
}

export function ActionAlertList({ alerts, tripId }: ActionAlertListProps) {
  const active = alerts.filter((a) => !a.is_resolved);

  if (active.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-success-bg)] border border-[var(--color-success)]/20 p-4">
        <CheckCircle2 size={18} strokeWidth={1.5} className="text-[var(--color-success)] shrink-0" />
        <div>
          <p className="text-[var(--font-size-sm)] font-[var(--font-weight-semibold)] text-[var(--color-success)]">
            No issues detected
          </p>
          <p className="text-[var(--font-size-xs)] text-[var(--color-text-secondary)] mt-0.5">
            Everything looks good with your trip.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {active.map((alert) => (
        <ActionAlertCard key={alert.id} alert={alert} tripId={tripId} />
      ))}
    </div>
  );
}
