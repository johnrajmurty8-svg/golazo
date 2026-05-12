"use client";

import { useState } from "react";
import { Plus, ChevronRight } from "lucide-react";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import { EventCard } from "./EventCard";
import { EventForm } from "./EventForm";
import { toast } from "@/lib/utils/toast";
import type { ItineraryDay, ItineraryEvent } from "@/types/database";

interface TripMember {
  user_id: string;
  display_name: string;
}

interface DaySectionProps {
  day: ItineraryDay;
  events: ItineraryEvent[];
  isOrganiser: boolean;
  tripId: string;
  eventSourceById: Record<string, { docId: string; fileName: string }>;
  tripMembers: TripMember[];
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /** Inject a freshly-created or updated event back into the parent list. */
  onEventChanged: (event: ItineraryEvent) => void;
  onEventDeleted: (id: string) => void;
  selectedIds?: Set<string>;
  onToggleSelected?: (id: string, next: boolean) => void;
}

function formatDayHeader(date: string) {
  const d = new Date(date);
  return {
    dayNum: d.toLocaleDateString("en-GB", { day: "numeric" }),
    month: d.toLocaleDateString("en-GB", { month: "long" }),
    weekday: d.toLocaleDateString("en-GB", { weekday: "long" }),
    year: d.toLocaleDateString("en-GB", { year: "numeric" }),
  };
}

export function DaySection({
  day,
  events,
  isOrganiser,
  tripId,
  eventSourceById,
  tripMembers,
  collapsed,
  onToggleCollapsed,
  onEventChanged,
  onEventDeleted,
  selectedIds,
  onToggleSelected,
}: DaySectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ItineraryEvent | null>(null);
  // Local view of events for instant drag feedback before server confirmation.
  const [localOrder, setLocalOrder] = useState<string[] | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const sortedEvents = sortEvents(events, localOrder);
  const { dayNum, month, weekday } = formatDayHeader(day.date);

  function handleSaved(saved: ItineraryEvent) {
    if (editingEvent) {
      setEditingEvent(null);
    } else {
      setShowForm(false);
    }
    onEventChanged(saved);
  }

  async function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const currentIds = sortedEvents.map((ev) => ev.id);
    const oldIndex = currentIds.indexOf(String(active.id));
    const newIndex = currentIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const nextOrder = arrayMove(currentIds, oldIndex, newIndex);
    setLocalOrder(nextOrder);

    const res = await fetch(`/api/trips/${tripId}/itinerary/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayId: day.id, orderedEventIds: nextOrder }),
    });

    if (!res.ok) {
      setLocalOrder(null);
      toast.error("Could not save order. Please try again.");
      return;
    }

    // Propagate new sort_order values to the parent so they survive collapse/expand.
    nextOrder.forEach((id, i) => {
      const ev = events.find((e) => e.id === id);
      if (ev) onEventChanged({ ...ev, sort_order: i });
    });
  }

  return (
    <div className="flex gap-5">
      {/* Date column */}
      <div className="w-16 shrink-0 text-right pt-1">
        <p
          className="text-[var(--font-size-2xl)] font-[var(--font-weight-bold)] text-[var(--color-primary)] leading-none"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {dayNum}
        </p>
        <p className="text-[var(--font-size-xs)] text-[var(--color-text-secondary)] mt-0.5">{month}</p>
        <p className="text-[var(--font-size-xs)] text-[var(--color-text-muted)]">{weekday}</p>
      </div>

      {/* Connector line + events */}
      <div className="flex gap-4 flex-1 min-w-0">
        {/* Vertical line */}
        <div className="flex flex-col items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] mt-1.5 shrink-0 shadow-sm" />
          <div className="w-px flex-1 bg-[var(--color-border)] mt-1" />
        </div>

        {/* Event list */}
        <div className="flex-1 min-w-0 pb-6 space-y-2">
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="flex items-center gap-1.5 text-[var(--font-size-xs)] font-[var(--font-weight-semibold)] text-[var(--color-text-secondary)] uppercase tracking-wide hover:text-[var(--color-text-primary)] transition-colors -ml-1 px-1 py-0.5 rounded-[var(--radius-sm)]"
            aria-expanded={!collapsed}
            aria-label={`${collapsed ? "Expand" : "Collapse"} events for ${dayNum} ${month}`}
          >
            <ChevronRight
              size={12}
              strokeWidth={2}
              className={collapsed ? "transition-transform" : "rotate-90 transition-transform"}
            />
            {day.title ? day.title : `${events.length} ${events.length === 1 ? "event" : "events"}`}
          </button>

          {!collapsed && (
            <>
              {events.length === 0 && !showForm && (
                <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] px-4 py-3 text-[var(--font-size-xs)] text-[var(--color-text-muted)]">
                  {isOrganiser ? "No events yet — add one below." : "No events scheduled."}
                </div>
              )}

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={sortedEvents.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                  {sortedEvents.map((event) =>
                    editingEvent?.id === event.id ? (
                      <EventForm
                        key={event.id}
                        tripId={tripId}
                        date={day.date}
                        editingEvent={event}
                        tripMembers={tripMembers}
                        onSaved={handleSaved}
                        onCancel={() => setEditingEvent(null)}
                      />
                    ) : (
                      <EventCard
                        key={event.id}
                        event={event}
                        isOrganiser={isOrganiser}
                        onEdit={(e) => setEditingEvent(e)}
                        onDeleted={onEventDeleted}
                        tripId={tripId}
                        source={eventSourceById[event.id] ?? null}
                        selected={selectedIds?.has(event.id) ?? false}
                        onToggleSelected={onToggleSelected}
                      />
                    )
                  )}
                </SortableContext>
              </DndContext>

              {showForm && !editingEvent && (
                <EventForm
                  tripId={tripId}
                  date={day.date}
                  tripMembers={tripMembers}
                  onSaved={handleSaved}
                  onCancel={() => setShowForm(false)}
                />
              )}

              {isOrganiser && !showForm && !editingEvent && (
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-1.5 text-[var(--font-size-xs)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors mt-1"
                >
                  <Plus size={13} strokeWidth={2} />
                  Add event
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function sortEvents(events: ItineraryEvent[], localOrder: string[] | null): ItineraryEvent[] {
  if (localOrder) {
    const byId = new Map(events.map((e) => [e.id, e]));
    const inOrder = localOrder.map((id) => byId.get(id)).filter((e): e is ItineraryEvent => !!e);
    const missing = events.filter((e) => !localOrder.includes(e.id));
    return [...inOrder, ...missing];
  }
  return [...events].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return (a.time ?? "").localeCompare(b.time ?? "");
  });
}
