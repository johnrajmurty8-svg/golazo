"use client";

import { useState } from "react";
import { UploadZone } from "./UploadZone";
import { DocumentRow } from "./DocumentRow";
import { ParseAllButton } from "./ParseAllButton";
import { ParseProgressOverlay } from "./ParseProgressOverlay";
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

  const unparsedCount = docs.filter((d) => d.parse_status === "unparsed").length;

  function handleUploaded() {
    // Reload — simplest approach for SSR data freshness
    window.location.reload();
  }

  function handleDeleted(id: string) {
    setDocs((prev) => prev.filter((d) => d.id !== id));
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
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-[var(--font-size-sm)] font-[var(--font-weight-semibold)] text-[var(--color-text-secondary)] uppercase tracking-wide"
            >
              Documents ({docs.length})
            </h2>
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
                  The organiser hasn't uploaded any documents yet.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] overflow-hidden">
              {docs.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  tripId={tripId}
                  isOrganiser={isOrganiser}
                  onDeleted={handleDeleted}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
