"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/utils/toast";

interface DangerZoneProps {
  tripId: string;
  tripName: string;
}

export function DangerZone({ tripId, tripName }: DangerZoneProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/trips/${tripId}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      toast.success("Trip deleted.");
      router.push("/trips");
      router.refresh();
    } else {
      toast.error("Could not delete trip. Please try again.");
      setOpen(false);
    }
  }

  return (
    <>
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-danger)]/30 bg-[var(--color-danger-bg)] p-5">
        <h3
          className="text-[var(--font-size-sm)] font-[var(--font-weight-semibold)] text-[var(--color-danger)] mb-1"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Danger zone
        </h3>
        <p className="text-[var(--font-size-xs)] text-[var(--color-text-secondary)] mb-4">
          Deleting this trip will soft-delete all data. This cannot be undone.
        </p>
        <Button
          variant="danger"
          size="sm"
          onClick={() => setOpen(true)}
          className="gap-2"
        >
          <Trash2 size={13} strokeWidth={1.5} />
          Delete trip
        </Button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Delete trip">
        <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)] mb-2">
          Are you sure you want to delete{" "}
          <strong className="text-[var(--color-text-primary)]">{tripName}</strong>?
        </p>
        <p className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] mb-6">
          This action cannot be undone. All trip data will be removed.
        </p>
        <div className="flex gap-3">
          <Button variant="danger" size="md" loading={deleting} onClick={handleDelete} className="flex-1">
            Yes, delete trip
          </Button>
          <Button variant="secondary" size="md" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </>
  );
}
