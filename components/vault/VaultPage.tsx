"use client";

import { useMemo, useState } from "react";
import { UploadZone } from "./UploadZone";
import { DocumentRow } from "./DocumentRow";
import { ParseAllButton } from "./ParseAllButton";
import { ParseProgressOverlay } from "./ParseProgressOverlay";
import { SearchBar } from "@/components/ui/SearchBar";
import { BulkActionBar } from "@/components/ui/BulkActionBar";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/utils/toast";
import { FileText } from "lucide-react";
import type { Document } from "@/types/database";

interface VaultPageProps {
  tripId: string;
  initialDocs: Document[];
  isOrganiser: boolean;
}

export function VaultPage({ tripId, initialDocs, isOrganiser }: VaultPageProps) {
  const [docs, setDocs] = useState<Document[]>(initialDocs);
  const [parsing, setParsing] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const unparsedCount = docs.filter((d) => d.parse_status === "unparsed").length;

  const filteredDocs = useMemo(() => {
    if (!query) return docs;
    const needle = query.toLowerCase();
    return docs.filter((d) => d.file_name.toLowerCase().includes(needle));
  }, [docs, query]);

  function handleUploaded() {
    // Reload — simplest approach for SSR data freshness
    window.location.reload();
  }

  function handleDeleted(id: string) {
    setDocs((prev) => prev.filter((d) => d.id !== id));
    setSelected((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function toggleSelected(id: string, next: boolean) {
    setSelected((prev) => {
      const out = new Set(prev);
      if (next) out.add(id);
      else out.delete(id);
      return out;
    });
  }

  async function handleBulkDelete() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulkDeleting(true);

    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/trips/${tripId}/vault/${id}`, { method: "DELETE" }).then((res) => {
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
      setDocs((prev) => prev.filter((d) => !succeeded.includes(d.id)));
    }
    setSelected(new Set());
    setBulkDeleting(false);
    setConfirmBulkOpen(false);

    if (failedCount === 0) {
      toast.success(`Deleted ${succeeded.length} document${succeeded.length === 1 ? "" : "s"}.`);
    } else if (succeeded.length === 0) {
      toast.error("Could not delete documents. Please try again.");
    } else {
      toast.warning(`Deleted ${succeeded.length}; ${failedCount} failed. Reloading…`);
      window.location.reload();
    }
  }

  return (
    <>
      <ParseProgressOverlay visible={parsing} />

      <div className="space-y-6">
        {/* Upload zone (organiser only) */}
        {isOrganiser && (
          <div>
            <h2
              className="text-[var(--font-size-sm)] font-[var(--font-weight-semibold)] text-[var(--color-text-secondary)] uppercase tracking-wide mb-3"
            >
              Upload documents
            </h2>
            <UploadZone tripId={tripId} onUploaded={handleUploaded} />
          </div>
        )}

        {/* Document list */}
        <div>
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <h2
              className="text-[var(--font-size-sm)] font-[var(--font-weight-semibold)] text-[var(--color-text-secondary)] uppercase tracking-wide"
            >
              Documents ({filteredDocs.length}{query ? ` of ${docs.length}` : ""})
            </h2>
            <div className="flex items-center gap-2">
              {docs.length > 0 && (
                <SearchBar
                  value={query}
                  onChange={setQuery}
                  placeholder="Search documents…"
                  ariaLabel="Search documents"
                />
              )}
              {isOrganiser && docs.length > 0 && (
                <ParseAllButton
                  tripId={tripId}
                  unparsedCount={unparsedCount}
                  onParseStart={() => setParsing(true)}
                  onParseComplete={() => {
                    setParsing(false);
                    window.location.reload();
                  }}
                />
              )}
            </div>
          </div>

          {isOrganiser && (
            <BulkActionBar
              count={selected.size}
              itemNoun="document"
              onDelete={() => setConfirmBulkOpen(true)}
              onClear={() => setSelected(new Set())}
              deleting={bulkDeleting}
            />
          )}

          {docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--color-surface-secondary)] flex items-center justify-center mb-3">
                <FileText size={20} strokeWidth={1.5} className="text-[var(--color-text-muted)]" />
              </div>
              <p className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text-primary)]">
                No documents yet
              </p>
              {isOrganiser ? (
                <p className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] mt-1">
                  Upload your booking confirmations above to get started.
                </p>
              ) : (
                <p className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] mt-1">
                  The organiser hasn&apos;t uploaded any documents yet.
                </p>
              )}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] py-8 text-center text-[var(--font-size-sm)] text-[var(--color-text-muted)]">
              No documents match “{query}”.
            </div>
          ) : (
            <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
              {filteredDocs.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  tripId={tripId}
                  isOrganiser={isOrganiser}
                  onDeleted={handleDeleted}
                  selected={selected.has(doc.id)}
                  onToggleSelected={toggleSelected}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={confirmBulkOpen}
        onClose={() => !bulkDeleting && setConfirmBulkOpen(false)}
        title={`Delete ${selected.size} document${selected.size === 1 ? "" : "s"}?`}
      >
        <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)] mb-6">
          This action cannot be undone. {selected.size === 1 ? "The selected document" : "All selected documents"} will be permanently removed.
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
