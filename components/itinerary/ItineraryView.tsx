"use client";

import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { ItineraryHeader, type ItineraryViewMode } from "./ItineraryHeader";
import { DaySection } from "./DaySection";
import { CalendarView } from "./CalendarView";
import { AddEventModal } from "./AddEventModal";
import { BulkActionBar } from "@/components/ui/BulkActionBar";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/utils/toast";
import type { ItineraryDay, ItineraryEvent } from "@/types/database";

interface TripMember {
  user_id: string;
  display_name: string;
}

interface ItineraryViewProps {
  tripId: string;
  tripName: string;
  tripStart: string;
  tripEnd: string;
  isOrganiser: boolean;
  initialDays: ItineraryDay[];
  initialEvents: ItineraryEvent[];
  eventSourceById: Record<string, { docId: string; fileName: string }>;
  tripMembers: TripMember[];
}

function matchesQuery(event: ItineraryEvent, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  if (event.title.toLowerCase().includes(needle)) return true;
  if (event.location?.toLowerCase().includes(needle)) return true;
  if (event.description?.toLowerCase().includes(needle)) return true;
  if (event.tags?.some((t) => t.toLowerCase().includes(needle))) return true;
  if (event.travellers?.some((t) => t.toLowerCase().includes(needle))) return true;
  return false;
}

