"use client";

import { useState } from "react";
import { Pencil, Trash2, Clock, MapPin, Plane, Building2, Coffee } from "lucide-react";
import { ConfidenceFlag } from "@/components/ui/ConfidenceFlag";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/utils/toast";
import type { ItineraryEvent } from "@/types/database";

interface EventCardProps {
  event: ItineraryEvent;
  isOrganiser: boolean;
  onEdit: (event: ItineraryEvent) => void;
  onDeleted: (id: string) => void;
  tripId: string;
}

const TYPE_ICONS: Record<ItineraryEvent["event_type"], React.ReactNode> = {
  flight: <Plane size={13} strokeWidth={1.5} />,
  accommodation: <Building2 size={13} strokeWidth={1.5} />,
  activity: <Coffee size={13} strokeWidth={1.5} />,
  transfer: <Plane size={13} strokeWidth={1.5} />,
  general: <Clock size={13} strokeWidth={1.5} />,
};

export function EventCard({ event, isOrganiser, onEdit, onDeleted, tripId }: EventCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/trips/${tripId}/itinerary/events/${event.id}`, { method: "DELETE" });
    setDeleting(false);
    setConfirmOpen(false);
    if (res.ok) {
      toast.success("Event deleted.");
      onDeleted(event.id);
    } else {
      toast.error("Could not delete event. Please try again.");
    }
  }

  return (
    <>
      <div className="flex items-start gap-3 p-4 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] hover:shadow-[var(--shadow-sm)] transition-all duration-120 group">
        {/* Type icon */}
        <div className="w-7 h-7 rounded-full bg-[var(--color-surface-secondary)] flex items-center justify-center shrink-0 mt-0.5 text-[var(--color-text-muted)]">
          {TYPE_ICONS[event.event_type]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            {event.time && (
              <span className="flex items-center gap-1 text-[var(--font-size-xs)] text-[var(--color-text-muted)] font-[var(--font-weight-medium)] shrink-0">
                <Clock size={11} strokeWidth={1.5} />
                {event.time}
              </span>
            )}
            <p className="text-[var(--font-size-sm)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)] flex items-center gap-1">
              {event.title}
              <ConfidenceFlag score={event.confidence_score} />
            </p>
          </div>

          {event.location && (
            <p className="flex items-center gap-1 text-[var(--font-size-xs)] text-[var(--color-text-secondary)] mt-1">
              <MapPin size={11} strokeWidth={1.5} />
              {event.location}
            </p>
          )}

          {event.description && (
            <p className="text-[var(--font-size-xs)] text-[var(--color-text-secondary)] mt-1 line-clamp-2">
              {event.description}
            </p>
          )}
        </div>

        {/* Actions (organiser only, show on hover) */}
        {isOrganiser && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              type="button"
              onClick={() => onEdit(event)}
              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-secondary)] transition-all focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
              aria-label="Edit event"
            >
              <Pencil size={13} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] transition-all focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
              aria-label="Delete event"
            >
              <Trash2 size={13} strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Delete event">
        <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)] mb-6">
          Are you sure you want to delete <strong className="text-[var(--color-text-primary)]">{event.title}</strong>?
        </p>
        <div className="flex gap-3">
          <Button variant="danger" size="md" loading={deleting} onClick={handleDelete} className="flex-1">
            Delete
          </Button>
          <Button variant="secondary" size="md" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </>
  );
}
