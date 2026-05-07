"use client";

import { AlertTriangle } from "lucide-react";
import { useState } from "react";

interface ConfidenceFlagProps {
  score?: number;
}

export function ConfidenceFlag({ score }: ConfidenceFlagProps) {
  const [visible, setVisible] = useState(false);

  if (!score || score >= 0.7) return null;

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        aria-label="Low confidence — please review this field"
        className="text-[var(--color-warning)] hover:text-[var(--color-warning)] focus-visible:outline-none ml-1"
      >
        <AlertTriangle size={14} strokeWidth={1.5} />
      </button>
      {visible && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded-[var(--radius-sm)] bg-[var(--color-text-primary)] px-2 py-1 text-[var(--font-size-xs)] text-white shadow-[var(--shadow-md)] z-50 pointer-events-none"
        >
          Claude is not confident about this field. Please review.
        </span>
      )}
    </span>
  );
}
