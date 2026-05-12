"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { DocumentViewerModal } from "./DocumentViewerModal";

interface SourceDocumentLinkProps {
  tripId: string;
  docId: string;
  fileName: string;
  /** Compact icon-only variant for tight rows (e.g. table cells). Default: false (icon + label). */
  compact?: boolean;
}

export function SourceDocumentLink({ tripId, docId, fileName, compact = false }: SourceDocumentLinkProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={
          compact
            ? "inline-flex items-center justify-center p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
            : "inline-flex items-center gap-1 text-[var(--font-size-xs)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] rounded-[var(--radius-sm)] px-1 py-0.5"
        }
        aria-label={`View source document: ${fileName}`}
        title={`View source: ${fileName}`}
      >
        <FileText size={compact ? 13 : 11} strokeWidth={1.5} />
        {!compact && <span className="truncate max-w-[160px]">{fileName}</span>}
      </button>
      <DocumentViewerModal
        open={open}
        onClose={() => setOpen(false)}
        tripId={tripId}
        docId={docId}
        fileName={fileName}
      />
    </>
  );
}
