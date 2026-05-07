import { Sparkles } from "lucide-react";

interface ParseProgressOverlayProps {
  visible: boolean;
}

export function ParseProgressOverlay({ visible }: ParseProgressOverlayProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)]/80 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label="Parsing documents"
    >
      <div className="flex flex-col items-center gap-5 p-8 rounded-[var(--radius-xl)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)] max-w-xs text-center">
        <div className="w-14 h-14 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center">
          <Sparkles size={24} strokeWidth={1.5} className="text-[var(--color-primary)] animate-pulse" />
        </div>
        <div>
          <p
            className="text-[var(--font-size-md)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Claude is reading your documents…
          </p>
          <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)] mt-1">
            Extracting flights, accommodation and itinerary events.
          </p>
        </div>
        <div className="w-full h-1.5 rounded-full bg-[var(--color-surface-secondary)] overflow-hidden">
          <div className="h-full bg-[var(--color-primary)] rounded-full animate-[progress-indeterminate_1.4s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}
