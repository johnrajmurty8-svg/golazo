"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormError } from "@/components/ui/FormError";
import { toast } from "@/lib/utils/toast";
import type { ItineraryEvent } from "@/types/database";

interface TripMember {
  user_id: string;
  display_name: string;
}

interface EventFormProps {
  tripId: string;
  /** Day's date (YYYY-MM-DD). Used to POST new inline events; also seed value when modal mode is off. */
  date: string;
  /** Show the date picker (modal mode). If false, the date is locked to the `date` prop. */
  showDatePicker?: boolean;
  editingEvent?: ItineraryEvent;
  tripMembers?: TripMember[];
  /**
   * Called with the saved event and the date the form was using at save time.
   * The date is useful when the parent needs to synthesise an itinerary_days
   * row for a freshly auto-created day.
   */
  onSaved: (event: ItineraryEvent, ctx: { date: string }) => void;
  onCancel: () => void;
}

type EventType = "flight" | "accommodation" | "activity" | "transfer" | "general";

export function EventForm({
  tripId,
  date: initialDate,
  showDatePicker = false,
  editingEvent,
  tripMembers = [],
  onSaved,
  onCancel,
}: EventFormProps) {
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(editingEvent?.time ?? "");
  const [title, setTitle] = useState(editingEvent?.title ?? "");
  const [location, setLocation] = useState(editingEvent?.location ?? "");
  const [description, setDescription] = useState(editingEvent?.description ?? "");
  const [eventType, setEventType] = useState<EventType>(editingEvent?.event_type ?? "general");
  const [travellers, setTravellers] = useState<string[]>(editingEvent?.travellers ?? []);
  const [tags, setTags] = useState<string[]>(editingEvent?.tags ?? []);
  const [tagDraft, setTagDraft] = useState("");
  const [bookingUrl, setBookingUrl] = useState(editingEvent?.booking_url ?? "");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleTraveller(name: string) {
    setTravellers((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  }

  function addTag() {
    const v = tagDraft.trim();
    if (!v) return;
    if (tags.includes(v)) { setTagDraft(""); return; }
    setTags((prev) => [...prev, v]);
    setTagDraft("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (!title.trim()) {
      setTitleError("Title is required.");
      return;
    }
    setError(null);
    setLoading(true);

    const sharedFields = {
      time: time || null,
      title: title.trim(),
      location: location.trim() || null,
      description: description.trim() || null,
      event_type: eventType,
      travellers: travellers.length > 0 ? travellers : null,
      tags: tags.length > 0 ? tags : null,
      booking_url: bookingUrl.trim() || null,
    };

    let res: Response;
    if (editingEvent) {
      res = await fetch(`/api/trips/${tripId}/itinerary/events/${editingEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sharedFields),
      });
    } else {
      res = await fetch(`/api/trips/${tripId}/itinerary/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...sharedFields, date }),
      });
    }

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not save. Please try again.");
      return;
    }

    const saved = await res.json();
    toast.success(editingEvent ? "Event updated." : "Event added.");
    onSaved(saved, { date });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[var(--radius-md)] border border-[var(--color-primary)]/30 bg-[var(--color-surface)] p-4 space-y-3 shadow-[var(--shadow-sm)]"
    >
      {showDatePicker && (
        <div>
          <Label htmlFor="event-date" required>Date</Label>
          <Input
            id="event-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
      )}

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

      {tripMembers.length > 0 && (
        <div>
          <Label>Travellers</Label>
          <div className="flex flex-wrap gap-1.5">
            {tripMembers.map((m) => {
              const selected = travellers.includes(m.display_name);
              return (
                <button
                  key={m.user_id}
                  type="button"
                  onClick={() => toggleTraveller(m.display_name)}
                  className={
                    selected
                      ? "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-[var(--font-weight-medium)] bg-[var(--color-primary)] text-white transition-colors"
                      : "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-[var(--font-weight-medium)] bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] transition-colors"
                  }
                >
                  {m.display_name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="event-tags">Tags</Label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-[var(--font-weight-medium)] bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]"
            >
              #{tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors"
                aria-label={`Remove tag ${tag}`}
              >
                <X size={11} strokeWidth={1.5} />
              </button>
            </span>
          ))}
        </div>
        <Input
          id="event-tags"
          value={tagDraft}
          onChange={(e) => setTagDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder="Type a tag and press Enter"
        />
      </div>

      <div>
        <Label htmlFor="event-booking-url">Booking URL</Label>
        <Input
          id="event-booking-url"
          type="url"
          value={bookingUrl}
          onChange={(e) => setBookingUrl(e.target.value)}
          placeholder="https://…"
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
