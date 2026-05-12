"use client";

import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  /** Sidebar variant uses dark surface; default uses light surface. */
  variant?: "default" | "sidebar";
  ariaLabel?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search…",
  onSubmit,
  variant = "default",
  ariaLabel,
}: SearchBarProps) {
  const isSidebar = variant === "sidebar";

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className={
        isSidebar
          ? "relative flex items-center"
          : "relative flex items-center w-full max-w-sm"
      }
    >
      <Search
        size={14}
        strokeWidth={1.5}
        className={
          isSidebar
            ? "absolute left-2.5 text-[#6B6560] pointer-events-none"
            : "absolute left-3 text-[var(--color-text-muted)] pointer-events-none"
        }
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className={
          isSidebar
            ? "w-full h-8 pl-7 pr-7 rounded-[var(--radius-md)] bg-[#2C2724] text-[var(--color-sidebar-text)] text-[var(--font-size-xs)] placeholder:text-[#6B6560] border border-transparent focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            : "w-full h-9 pl-9 pr-8 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-text-primary)] text-[var(--font-size-sm)] placeholder:text-[var(--color-text-muted)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[var(--shadow-focus)] transition-all"
        }
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className={
            isSidebar
              ? "absolute right-2 text-[#6B6560] hover:text-white transition-colors"
              : "absolute right-2.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          }
        >
          <X size={13} strokeWidth={1.5} />
        </button>
      )}
    </form>
  );
}
