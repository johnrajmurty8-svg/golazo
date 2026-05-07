import { CalendarDays, MapPin, Users } from "lucide-react";

interface TripStatsProps {
  nightsCount: number;
  memberCount: number;
  destinations?: string | null;
}

function StatPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface-secondary)] px-3 py-2">
      <span className="text-[var(--color-text-muted)]">{icon}</span>
      <div>
        <p className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] leading-none mb-0.5">
          {label}
        </p>
        <p className="text-[var(--font-size-sm)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)] leading-none">
          {value}
        </p>
      </div>
    </div>
  );
}

export function TripStats({ nightsCount, memberCount, destinations }: TripStatsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {destinations && (
        <StatPill
          icon={<MapPin size={14} strokeWidth={1.5} />}
          label="Destination"
          value={destinations}
        />
      )}
      <StatPill
        icon={<CalendarDays size={14} strokeWidth={1.5} />}
        label="Nights"
        value={nightsCount}
      />
      <StatPill
        icon={<Users size={14} strokeWidth={1.5} />}
        label="Travellers"
        value={memberCount}
      />
    </div>
  );
}
