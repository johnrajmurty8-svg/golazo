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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate() {
    if (!name.trim()) return "Trip name is required.";
    if (!startDate) return "Start date is required.";
    if (!endDate) return "End date is required.";
    if (endDate < startDate) return "End date must be after start date.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

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
        <Label htmlFor="trip-name" required>Trip name</Label>
        <Input
          id="trip-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Euro Summer 2026"
          required
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
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
      </div>

      <FormError message={error} />

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" variant="primary" size="lg" loading={loading} className="flex-1">
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
