"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormError } from "@/components/ui/FormError";

interface TripFormProps {
  mode: "create" | "edit";
  tripId?: string;
  defaultValues?: {
    name?: string;
    description?: string;
    start_date?: string;
    end_date?: string;
  };
  onSuccess?: () => void;
}

export function TripForm({ mode, tripId, defaultValues = {}, onSuccess }: TripFormProps) {
  const router = useRouter();
  const [name, setName] = useState(defaultValues.name ?? "");
  const [description, setDescription] = useState(defaultValues.description ?? "");
  const [startDate, setStartDate] = useState(defaultValues.start_date ?? "");
  const [endDate, setEndDate] = useState(defaultValues.end_date ?? "");
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; endDate?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const NAME_MAX = 50;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    // Augment validate() to also cover missing required fields
    const errors: { name?: string; endDate?: string } = {};
    if (!name.trim()) errors.name = "Trip name is required.";
    else if (name.trim().length > NAME_MAX) errors.name = `Trip name must be ${NAME_MAX} characters or fewer.`;
    if (endDate && startDate && endDate < startDate) errors.endDate = "End date must be after start date.";

    // Surface missing date fields through form-level error only
    setFieldErrors(errors);
    if (!startDate) { setError("Start date is required."); return; }
    if (!endDate) { setError("End date is required."); return; }
    if (Object.keys(errors).length > 0) return;

    setError(null);
    setLoading(true);

    const body = { name: name.trim(), description: description.trim() || null, start_date: startDate, end_date: endDate };

    const url = mode === "create" ? "/api/trips" : `/api/trips/${tripId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    if (mode === "create") {
      const data = await res.json();
      router.push(`/trips/${data.id}/dashboard`);
    } else {
      onSuccess?.();
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label htmlFor="trip-name" required className="mb-0">Trip name</Label>
          <span
            className={`text-[var(--font-size-xs)] tabular-nums ${
              name.length > NAME_MAX
                ? "text-[var(--color-danger)]"
                : name.length >= NAME_MAX * 0.8
                  ? "text-[var(--color-warning)]"
                  : "text-[var(--color-text-muted)]"
            }`}
            aria-live="polite"
          >
            {name.length}/{NAME_MAX}
          </span>
        </div>
        <Input
          id="trip-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
          }}
          placeholder="e.g. Euro Summer 2026"
          required
          error={fieldErrors.name}
        />
      </div>

      <div>
        <Label htmlFor="trip-destination">Destination(s)</Label>
        <Input
          id="trip-destination"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Barcelona, Lisbon, Porto"
        />
        <p className="mt-1 text-[var(--font-size-xs)] text-[var(--color-text-muted)]">
          Optional. Helps Claude understand your trip.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start-date" required>Start date</Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="end-date" required>End date</Label>
          <Input
            id="end-date"
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              if (fieldErrors.endDate) setFieldErrors((prev) => ({ ...prev, endDate: undefined }));
            }}
            required
            error={fieldErrors.endDate}
          />
        </div>
      </div>

      <FormError message={error} />

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" variant="primary" size="lg" loading={loading} disabled={loading} className="flex-1">
          {mode === "create" ? "Create trip" : "Save changes"}
        </Button>
        {mode === "edit" && (
          <Button type="button" variant="secondary" size="lg" onClick={onSuccess}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
