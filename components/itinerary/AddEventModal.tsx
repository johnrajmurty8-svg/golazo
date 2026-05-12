"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { EventForm } from "./EventForm";
import type { ItineraryEvent } from "@/types/database";

interface TripMember {
  user_id: string;
  display_name: string;
}

interface AddEventModalProps {
  open: boolean;
  onClose: () => void;
  tripId: string;
  /** Default date to pre-fill the picker with (YYYY-MM-DD). */
  defaultDate: string;
  tripMembers: TripMember[];
  onCreated: (event: ItineraryEvent, date: string) => void;
}

export function AddEventModal({
  open,
  onClose,
  tripId,
  defaultDate,
  tripMembers,
  onCreated,
}: AddEventModalProps) {
  // Force-remount the form on each open so previous draft state is cleared.
  const [openKey, setOpenKey] = useState(0);

  function handleClose() {
    setOpenKey((k) => k + 1);
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add event">
      <EventForm
        key={openKey}
        tripId={tripId}
        date={defaultDate}
        showDatePicker
        tripMembers={tripMembers}
        onSaved={(ev, ctx) => {
          onCreated(ev, ctx.date);
          handleClose();
        }}
        onCancel={handleClose}
      />
    </Modal>
  );
}
