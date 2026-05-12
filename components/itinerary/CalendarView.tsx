"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EVENT_COLORS } from "./eventColors";
import type { ItineraryDay, ItineraryEvent } from "@/types/database";

interface CalendarViewProps {
  days: ItineraryDay[];
  events: ItineraryEvent[];
  /** Switch back to timeline and scroll to the given day. */
  onJumpToDay: (dayId: string) => void;
  tripStart: string;
  tripEnd: string;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function ymd(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseYMD(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

/** Returns the Monday on or before this date. */
function gridStart(monthStart: Date): Date {
  const d = new Date(monthStart);
  // getDay: 0 = Sun, 1 = Mon, ... 6 = Sat. Shift so Monday = 0.
  const dayIdx = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dayIdx);
  return d;
}

export function CalendarView({ days, events, onJumpToDay, tripStart, tripEnd }: CalendarViewProps) {
  const tripStartDate = parseYMD(tripStart);
  const tripEndDate = parseYMD(tripEnd);
  const [cursor, setCursor] = useState(startOfMonth(tripStartDate));

  const dayByDate = new Map(days.map((d) => [d.date, d]));
  const eventsByDate = new Map<string, ItineraryEvent[]>();
  for (const ev of events) {
    const day = days.find((d) => d.id === ev.day_id);
    if (!day) continue;
    const list = eventsByDate.get(day.date) ?? [];
    list.push(ev);
    eventsByDate.set(day.date, list);
  }

  // Build 6-week grid (42 cells)
  const start = gridStart(cursor);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const c = new Date(start);
    c.setDate(start.getDate() + i);
    cells.push(c);
  }

  const monthLabel = cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const cursorMonth = cursor.getMonth();

  const canGoPrev = addMonths(cursor, -1).getTime() >= startOfMonth(tripStartDate).getTime();
  const canGoNext = addMonths(cursor, 1).getTime() <= startOfMonth(tripEndDate).getTime();

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <h3
          className="text-[var(--font-size-md)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {monthLabel}
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => canGoPrev && setCursor(addMonths(cursor, -1))}
            disabled={!canGoPrev}
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => canGoNext && setCursor(addMonths(cursor, 1))}
            disabled={!canGoNext}
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="px-2 py-1.5 text-[var(--font-size-xs)] font-[var(--font-weight-semibold)] text-[var(--color-text-secondary)] text-center uppercase tracking-wide"
          >
            {w}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells.map((d) => {
          const key = ymd(d);
          const inMonth = d.getMonth() === cursorMonth;
          const inTrip = d >= tripStartDate && d <= tripEndDate;
          const dayEvents = eventsByDate.get(key) ?? [];
          const day = dayByDate.get(key);
          const visible = dayEvents.slice(0, 3);
          const overflow = dayEvents.length - visible.length;

          return (
            <div
              key={key}
              className={
                "min-h-[88px] border-b border-r border-[var(--color-border)] last:border-r-0 p-1.5 flex flex-col gap-1 " +
                (inMonth ? "bg-[var(--color-surface)]" : "bg-[var(--color-bg)]") +
                (inTrip ? "" : " opacity-50")
              }
            >
              <span
                className={
                  "text-[var(--font-size-xs)] " +
                  (inMonth ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-muted)]") +
                  " font-[var(--font-weight-medium)]"
                }
              >
                {d.getDate()}
              </span>
              {visible.map((ev) => {
                const colour = EVENT_COLORS[ev.event_type];
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => day && onJumpToDay(day.id)}
                    className="text-left text-[11px] leading-tight px-1.5 py-0.5 rounded-[var(--radius-sm)] truncate hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: colour.badgeBg, color: colour.border, borderLeft: `3px solid ${colour.border}` }}
                    title={`${ev.time ? ev.time + " · " : ""}${ev.title}`}
                  >
                    {ev.time && <span className="font-[var(--font-weight-medium)] mr-1">{ev.time}</span>}
                    {ev.title}
                  </button>
                );
              })}
              {overflow > 0 && day && (
                <button
                  type="button"
                  onClick={() => onJumpToDay(day.id)}
                  className="text-left text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                >
                  +{overflow} more
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
