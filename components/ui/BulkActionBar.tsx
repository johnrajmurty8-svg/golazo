"use client";

import { Trash2, X, Loader2 } from "lucide-react";

interface BulkActionBarProps {
  count: number;
  /** Singular/plural noun for the toast count (e.g. "document", "event"). */
  itemNoun: string;
  onDelete: () => void;
  onClear: () => void;
  deleting?: boolean;
  /** Optional left-side label override (defaults to "{count} {itemNoun}{s?} selected"). */
  label?: string;
}

export function BulkActionBar({
  count,
  itemNoun,
  onDelete,
  onClear,
  deleting = false,
  label,
}: BulkActionBarProps) {
  if (count === 0) return null;

  const displayLabel =
    label ?? `${count} ${itemNoun}${count === 1 ? "" : "s"} selected`;

  return (
    <div
      role="region"
      aria-label="Bulk actions"
      className="sticky top-0 z-10 mb-3 flex items-center justify-between gap-3 px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-primary)]/30 bg-[var(--color-primary-light)] shadow-[var(--shadow-sm)] animate-[modal-in_120ms_ease-out]"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text-primary)]">
          {displayLabel}
        </span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[var(--radius-md)] bg-[var(--color-danger)] text-white text-[var(--font-size-xs)] font-[var(--font-weight-medium)] hover:bg-[var(--color-danger)]/90 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
        >
          {deleting ? (
            <Loader2 size={12} strokeWidth={2} className="animate-spin" />
          ) : (
            <Trash2 size={12} strokeWidth={1.75} />
          )}
          {deleting ? "Deleting…" : `Delete ${count}`}
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={deleting}
          className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] text-[var(--font-size-xs)] disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
          aria-label="Clear selection"
        >
          <X size={12} strokeWidth={1.75} />
          Clear
        </button>
      </div>
    </div>
  );
}
