"use client";

import { CalendarDays, Plus, List, LayoutGrid, ChevronsUpDown, ChevronsDownUp } from "lucide-react";
import { SearchBar } from "@/components/ui/SearchBar";

export type ItineraryViewMode = "timeline" | "calendar";

interface ItineraryHeaderProps {
  tripName: string;
  isOrganiser: boolean;
  query: string;
  onQueryChange: (q: string) => void;
  view: ItineraryViewMode;
  onViewChange: (view: ItineraryViewMode) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onAddEvent: () => void;
}

export function ItineraryHeader({
  tripName,
  isOrganiser,
  query,
  onQueryChange,
  view,
  onViewChange,
  onExpandAll,
  onCollapseAll,
  onAddEvent,
}: ItineraryHeaderProps) {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-primary-light)] flex items-center justify-center">
            <CalendarDays size={20} strokeWidth={1.5} className="text-[var(--color-primary)]" />
          </div>
          <div>
            <h1
              className="text-[var(--font-size-xl)] font-[var(--font-weight-bold)] text-[var(--color-text-primary)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Itinerary
            </h1>
            <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">{tripName}</p>
          </div>
        </div>

        {isOrganiser && (
          <button
            type="button"
            onClick={onAddEvent}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white text-[var(--font-size-sm)] font-[var(--font-weight-medium)] hover:bg-[var(--color-primary-hover)] transition-colors shadow-[var(--shadow-sm)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
          >
            <Plus size={14} strokeWidth={2} />
            Add Event
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <SearchBar
          value={query}
          onChange={onQueryChange}
          placeholder="Search events, locations, tags…"
          ariaLabel="Search itinerary"
        />

        <div className="flex items-center gap-2">
          {view === "timeline" && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onExpandAll}
                className="inline-flex items-center gap-1 h-9 px-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--font-size-xs)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] transition-colors"
                aria-label="Expand all days"
                title="Expand all days"
              >
                <ChevronsUpDown size={13} strokeWidth={1.5} />
                <span className="hidden sm:inline">Expand all</span>
              </button>
              <button
                type="button"
                onClick={onCollapseAll}
                className="inline-flex items-center gap-1 h-9 px-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--font-size-xs)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] transition-colors"
                aria-label="Collapse all days"
                title="Collapse all days"
              >
                <ChevronsDownUp size={13} strokeWidth={1.5} />
                <span className="hidden sm:inline">Collapse all</span>
              </button>
            </div>
          )}

          <div
            role="tablist"
            aria-label="Itinerary view"
            className="inline-flex items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5"
          >
            <button
              type="button"
              role="tab"
              aria-selected={view === "timeline"}
              onClick={() => onViewChange("timeline")}
              className={
                "inline-flex items-center gap-1 h-8 px-2.5 rounded-[var(--radius-sm)] text-[var(--font-size-xs)] transition-colors " +
                (view === "timeline"
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]")
              }
            >
              <List size={13} strokeWidth={1.5} />
              Timeline
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "calendar"}
              onClick={() => onViewChange("calendar")}
              className={
                "inline-flex items-center gap-1 h-8 px-2.5 rounded-[var(--radius-sm)] text-[var(--font-size-xs)] transition-colors " +
                (view === "calendar"
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]")
              }
            >
              <LayoutGrid size={13} strokeWidth={1.5} />
              Calendar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
