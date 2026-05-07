"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toastStore, type ToastItem, type ToastVariant } from "@/lib/utils/toast";

const ICONS: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 size={16} strokeWidth={1.5} />,
  warning: <AlertTriangle size={16} strokeWidth={1.5} />,
  error: <XCircle size={16} strokeWidth={1.5} />,
  info: <Info size={16} strokeWidth={1.5} />,
};

const STYLES: Record<ToastVariant, string> = {
  success: "border-[var(--color-success)] text-[var(--color-success)]",
  warning: "border-[var(--color-warning)] text-[var(--color-warning)]",
  error: "border-[var(--color-danger)] text-[var(--color-danger)]",
  info: "border-[var(--color-primary)] text-[var(--color-primary)]",
};

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "flex items-start gap-3 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border shadow-[var(--shadow-lg)] px-4 py-3 w-[340px] max-w-[calc(100vw-32px)] animate-[toast-in_200ms_ease-out]",
        STYLES[toast.variant]
      )}
    >
      <span className="mt-0.5 shrink-0">{ICONS[toast.variant]}</span>
      <p className="flex-1 text-[var(--font-size-sm)] text-[var(--color-text-primary)] leading-snug">
        {toast.message}
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors mt-0.5"
      >
        <X size={14} strokeWidth={1.5} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return toastStore.subscribe(setToasts);
  }, []);

  return (
    <div
      className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 items-end"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <ToastCard
          key={t.id}
          toast={t}
          onDismiss={() => {
            // Remove immediately on dismiss click
            setToasts((prev) => prev.filter((x) => x.id !== t.id));
          }}
        />
      ))}
    </div>
  );
}
