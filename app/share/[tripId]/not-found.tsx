import Link from "next/link";
import { LinkIcon } from "lucide-react";

export default function ShareNotFound() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-[var(--radius-xl)] bg-[var(--color-surface-secondary)] flex items-center justify-center mb-4">
        <LinkIcon size={28} strokeWidth={1.5} className="text-[var(--color-text-muted)]" />
      </div>
      <h1
        className="text-[var(--font-size-xl)] font-[var(--font-weight-bold)] text-[var(--color-text-primary)] mb-2"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Link not found
      </h1>
      <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)] mb-6 max-w-xs">
        This shared trip link is invalid or has expired. Ask the organiser for a new link.
      </p>
      <Link
        href="/login"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white text-[var(--font-size-sm)] font-[var(--font-weight-medium)] hover:bg-[var(--color-primary-hover)] transition-colors"
      >
        Sign in to Golazo
      </Link>
    </div>
  );
}
