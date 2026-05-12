"use client";

import { useMemo, useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { EditableCell } from "@/components/flights/EditableCell";
import { ConfidenceFlag } from "@/components/ui/ConfidenceFlag";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SearchBar } from "@/components/ui/SearchBar";
import { BulkActionBar } from "@/components/ui/BulkActionBar";
import { Checkbox } from "@/components/ui/Checkbox";
import { SourceDocumentLink } from "@/components/vault/SourceDocumentLink";
import { toast } from "@/lib/utils/toast";
import type { ParsedAccommodation } from "@/types/database";

interface AccommodationTableProps {
  tripId: string;
  initialAccommodation: ParsedAccommodation[];
  isOrganiser: boolean;
  docNameById: Record<string, string>;
}

function nightsBetween(checkIn: string | null, checkOut: string | null): string {
  if (!checkIn || !checkOut) return "—";
  const nights = Math.round(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
  );
  return nights > 0 ? String(nights) : "—";
}

export function AccommodationTable({ tripId, initialAccommodation, isOrganiser, docNameById }: AccommodationTableProps) {
  const [records, setRecords] = useState(initialAccommodation);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addingRow, setAddingRow] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const filteredRecords = useMemo(() => {
    if (!query) return records;
    const needle = query.toLowerCase();
    return records.filter((r) => {
      const hay = [
        r.property_name,
        r.location,
        r.confirmation_number,
        ...(r.travellers ?? []),
      ]
        .filter((v): v is string => typeof v === "string")
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [records, query]);

  async function patchRecord(id: string, field: string, value: string) {
    const res = await fetch(`/api/trips/${tripId}/accommodation/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value || null }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRecords((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } else {
      toast.error("Could not save. Please try again.");
    }
  }

  async function deleteRecord(id: string) {
    const res = await fetch(`/api/trips/${tripId}/accommodation/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      toast.success("Accommodation deleted.");
      setRecords((prev) => prev.filter((r) => r.id !== id));
      setSelected((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      toast.error("Could not delete. Please try again.");
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
    setSelected(new Set(filteredRecords.map((r) => r.id)));
  }

  async function handleBulkDelete() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulkDeleting(true);

    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/trips/${tripId}/accommodation/${id}`, { method: "DELETE" }).then((res) => {
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
      setRecords((prev) => prev.filter((r) => !succeeded.includes(r.id)));
    }
    setSelected(new Set());
    setBulkDeleting(false);
    setConfirmBulkOpen(false);

    if (failedCount === 0) {
      toast.success(`Deleted ${succeeded.length} record${succeeded.length === 1 ? "" : "s"}.`);
    } else if (succeeded.length === 0) {
      toast.error("Could not delete accommodation. Please try again.");
    } else {
      toast.warning(`Deleted ${succeeded.length}; ${failedCount} failed. Reloading…`);
      window.location.reload();
    }
  }

  async function addRecord() {
    setAddingRow(true);
    const res = await fetch(`/api/trips/${tripId}/accommodation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ property_name: null, location: null }),
    });
    setAddingRow(false);
    if (res.ok) {
      const newRec = await res.json();
      setRecords((prev) => [...prev, newRec]);
    } else {
      toast.error("Could not add accommodation.");
    }
  }

  const columns = [
    { key: "property_name", label: "Property" },
    { key: "location", label: "Location" },
    { key: "check_in_date", label: "Check-In", type: "date" as const },
    { key: "check_out_date", label: "Check-Out", type: "date" as const },
    { key: "confirmation_number", label: "Confirmation" },
  ];

  const allFilteredSelected =
    filteredRecords.length > 0 && filteredRecords.every((r) => selected.has(r.id));
  const someFilteredSelected =
    filteredRecords.some((r) => selected.has(r.id)) && !allFilteredSelected;
  const colSpanExtra = 2 + (isOrganiser ? 2 : 0); // nights + source + (select + delete when organiser)

  return (
    <>
      {records.length > 0 && (
        <div className="mb-3">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search by property or location…"
            ariaLabel="Search accommodation"
          />
        </div>
      )}

      {isOrganiser && (
        <BulkActionBar
          count={selected.size}
          itemNoun="accommodation"
          onDelete={() => setConfirmBulkOpen(true)}
          onClear={() => setSelected(new Set())}
          deleting={bulkDeleting}
          label={`${selected.size} selected`}
        />
      )}

      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse">
          <thead>
            <tr className="bg-[var(--color-surface-secondary)] border-b border-[var(--color-border)]">
              {isOrganiser && (
                <th className="px-3 py-3 w-10 text-left">
                  <Checkbox
                    checked={allFilteredSelected}
                    indeterminate={someFilteredSelected}
                    onChange={toggleSelectAll}
                    ariaLabel="Select all accommodation"
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
              <th className="px-4 py-3 text-left text-[var(--font-size-xs)] font-[var(--font-weight-semibold)] text-[var(--color-text-secondary)] uppercase tracking-wide whitespace-nowrap">
                Nights
              </th>
              <th className="px-2 py-3 text-center text-[var(--font-size-xs)] font-[var(--font-weight-semibold)] text-[var(--color-text-secondary)] uppercase tracking-wide whitespace-nowrap w-14">
                Source
              </th>
              {isOrganiser && <th className="px-4 py-3 w-10" />}
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + colSpanExtra}
                  className="px-4 py-10 text-center text-[var(--font-size-sm)] text-[var(--color-text-muted)] italic"
                >
                  No accommodation yet. {isOrganiser ? "Parse documents or add one manually." : ""}
                </td>
              </tr>
            )}
            {records.length > 0 && filteredRecords.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + colSpanExtra}
                  className="px-4 py-10 text-center text-[var(--font-size-sm)] text-[var(--color-text-muted)] italic"
                >
                  No accommodation matches “{query}”.
                </td>
              </tr>
            )}
            {filteredRecords.map((rec, i) => {
              const isSelected = selected.has(rec.id);
              return (
              <tr
                key={rec.id}
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
                      onChange={(next) => toggleSelected(rec.id, next)}
                      ariaLabel={`Select ${rec.property_name ?? "accommodation"}`}
                    />
                  </td>
                )}
                {columns.map((col) => {
                  const raw = rec[col.key as keyof ParsedAccommodation];
                  const val = raw !== null && raw !== undefined ? String(raw) : null;
                  return (
                    <td key={col.key} className="px-4 py-2 align-middle">
                      <div className="flex items-center gap-1">
                        {isOrganiser ? (
                          <EditableCell
                            value={val}
                            type={col.type}
                            onSave={(v) => patchRecord(rec.id, col.key, v)}
                          />
                        ) : (
                          <span className="text-[var(--font-size-sm)] text-[var(--color-text-primary)]">
                            {val ?? <span className="text-[var(--color-text-muted)]">—</span>}
                          </span>
                        )}
                        <ConfidenceFlag score={rec.confidence_score} />
                      </div>
                    </td>
                  );
                })}
                <td className="px-4 py-2 align-middle text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
                  {nightsBetween(rec.check_in_date, rec.check_out_date)}
                </td>
                <td className="px-2 py-2 align-middle text-center">
                  {rec.source_document_id && docNameById[rec.source_document_id] ? (
                    <SourceDocumentLink
                      tripId={tripId}
                      docId={rec.source_document_id}
                      fileName={docNameById[rec.source_document_id]}
                      compact
                    />
                  ) : null}
                </td>
                {isOrganiser && (
                  <td className="px-2 py-2 align-middle">
                    <button
                      type="button"
                      onClick={() => setDeletingId(rec.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] rounded-[var(--radius-sm)] transition-all"
                      aria-label="Delete accommodation"
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
              onClick={addRecord}
              disabled={addingRow}
              className="flex items-center gap-1.5 text-[var(--font-size-xs)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors disabled:opacity-50"
            >
              <Plus size={13} strokeWidth={2} />
              {addingRow ? "Adding…" : "Add accommodation"}
            </button>
          </div>
        )}
      </div>

      {deletingId && (
        <Modal open onClose={() => setDeletingId(null)} title="Delete accommodation">
          <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)] mb-6">
            Are you sure you want to delete this accommodation record?
          </p>
          <div className="flex gap-3">
            <Button variant="danger" size="md" onClick={() => deleteRecord(deletingId)} className="flex-1">
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
        title={`Delete ${selected.size} record${selected.size === 1 ? "" : "s"}?`}
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
