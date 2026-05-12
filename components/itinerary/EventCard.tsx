"use client";

import { useState } from "react";
import { Pencil, Trash2, Clock, Plane, Building2, Coffee, Link as LinkIcon, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ConfidenceFlag } from "@/components/ui/ConfidenceFlag";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { SourceDocumentLink } from "@/components/vault/SourceDocumentLink";
import { toast } from "@/lib/utils/toast";
import { EVENT_COLORS } from "./eventColors";
import { EventTagPills } from "./EventTagPills";
import { EventAttachments } from "./EventAttachments";
import type { ItineraryEvent } from "@/types/database";

interface EventCardProps {
  event: ItineraryEvent;
  isOrganiser: boolean;
  onEdit: (event: ItineraryEvent) => void;
  onDeleted: (id: string) => void;
  tripId: string;
  source: { docId: string; fileName: string } | null;
  /** When false, the card renders without drag affordances (e.g. for members or when DnD is disabled). */
  draggable?: boolean;
  selected?: boolean;
  onToggleSelected?: (id: string, next: boolean) => void;
}

const TYPE_ICONS: Record<ItineraryEvent["event_type"], React.ReactNode> = {
  flight: <Plane size={13} strokeWidth={1.5} />,
  accommodation: <Building2 size={13} strokeWidth={1.5} />,
  activity: <Coffee size={13} strokeWidth={1.5} />,
  transfer: <Plane size={13} strokeWidth={1.5} />,
  general: <Clock size={13} strokeWidth={1.5} />,
};

export function EventCard({
  event,
  isOrganiser,
  onEdit,
  onDeleted,
  tripId,
  source,
  draggable = true,
  selected = false,
  onToggleSelected,
}: EventCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const colour = EVENT_COLORS[event.event_type];

  const dndEnabled = isOrganiser && draggable;
  const sortable = useSortable({ id: event.id, disabled: !dndEnabled });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderLeft: `4px solid ${colour.border}`,
    backgroundColor: isDragging
      ? "var(--color-surface)"
      : selected
        ? "var(--color-primary-light)"
        : colour.tint,
    opacity: isDragging ? 0.6 : 1,
  };

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
      <div
        ref={setNodeRef}
        style={style}
        className="relative flex items-start gap-3 p-4 pl-3 rounded-[var(--radius-md)] border border-[var(--color-border)] hover:shadow-[var(--shadow-sm)] transition-shadow duration-120 group"
      >
        {/* Drag handle (organiser hover only) */}
        {dndEnabled && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="absolute -left-5 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            aria-label="Reorder event"
          >
            <GripVertical size={14} strokeWidth={1.5} />
          </button>
        )}

        {/* Bulk-select checkbox (organiser only) */}
        {isOrganiser && onToggleSelected && (
          <div
            className={
              "mt-1.5 transition-opacity " +
              (selected ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100")
            }
          >
            <Checkbox
              checked={selected}
              onChange={(next) => onToggleSelected(event.id, next)}
              ariaLabel={`Select event ${event.title}`}
            />
          </div>
        )}

        {/* Type icon */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: colour.badgeBg, color: colour.border }}
        >
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

          <EventTagPills
            eventType={event.event_type}
            location={event.location}
            travellers={event.travellers}
            tags={event.tags}
          />

          {event.description && (
            <p className="text-[var(--font-size-xs)] text-[var(--color-text-secondary)] mt-1.5 line-clamp-2">
              {event.description}
            </p>
          )}

          {(event.booking_url || source) && (
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {event.booking_url && (
                <a
                  href={event.booking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[var(--font-size-xs)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                >
                  <LinkIcon size={11} strokeWidth={1.5} />
                  Booking
                </a>
              )}
              {source && (
                <SourceDocumentLink
                  tripId={tripId}
                  docId={source.docId}
                  fileName={source.fileName}
                />
              )}
            </div>
          )}

          <EventAttachments tripId={tripId} eventId={event.id} isOrganiser={isOrganiser} />
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
