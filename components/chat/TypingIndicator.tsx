import { Avatar } from "@/components/ui/Avatar";

export function TypingIndicator() {
  return (
    <div className="flex gap-3 items-end">
      <Avatar name="Golazo AI" size={28} className="shrink-0 mb-0.5" />
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] rounded-bl-[var(--radius-sm)] px-4 py-3 shadow-[var(--shadow-sm)]">
        <div className="flex gap-1 items-center h-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)] animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)] animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)] animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
