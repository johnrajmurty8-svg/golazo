"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormError } from "@/components/ui/FormError";
import { toast } from "@/lib/utils/toast";
import type { ItineraryEvent } from "@/types/database";

interface EventFormProps {
  tripId: string;
  dayId: string;
  editingEvent?: ItineraryEvent;
  onSaved: (event: ItineraryEvent) => void;
  onCancel: () => void;
}

type EventType = "flight" | "accommodation" | "activity" | "transfer" | "general";

export function EventForm({ tripId, dayId, editingEvent, onSaved, onCancel }: EventFormProps) {
  const [time, setTime] = useState(editingEvent?.time ?? "");
  const [title, setTitle] = useState(editingEvent?.title ?? "");
  const [location, setLocation] = useState(editingEvent?.location ?? "");
  const [description, setDescription] = useState(editingEvent?.description ?? "");
  const [eventType, setEventType] = useState<EventType>(editingEvent?.event_type ?? "general");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (!title.trim()) {
      setTitleError("Title is required.");
      return;
    }
    setError(null);
    setLoading(true);

    const body = {
      day_id: dayId,
      time: time || null,
      title: title.trim(),
      location: location.trim() || null,
      description: description.trim() || null,
      event_type: eventType,
    };

    const url = editingEvent
      ? `/api/trips/${tripId}/itinerary/events/${editingEvent.id}`
      : `/api/trips/${tripId}/itinerary/events`;
    const method = editingEvent ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save. Please try again.");
      return;
    }

    const saved = await res.json();
    toast.success(editingEvent ? "Event updated." : "Event added.");
    onSaved(saved);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[var(--radius-md)] border border-[var(--color-primary)]/30 bg-[var(--color-surface)] p-4 space-y-3 shadow-[var(--shadow-sm)]"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="event-time">Time</Label>
          <Input
            id="event-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="event-type">Type</Label>
          <select
            id="event-type"
            value={eventType}
            onChange={(e) => setEventType(e.target.value as EventType)}
            className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[var(--font-size-base)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[var(--shadow-focus)] transition-all"
          >
            <option value="general">General</option>
            <option value="flight">Flight</option>
            <option value="accommodation">Accommodation</option>
            <option value="activity">Activity</option>
            <option value="transfer">Transfer</option>
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="event-title" required>Title</Label>
        <Input
          id="event-title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (titleError) setTitleError(null);
          }}
          placeholder="e.g. Dinner at Can Culleretes"
          required
          error={titleError ?? undefined}
        />
      </div>

      <div>
        <Label htmlFor="event-location">Location</Label>
        <Input
          id="event-location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Barcelona, Spain"
        />
      </div>

      <div>
        <Label htmlFor="event-description">Notes</Label>
        <textarea
          id="event-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Any additional notes…"
          rows={2}
          className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[var(--font-size-base)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] resize-none focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[var(--shadow-focus)] transition-all"
        />
      </div>

      <FormError message={error} />

      <div className="flex gap-2 pt-1">
        <Button type="submit" variant="primary" size="sm" loading={loading} disabled={loading}>
          {editingEvent ? "Save changes" : "Add event"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
