import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  heading: string;
  body?: string;
  cta?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, heading, body, cta, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-12 px-6", className)}>
      <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-[var(--color-surface-secondary)] flex items-center justify-center mb-4 text-[var(--color-text-muted)]">
        {icon}
      </div>
      <h3
        className="text-[var(--font-size-md)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)] mb-1"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {heading}
      </h3>
      {body && (
        <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)] max-w-xs mb-4">
          {body}
        </p>
      )}
      {cta && <div className="mt-2">{cta}</div>}
    </div>
  );
}
