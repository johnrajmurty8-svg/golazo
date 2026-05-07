"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils/cn";

interface EditableCellProps {
  value: string | null;
  onSave: (value: string) => Promise<void>;
  type?: "text" | "date" | "time";
  placeholder?: string;
  className?: string;
}

export function EditableCell({ value, onSave, type = "text", placeholder = "—", className }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function commit() {
    if (draft === (value ?? "")) { setEditing(false); return; }
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); commit(); }
    if (e.key === "Escape") { setDraft(value ?? ""); setEditing(false); }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        disabled={saving}
        className={cn(
          "w-full h-8 px-2 rounded-[var(--radius-sm)] border border-[var(--color-primary)] bg-white text-[var(--font-size-sm)] text-[var(--color-text-primary)] shadow-[var(--shadow-focus)] outline-none transition-all disabled:opacity-50",
          className
        )}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={cn(
        "w-full text-left px-2 py-1 rounded-[var(--radius-sm)] text-[var(--font-size-sm)] hover:bg-[var(--color-surface-secondary)] transition-colors focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
        value ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)] italic",
        className
      )}
      aria-label={`Edit: ${value ?? placeholder}`}
    >
      {value ?? placeholder}
    </button>
  );
}
