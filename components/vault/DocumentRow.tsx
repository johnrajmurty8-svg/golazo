"use client";

import { useState } from "react";
import { Trash2, FileText } from "lucide-react";
import { ParseStatusBadge } from "./ParseStatusBadge";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/utils/toast";
import type { Document } from "@/types/database";

interface DocumentRowProps {
  doc: Document;
  tripId: string;
  isOrganiser: boolean;
  onDeleted: (id: string) => void;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function DocumentRow({ doc, tripId, isOrganiser, onDeleted }: DocumentRowProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/trips/${tripId}/vault/${doc.id}`, { method: "DELETE" });
    setDeleting(false);
    setConfirmOpen(false);
    if (res.ok) {
      toast.success("Document deleted.");
      onDeleted(doc.id);
    } else {
      toast.error("Failed to delete document. Please try again.");
    }
  }

  return (
    <>
      <div className="flex items-center gap-4 px-4 py-3 border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-surface-secondary)] transition-colors group">
        {/* Icon */}
        <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-[var(--color-surface-secondary)] flex items-center justify-center shrink-0">
          <FileText size={14} strokeWidth={1.5} className="text-[var(--color-text-muted)]" />
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <p className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text-primary)] truncate">
            {doc.file_name}
          </p>
          <p className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] mt-0.5">
            {formatBytes(doc.file_size_bytes)} · Uploaded {formatDate(doc.uploaded_at)}
          </p>
        </div>

        {/* Status */}
        <ParseStatusBadge status={doc.parse_status} />

        {/* Actions */}
        {isOrganiser && (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="opacity-0 group-hover:opacity-100 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-all duration-100 p-1 rounded-[var(--radius-sm)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
            aria-label={`Delete ${doc.file_name}`}
          >
            <Trash2 size={14} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Confirm delete modal */}
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Delete document">
        <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)] mb-6">
          Are you sure you want to delete <strong className="text-[var(--color-text-primary)]">{doc.file_name}</strong>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button variant="danger" size="md" loading={deleting} onClick={handleDelete} className="flex-1">
            Delete
          </Button>
          <Button variant="secondary" size="md" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </>
  );
}