export function ItineraryView({
  tripId,
  tripName,
  tripStart,
  tripEnd,
  isOrganiser,
  initialDays,
  initialEvents,
  eventSourceById,
  tripMembers,
}: ItineraryViewProps) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const [days, setDays] = useState<ItineraryDay[]>(initialDays);
  const [events, setEvents] = useState<ItineraryEvent[]>(initialEvents);
  const [query, setQuery] = useState(initialQuery);
  const [view, setView] = useState<ItineraryViewMode>("timeline");
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    // Empty days default collapsed; days with events default expanded.
    const init = new Set<string>();
    for (const d of initialDays) {
      const has = initialEvents.some((e) => e.day_id === d.id);
      if (!has) init.add(d.id);
    }
    return init;
  });
  const [addOpen, setAddOpen] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const filteredEventsByDay = useMemo(() => {
    const map: Record<string, ItineraryEvent[]> = {};
    for (const ev of events) {
      if (!matchesQuery(ev, query)) continue;
      (map[ev.day_id] ??= []).push(ev);
    }
    return map;
  }, [events, query]);

  // When filtering, hide days that have no matches (unless no query, then show all).
  const visibleDays = useMemo(() => {
    if (!query) return days;
    return days.filter((d) => (filteredEventsByDay[d.id]?.length ?? 0) > 0);
  }, [days, filteredEventsByDay, query]);

  function toggleCollapsed(dayId: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(dayId)) next.delete(dayId);
      else next.add(dayId);
      return next;
    });
  }

  function expandAll() {
    setCollapsed(new Set());
  }

  function collapseAll() {
    setCollapsed(new Set(days.map((d) => d.id)));
  }

  function handleEventChanged(saved: ItineraryEvent) {
    // Make sure the day exists locally (the API may have auto-created a new day_id).
    setEvents((prev) => {
      const idx = prev.findIndex((e) => e.id === saved.id);
      if (idx >= 0) {
        const next = prev.slice();
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });

    setDays((prev) => {
      if (prev.some((d) => d.id === saved.day_id)) return prev;
      // Synthesise a day stub so the new day renders. We don't have its `date` from the
      // event payload, but the modal flow seeds it via handleEventCreated below.
      return prev;
    });
  }

  function handleEventCreated(saved: ItineraryEvent, dateUsed: string) {
    setEvents((prev) => [...prev, saved]);
    setDays((prev) => {
      if (prev.some((d) => d.id === saved.day_id)) return prev;
      const synthesised: ItineraryDay = {
        id: saved.day_id,
        trip_id: tripId,
        date: dateUsed,
        title: null,
        created_at: new Date().toISOString(),
      };
      return [...prev, synthesised].sort((a, b) => a.date.localeCompare(b.date));
    });
    // Ensure the new day is expanded so the event is visible.
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.delete(saved.day_id);
      return next;
    });
  }

  function handleEventDeleted(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setSelectedEventIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function toggleEventSelected(id: string, next: boolean) {
    setSelectedEventIds((prev) => {
      const out = new Set(prev);
      if (next) out.add(id);
      else out.delete(id);
      return out;
    });
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedEventIds);
    if (ids.length === 0) return;
    setBulkDeleting(true);

    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/trips/${tripId}/itinerary/events/${id}`, { method: "DELETE" }).then((res) => {
          if (!res.ok) throw new Error(`Failed: ${id}`);
          return id;
        })
      )
    );

    const succeeded = results
      .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
      .map((r) => r.value);
    const failedCount = results.length - succeeded.length;

    if (succeeded.length > 0) {
      setEvents((prev) => prev.filter((e) => !succeeded.includes(e.id)));
    }
    setSelectedEventIds(new Set());
    setBulkDeleting(false);
    setConfirmBulkOpen(false);

    if (failedCount === 0) {
      toast.success(`Deleted ${succeeded.length} event${succeeded.length === 1 ? "" : "s"}.`);
    } else if (succeeded.length === 0) {
      toast.error("Could not delete events. Please try again.");
    } else {
      toast.warning(`Deleted ${succeeded.length}; ${failedCount} failed. Reloading…`);
      window.location.reload();
    }
  }

  function jumpToDay(dayId: string) {
    setView("timeline");
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.delete(dayId);
      return next;
    });
    // Scroll on the next frame after the timeline mounts.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        dayRefs.current[dayId]?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  // Default date for the AddEventModal: today if within trip range, else tripStart.
  const today = new Date().toISOString().slice(0, 10);
  const defaultDate =
    today >= tripStart && today <= tripEnd ? today : tripStart;

  const noContent = days.length === 0;

  return (
    <>
      <ItineraryHeader
        tripName={tripName}
        isOrganiser={isOrganiser}
        query={query}
        onQueryChange={setQuery}
        view={view}
        onViewChange={setView}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
        onAddEvent={() => setAddOpen(true)}
      />

      {isOrganiser && (
        <BulkActionBar
          count={selectedEventIds.size}
          itemNoun="event"
          onDelete={() => setConfirmBulkOpen(true)}
          onClear={() => setSelectedEventIds(new Set())}
          deleting={bulkDeleting}
        />
      )}

      {noContent ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-[var(--color-surface-secondary)] flex items-center justify-center mb-4">
            <CalendarDays size={24} strokeWidth={1.5} className="text-[var(--color-text-muted)]" />
          </div>
          <p className="text-[var(--font-size-md)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)]">
            No itinerary yet
          </p>
          <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)] mt-1 max-w-xs">
            {isOrganiser
              ? "Add your first event, or parse your booking documents to build it automatically."
              : "Parse your booking documents to automatically build your itinerary."}
          </p>
        </div>
      ) : view === "calendar" ? (
        <CalendarView
          days={days}
          events={events}
          onJumpToDay={jumpToDay}
          tripStart={tripStart}
          tripEnd={tripEnd}
        />
      ) : (
        <div className="space-y-0">
          {visibleDays.length === 0 ? (
            <p className="text-[var(--font-size-sm)] text-[var(--color-text-muted)] py-6">
              No events match “{query}”.
            </p>
          ) : (
            visibleDays.map((day) => (
              <div
                key={day.id}
                ref={(el) => {
                  dayRefs.current[day.id] = el;
                }}
              >
                <DaySection
                  day={day}
                  events={filteredEventsByDay[day.id] ?? []}
                  isOrganiser={isOrganiser}
                  tripId={tripId}
                  eventSourceById={eventSourceById}
                  tripMembers={tripMembers}
                  collapsed={collapsed.has(day.id)}
                  onToggleCollapsed={() => toggleCollapsed(day.id)}
                  onEventChanged={handleEventChanged}
                  onEventDeleted={handleEventDeleted}
                  selectedIds={selectedEventIds}
                  onToggleSelected={toggleEventSelected}
                />
              </div>
            ))
          )}
        </div>
      )}

      <AddEventModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        tripId={tripId}
        defaultDate={defaultDate}
        tripMembers={tripMembers}
        onCreated={(ev, dateUsed) => handleEventCreated(ev, dateUsed)}
      />

      <Modal
        open={confirmBulkOpen}
        onClose={() => !bulkDeleting && setConfirmBulkOpen(false)}
        title={`Delete ${selectedEventIds.size} event${selectedEventIds.size === 1 ? "" : "s"}?`}
      >
        <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)] mb-6">
          This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="danger" size="md" loading={bulkDeleting} onClick={handleBulkDelete} className="flex-1">
            Delete {selectedEventIds.size}
          </Button>
          <Button variant="secondary" size="md" onClick={() => setConfirmBulkOpen(false)} disabled={bulkDeleting}>
            Cancel
          </Button>
        </div>
      </Modal>
    </>
  );
}
