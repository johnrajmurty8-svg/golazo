import { cn } from "@/lib/utils/cn";

type ParseStatus = "unparsed" | "parsing" | "parsed" | "failed";

interface ParseStatusBadgeProps {
  status: ParseStatus;
}

const CONFIG: Record<ParseStatus, { label: string; className: string }> = {
  unparsed: {
    label: "Unparsed",
    className: "bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]",
  },
  parsing: {
    label: "Parsing…",
    className: "bg-[var(--color-warning-bg)] text-[var(--color-warning)] animate-pulse",
  },
  parsed: {
    label: "Parsed",
    className: "bg-[var(--color-success-bg)] text-[var(--color-success)]",
  },
  failed: {
    label: "Failed",
    className: "bg-[var(--color-danger-bg)] text-[var(--color-danger)]",
  },
};

export function ParseStatusBadge({ status }: ParseStatusBadgeProps) {
  const { label, className } = CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[var(--font-size-xs)] font-[var(--font-weight-medium)]",
        className
      )}
    >
      {label}
    </span>
  );
}
