"use client";

import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { EditableCell } from "./EditableCell";
import { ConfidenceFlag } from "@/components/ui/ConfidenceFlag";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/utils/toast";
import type { ParsedFlight } from "@/types/database";

interface FlightsTableProps {
  tripId: string;
  initialFlights: ParsedFlight[];
  isOrganiser: boolean;
}

export function FlightsTable({ tripId, initialFlights, isOrganiser }: FlightsTableProps) {
  const [flights, setFlights] = useState(initialFlights);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addingRow, setAddingRow] = useState(false);

  async function patchFlight(id: string, field: string, value: string) {
    const res = await fetch(`/api/trips/${tripId}/flights/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value || null }),
    });
    if (res.ok) {
      const updated = await res.json();
      setFlights((prev) => prev.map((f) => (f.id === id ? updated : f)));
    } else {
      toast.error("Could not save. Please try again.");
    }
  }

  async function deleteFlight(id: string) {
    const res = await fetch(`/api/trips/${tripId}/flights/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      toast.success("Flight deleted.");
      setFlights((prev) => prev.filter((f) => f.id !== id));
    } else {
      toast.error("Could not delete flight. Please try again.");
    }
  }

  async function addFlight() {
    setAddingRow(true);
    const res = await fetch(`/api/trips/${tripId}/flights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ airline: null, from_airport: null, to_airport: null }),
    });
    setAddingRow(false);
    if (res.ok) {
      const newFlight = await res.json();
      setFlights((prev) => [...prev, newFlight]);
    } else {
      toast.error("Could not add flight.");
    }
  }

  const columns = [
    { key: "airline", label: "Airline" },
    { key: "from_airport", label: "From" },
    { key: "to_airport", label: "To" },
    { key: "departure_date", label: "Dep. Date", type: "date" as const },
    { key: "departure_time", label: "Dep. Time", type: "time" as const },
    { key: "arrival_time", label: "Arr. Time", type: "time" as const },
    { key: "flight_number", label: "Flight No." },
    { key: "confirmation_number", label: "Confirmation" },
  ];

  return (
    <>
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse">
          <thead>
            <tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-[var(--font-size-xs)] font-[var(--font-weight-semibold)] text-[var(--color-text-secondary)] uppercase tracking-wide whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
              {isOrganiser && <th className="px-4 py-3 w-10" />}
            </tr>
          </thead>
          <tbody>
            {flights.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + (isOrganiser ? 1 : 0)}
                  className="px-4 py-10 text-center text-[var(--font-size-sm)] text-[var(--color-text-muted)] italic"
                >
                  No flights yet. {isOrganiser ? "Parse documents or add one manually." : ""}
                </td>
              </tr>
            )}
            {flights.map((flight, i) => (
              <tr
                key={flight.id}
                className={`border-b border-[var(--color-border)] last:border-b-0 ${
                  i % 2 === 0 ? "bg-white" : "bg-[var(--color-bg)]"
                } hover:bg-[var(--color-surface-secondary)] transition-colors group`}
              >
                {columns.map((col) => {
                  const raw = flight[col.key as keyof ParsedFlight];
                  const val = raw !== null && raw !== undefined ? String(raw) : null;
                  return (
                    <td key={col.key} className="px-4 py-2 align-middle">
                      <div className="flex items-center gap-1">
                        {isOrganiser ? (
                          <EditableCell
                            value={val}
                            type={col.type}
                            onSave={(v) => patchFlight(flight.id, col.key, v)}
                          />
                        ) : (
                          <span className="text-[var(--font-size-sm)] text-[var(--color-text-primary)]">
                            {val ?? <span className="text-[var(--color-text-muted)]">—</span>}
                          </span>
                        )}
                        <ConfidenceFlag score={flight.confidence_score} />
                      </div>
                    </td>
                  );
                })}
                {isOrganiser && (
                  <td className="px-2 py-2 align-middle">
                    <button
                      type="button"
                      onClick={() => setDeletingId(flight.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] rounded-[var(--radius-sm)] transition-all"
                      aria-label="Delete flight"
                    >
                      <Trash2 size={13} strokeWidth={1.5} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {isOrganiser && (
          <div className="px-4 py-3 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={addFlight}
              disabled={addingRow}
              className="flex items-center gap-1.5 text-[var(--font-size-xs)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors disabled:opacity-50"
            >
              <Plus size={13} strokeWidth={2} />
              {addingRow ? "Adding…" : "Add flight"}
            </button>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {deletingId && (
        <Modal open onClose={() => setDeletingId(null)} title="Delete flight">
          <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)] mb-6">
            Are you sure you want to delete this flight record?
          </p>
          <div className="flex gap-3">
            <Button variant="danger" size="md" onClick={() => deleteFlight(deletingId)} className="flex-1">
              Delete
            </Button>
            <Button variant="secondary" size="md" onClick={() => setDeletingId(null)}>
              Cancel
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
