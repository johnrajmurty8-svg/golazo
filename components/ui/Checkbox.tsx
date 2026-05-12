"use client";

import { Check, Minus } from "lucide-react";

interface CheckboxProps {
  checked: boolean;
  /** When true, renders a "−" minus mark — used by select-all when only some rows are selected. */
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
  /** Stop propagation so a click on the checkbox doesn't trigger row-level navigation. */
  stopPropagation?: boolean;
  className?: string;
}

export function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  ariaLabel,
  stopPropagation = true,
  className,
}: CheckboxProps) {
  const filled = checked || indeterminate;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={ariaLabel}
      onClick={(e) => {
        if (stopPropagation) {
          e.stopPropagation();
          e.preventDefault();
        }
        onChange(!checked);
      }}
      className={
        "w-4 h-4 rounded-[var(--radius-sm)] border flex items-center justify-center shrink-0 transition-colors focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] " +
        (filled
          ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
          : "bg-[var(--color-surface)] border-[var(--color-border-strong)] hover:border-[var(--color-primary)]") +
        (className ? ` ${className}` : "")
      }
    >
      {indeterminate ? (
        <Minus size={11} strokeWidth={3} />
      ) : checked ? (
        <Check size={11} strokeWidth={3} />
      ) : null}
    </button>
  );
}
