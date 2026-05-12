"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { CountdownBadge } from "@/components/ui/CountdownBadge";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/utils/toast";
import type { Trip } from "@/types/database";

interface TripListItemProps {
  trip: Trip;
  userId: string;
}

export function TripListItem({ trip, userId }: TripListItemProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = pathname.includes(`/trips/${trip.id}`);
  const isOrganiser = trip.organiser_id === userId;
  const initial = trip.name.charAt(0).toUpperCase();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/trips/${trip.id}`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        toast.success(`"${trip.name}" deleted.`);
        setConfirmOpen(false);
        router.push("/trips");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to delete trip. Please try again.");
      }
    } catch {
      toast.error("Failed to delete trip. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] transition-all duration-100 group",
          isActive
            ? "bg-[var(--color-sidebar-hover)]"
            : "hover:bg-[var(--color-sidebar-hover)]"
        )}
      >
        <Link
          href={`/trips/${trip.id}/dashboard`}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          {/* Thumbnail */}
          <div className="w-8 h-8 shrink-0 rounded-[var(--radius-sm)] bg-[var(--color-primary)] flex items-center justify-center">
            <span className="text-white text-[var(--font-size-xs)] font-[var(--font-weight-bold)]">
              {initial}
            </span>
          </div>
          {/* Name */}
          <span className="flex-1 text-[var(--font-size-sm)] text-[var(--color-sidebar-text)] truncate min-w-0 group-hover:text-white transition-colors">
            {trip.name}
          </span>
        </Link>

        {/* Countdown + delete */}
        <div className="flex items-center gap-1.5 shrink-0">
          <CountdownBadge startDate={trip.start_date} />
          {isOrganiser && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setConfirmOpen(true); }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-[var(--radius-sm)] text-[#6B6560] hover:text-[var(--color-danger)] transition-all duration-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
              aria-label={`Delete ${trip.name}`}
              title="Delete trip"
            >
              <Trash2 size={12} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Delete trip">
        <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)] mb-2">
          Are you sure you want to delete <strong className="text-[var(--color-text-primary)]">{trip.name}</strong>?
        </p>
        <p className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] mb-6">
          All documents, flights, accommodation, and itinerary data will be permanently removed.
        </p>
        <div className="flex gap-3">
          <Button variant="danger" size="md" loading={deleting} onClick={handleDelete} className="flex-1">
            Delete trip
          </Button>
          <Button variant="secondary" size="md" onClick={() => setConfirmOpen(false)} disabled={deleting}>
            Cancel
          </Button>
        </div>
      </Modal>
    </>
  );
}
