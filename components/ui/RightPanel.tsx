"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface RightPanelProps {
  title?: string;
  children: React.ReactNode;
  open?: boolean;
  onClose?: () => void;
  className?: string;
}

export function RightPanel({ title, children, open = true, onClose, className }: RightPanelProps) {
  return (
    <>
      {/* Desktop: always shown in xl+ layout */}
      <aside
        className={cn(
          "hidden xl:flex flex-col w-[280px] shrink-0 border-l border-[var(--color-border)] bg-[var(--color-surface)] h-full overflow-y-auto",
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
            <h3
              className="text-[var(--font-size-sm)] font-[var(--font-weight-semibold)] text-[var(--color-text-secondary)] uppercase tracking-wide"
            >
              {title}
            </h3>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                aria-label="Close panel"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 p-5">{children}</div>
      </aside>

      {/* Mobile: slide-in sheet */}
      {open && (
        <div className="xl:hidden fixed inset-0 z-40 flex justify-end">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="relative z-10 w-[280px] bg-[var(--color-surface)] shadow-[var(--shadow-lg)] flex flex-col h-full overflow-y-auto animate-[slide-in-right_200ms_ease-out]">
            {title && (
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
                <h3 className="text-[var(--font-size-sm)] font-[var(--font-weight-semibold)] text-[var(--color-text-secondary)] uppercase tracking-wide">
                  {title}
                </h3>
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                    aria-label="Close panel"
                  >
                    <X size={16} strokeWidth={1.5} />
                  </button>
                )}
              </div>
            )}
            <div className="flex-1 p-5">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}
