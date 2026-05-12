"use client";

import { useMemo, useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { EditableCell } from "./EditableCell";
import { ConfidenceFlag } from "@/components/ui/ConfidenceFlag";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SearchBar } from "@/components/ui/SearchBar";
import { BulkActionBar } from "@/components/ui/BulkActionBar";
import { Checkbox } from "@/components/ui/Checkbox";
import { SourceDocumentLink } from "@/components/vault/SourceDocumentLink";
import { toast } from "@/lib/utils/toast";
import type { ParsedFlight } from "@/types/database";

interface FlightsTableProps {
  tripId: string;
  initialFlights: ParsedFlight[];
  isOrganiser: boolean;
  docNameById: Record<string, string>;
}

export function FlightsTable({ tripId, initialFlights, isOrganiser, docNameById }: FlightsTableProps) {
  const [flights, setFlights] = useState(initialFlights);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addingRow, setAddingRow] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const filteredFlights = useMemo(() => {
    if (!query) return flights;
    const needle = query.toLowerCase();
    return flights.filter((f) => {
      const hay = [
        f.airline,
        f.flight_number,
        f.from_airport,
        f.to_airport,
        f.confirmation_number,
        ...(f.travellers ?? []),
      ]
        .filter((v): v is string => typeof v === "string")
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [flights, query]);

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
      setSelected((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      toast.error("Could not delete flight. Please try again.");
    }
  }

  function toggleSelected(id: string, next: boolean) {
    setSelected((prev) => {
      const out = new Set(prev);
      if (next) out.add(id);
      else out.delete(id);
      return out;
    });
  }

  function toggleSelectAll(next: boolean) {
    if (!next) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(filteredFlights.map((f) => f.id)));
  }

  async function handleBulkDelete() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulkDeleting(true);

    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/trips/${tripId}/flights/${id}`, { method: "DELETE" }).then((res) => {
          if (!res.ok) throw new Error(`Failed: ${id}`);
          return id;
        })
      )
    );

    const succeeded = results
      .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
      .map((r) => r.value);
    const failedCount = results.length - succeeded.length;

    if (succeeded.length > 0) {
      setFlights((prev) => prev.filter((f) => !succeeded.includes(f.id)));
    }
    setSelected(new Set());
    setBulkDeleting(false);
    setConfirmBulkOpen(false);

    if (failedCount === 0) {
      toast.success(`Deleted ${succeeded.length} flight${succeeded.length === 1 ? "" : "s"}.`);
    } else if (succeeded.length === 0) {
      toast.error("Could not delete flights. Please try again.");
    } else {
      toast.warning(`Deleted ${succeeded.length}; ${failedCount} failed. Reloading…`);
      window.location.reload();
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

  const allFilteredSelected =
    filteredFlights.length > 0 && filteredFlights.every((f) => selected.has(f.id));
  const someFilteredSelected =
    filteredFlights.some((f) => selected.has(f.id)) && !allFilteredSelected;
  const colSpanExtra = 1 + (isOrganiser ? 2 : 0); // source col + (select col + delete col when organiser)

  return (
    <>
      {flights.length > 0 && (
        <div className="mb-3">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search flights by airline, route, traveller…"
            ariaLabel="Search flights"
          />
        </div>
      )}

      {isOrganiser && (
        <BulkActionBar
          count={selected.size}
          itemNoun="flight"
          onDelete={() => setConfirmBulkOpen(true)}
          onClear={() => setSelected(new Set())}
          deleting={bulkDeleting}
        />
      )}

      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse">
          <thead>
            <tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)]">
              {isOrganiser && (
                <th className="px-3 py-3 w-10 text-left">
                  <Checkbox
                    checked={allFilteredSelected}
                    indeterminate={someFilteredSelected}
                    onChange={toggleSelectAll}
                    ariaLabel="Select all flights"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-[var(--font-size-xs)] font-[var(--font-weight-semibold)] text-[var(--color-text-secondary)] uppercase tracking-wide whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
              <th className="px-2 py-3 text-center text-[var(--font-size-xs)] font-[var(--font-weight-semibold)] text-[var(--color-text-secondary)] uppercase tracking-wide whitespace-nowrap w-14">
                Source
              </th>
              {isOrganiser && <th className="px-4 py-3 w-10" />}
            </tr>
          </thead>
          <tbody>
            {flights.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + colSpanExtra}
                  className="px-4 py-10 text-center text-[var(--font-size-sm)] text-[var(--color-text-muted)] italic"
                >
                  No flights yet. {isOrganiser ? "Parse documents or add one manually." : ""}
                </td>
              </tr>
            )}
            {flights.length > 0 && filteredFlights.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + colSpanExtra}
                  className="px-4 py-10 text-center text-[var(--font-size-sm)] text-[var(--color-text-muted)] italic"
                >
                  No flights match “{query}”.
                </td>
              </tr>
            )}
            {filteredFlights.map((flight, i) => {
              const isSelected = selected.has(flight.id);
              return (
              <tr
                key={flight.id}
                className={`border-b border-[var(--color-border)] last:border-b-0 ${
                  isSelected
                    ? "bg-[var(--color-primary-light)]"
                    : i % 2 === 0 ? "bg-white" : "bg-[var(--color-bg)]"
                } hover:bg-[var(--color-surface-secondary)] transition-colors group`}
              >
                {isOrganiser && (
                  <td className="px-3 py-2 align-middle">
                    <Checkbox
                      checked={isSelected}
                      onChange={(next) => toggleSelected(flight.id, next)}
                      ariaLabel={`Select flight ${flight.flight_number ?? flight.id}`}
                    />
                  </td>
                )}
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
                <td className="px-2 py-2 align-middle text-center">
                  {flight.source_document_id && docNameById[flight.source_document_id] ? (
                    <SourceDocumentLink
                      tripId={tripId}
                      docId={flight.source_document_id}
                      fileName={docNameById[flight.source_document_id]}
                      compact
                    />
                  ) : null}
                </td>
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
            );
            })}
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

      <Modal
        open={confirmBulkOpen}
        onClose={() => !bulkDeleting && setConfirmBulkOpen(false)}
        title={`Delete ${selected.size} flight${selected.size === 1 ? "" : "s"}?`}
      >
        <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)] mb-6">
          This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="danger" size="md" loading={bulkDeleting} onClick={handleBulkDelete} className="flex-1">
            Delete {selected.size}
          </Button>
          <Button variant="secondary" size="md" onClick={() => setConfirmBulkOpen(false)} disabled={bulkDeleting}>
            Cancel
          </Button>
        </div>
      </Modal>
    </>
  );
}
