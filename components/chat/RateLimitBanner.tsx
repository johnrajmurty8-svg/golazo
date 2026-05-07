import { AlertTriangle } from "lucide-react";

export function RateLimitBanner() {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-warning-bg)] border border-[var(--color-warning)]/30 px-4 py-3 mx-4 mb-3">
      <AlertTriangle size={15} strokeWidth={1.5} className="text-[var(--color-warning)] shrink-0" />
      <p className="text-[var(--font-size-xs)] text-[var(--color-text-secondary)]">
        You&apos;ve reached the daily chat limit. Resets at midnight UTC.
      </p>
    </div>
  );
}
