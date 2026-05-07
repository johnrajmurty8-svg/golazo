import { AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  message = "Something went wrong. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-10 px-6", className)}>
      <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-[var(--color-danger-bg)] flex items-center justify-center mb-3">
        <AlertTriangle size={22} strokeWidth={1.5} className="text-[var(--color-danger)]" />
      </div>
      <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)] max-w-xs mb-3">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors"
        >
          <RefreshCw size={14} strokeWidth={2} />
          Try again
        </button>
      )}
    </div>
  );
}
