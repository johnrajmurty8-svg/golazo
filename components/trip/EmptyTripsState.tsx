import Link from "next/link";
import { Plus, MapPin } from "lucide-react";

export function EmptyTripsState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      {/* Illustration */}
      <div className="w-20 h-20 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center mb-6">
        <MapPin size={36} strokeWidth={1.5} className="text-[var(--color-primary)]" />
      </div>

      <h2
        className="text-[var(--font-size-xl)] font-[var(--font-weight-bold)] text-[var(--color-text-primary)] mb-2"
        style={{ fontFamily: "var(--font-display)" }}
      >
        No trips yet
      </h2>
      <p className="text-[var(--font-size-base)] text-[var(--color-text-secondary)] max-w-xs mb-8">
        Create your first trip and start uploading your booking documents.
      </p>

      <Link
        href="/trips/new"
        className="inline-flex items-center gap-2 h-10 px-5 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white text-[var(--font-size-sm)] font-[var(--font-weight-medium)] hover:bg-[var(--color-primary-hover)] active:scale-[0.97] transition-all duration-100 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
      >
        <Plus size={16} strokeWidth={2} />
        Create your first trip
      </Link>
    </div>
  );
}
