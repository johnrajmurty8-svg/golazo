import Link from "next/link";

interface SharedTripHeaderProps {
  tripName: string;
}

export function SharedTripHeader({ tripName }: SharedTripHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-[var(--color-surface)] border-b border-[var(--color-border)] shadow-[var(--shadow-sm)]">
      <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-[var(--radius-sm)] bg-[var(--color-primary)] flex items-center justify-center">
            <span className="text-white font-[var(--font-weight-bold)] text-xs leading-none">G</span>
          </div>
          <span
            className="text-[var(--font-size-md)] font-[var(--font-weight-bold)] text-[var(--color-text-primary)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Golazo
          </span>
          <span className="text-[var(--color-border-strong)] mx-1">·</span>
          <span className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)] truncate max-w-[200px]">
            {tripName}
          </span>
        </div>

        {/* CTA */}
        <Link
          href="/signup"
          className="shrink-0 inline-flex items-center h-8 px-3 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white text-[var(--font-size-xs)] font-[var(--font-weight-medium)] hover:bg-[var(--color-primary-hover)] transition-colors active:scale-[0.97]"
        >
          Plan your own trip →
        </Link>
      </div>
    </header>
  );
}
