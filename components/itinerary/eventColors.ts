import type { ItineraryEvent } from "@/types/database";

export type EventType = ItineraryEvent["event_type"];

export interface EventColor {
  /** Solid colour for left border + badge text + chips. */
  border: string;
  /** ~5% opacity background tint for the card. */
  tint: string;
  /** Soft background for the category badge pill. */
  badgeBg: string;
  /** Display label for the badge. */
  label: string;
}

export const EVENT_COLORS: Record<EventType, EventColor> = {
  flight:        { border: "#4F46E5", tint: "rgba(79, 70, 229, 0.05)",  badgeBg: "rgba(79, 70, 229, 0.10)",  label: "Flight" },
  accommodation: { border: "#10B981", tint: "rgba(16, 185, 129, 0.05)", badgeBg: "rgba(16, 185, 129, 0.10)", label: "Stay" },
  activity:      { border: "#F59E0B", tint: "rgba(245, 158, 11, 0.05)", badgeBg: "rgba(245, 158, 11, 0.12)", label: "Activity" },
  transfer:      { border: "#0EA5E9", tint: "rgba(14, 165, 233, 0.05)", badgeBg: "rgba(14, 165, 233, 0.10)", label: "Transfer" },
  general:       { border: "#64748B", tint: "rgba(100, 116, 139, 0.04)", badgeBg: "rgba(100, 116, 139, 0.10)", label: "General" },
};
