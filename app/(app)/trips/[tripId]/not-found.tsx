import Link from "next/link";
import { MapPin } from "lucide-react";

export default function TripNotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-[var(--radius-xl)] bg-[var(--color-surface-secondary)] flex items-center justify-center mb-4">
        <MapPin size={28} strokeWidth={1.5} className="text-[var(--color-text-muted)]" />
      </div>
      <h1
        className="text-[var(--font-size-xl)] font-[var(--font-weight-bold)] text-[var(--color-text-primary)] mb-2"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Trip not found
      </h1>
      <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)] mb-6 max-w-xs">
        This trip doesn&apos;t exist or you don&apos;t have access to it.
      </p>
      <Link
        href="/trips"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white text-[var(--font-size-sm)] font-[var(--font-weight-medium)] hover:bg-[var(--color-primary-hover)] transition-colors"
      >
        Back to My Trips
      </Link>
    </div>
  );
}
