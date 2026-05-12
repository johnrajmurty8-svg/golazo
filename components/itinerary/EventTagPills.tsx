import { MapPin, Users } from "lucide-react";
import { EVENT_COLORS, type EventType } from "./eventColors";

interface EventTagPillsProps {
  eventType: EventType;
  location: string | null;
  travellers: string[] | null;
  tags: string[] | null;
}

const PILL_BASE =
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] leading-none font-[var(--font-weight-medium)]";

export function EventTagPills({ eventType, location, travellers, tags }: EventTagPillsProps) {
  const colour = EVENT_COLORS[eventType];

  if (!location && (!travellers || travellers.length === 0) && (!tags || tags.length === 0)) {
    // Always show the category badge even if no other tags.
    return (
      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
        <CategoryBadge colour={colour} />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
      <CategoryBadge colour={colour} />

      {location && (
        <span
          className={`${PILL_BASE} bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]`}
        >
          <MapPin size={11} strokeWidth={1.5} />
          <span className="max-w-[160px] truncate">{location}</span>
        </span>
      )}

      {travellers?.map((name) => (
        <span
          key={`traveller-${name}`}
          className={`${PILL_BASE} bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]`}
        >
          <Users size={11} strokeWidth={1.5} />
          {name}
        </span>
      ))}

      {tags?.map((tag) => (
        <span
          key={`tag-${tag}`}
          className={`${PILL_BASE} bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]`}
        >
          #{tag}
        </span>
      ))}
    </div>
  );
}

function CategoryBadge({ colour }: { colour: (typeof EVENT_COLORS)[EventType] }) {
  return (
    <span
      className={`${PILL_BASE}`}
      style={{ backgroundColor: colour.badgeBg, color: colour.border }}
    >
      {colour.label}
    </span>
  );
}
