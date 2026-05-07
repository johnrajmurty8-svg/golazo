"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function TripError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-[var(--radius-xl)] bg-[var(--color-danger-bg)] flex items-center justify-center mb-4">
        <AlertTriangle size={28} strokeWidth={1.5} className="text-[var(--color-danger)]" />
      </div>
      <h1
        className="text-[var(--font-size-xl)] font-[var(--font-weight-bold)] text-[var(--color-text-primary)] mb-2"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Something went wrong
      </h1>
      <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)] mb-6 max-w-xs">
        We hit an unexpected error loading this page. This has been logged.
      </p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white text-[var(--font-size-sm)] font-[var(--font-weight-medium)] hover:bg-[var(--color-primary-hover)] transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
