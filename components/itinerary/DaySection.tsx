"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { EventCard } from "./EventCard";
import { EventForm } from "./EventForm";
import type { ItineraryDay, ItineraryEvent } from "@/types/database";

interface DaySectionProps {
  day: ItineraryDay;
  events: ItineraryEvent[];
  isOrganiser: boolean;
  tripId: string;
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

export function DaySection({ day, events: initialEvents, isOrganiser, tripId }: DaySectionProps) {
  const [events, setEvents] = useState(initialEvents);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ItineraryEvent | null>(null);

  const { dayNum, month, weekday } = formatDayHeader(day.date);

  function handleSaved(saved: ItineraryEvent) {
    if (editingEvent) {
      setEvents((prev) => prev.map((e) => (e.id === saved.id ? saved : e)));
      setEditingEvent(null);
    } else {
      setEvents((prev) => [...prev, saved]);
      setShowForm(false);
    }
  }

  function handleDeleted(id: string) {
    setEvents((prev) => prev.filter((e) => e.id !== id));
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
          {day.title && (
            <p className="text-[var(--font-size-xs)] font-[var(--font-weight-semibold)] text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">
              {day.title}
            </p>
          )}

          {events.length === 0 && !showForm && (
            <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] px-4 py-3 text-[var(--font-size-xs)] text-[var(--color-text-muted)]">
              {isOrganiser ? "No events yet — add one below." : "No events scheduled."}
            </div>
          )}

          {events
            .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""))
            .map((event) =>
              editingEvent?.id === event.id ? (
                <EventForm
                  key={event.id}
                  tripId={tripId}
                  dayId={day.id}
                  editingEvent={event}
                  onSaved={handleSaved}
                  onCancel={() => setEditingEvent(null)}
                />
              ) : (
                <EventCard
                  key={event.id}
                  event={event}
                  isOrganiser={isOrganiser}
                  onEdit={(e) => setEditingEvent(e)}
                  onDeleted={handleDeleted}
                  tripId={tripId}
                />
              )
            )}

          {showForm && !editingEvent && (
            <EventForm
              tripId={tripId}
              dayId={day.id}
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
        </div>
      </div>
    </div>
  );
}
