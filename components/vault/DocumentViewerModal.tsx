"use client";

import { useEffect, useState } from "react";
import { X, Download, ExternalLink, FileText } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

interface DocumentViewerModalProps {
  open: boolean;
  onClose: () => void;
  tripId: string;
  docId: string;
  fileName: string;
}

export function DocumentViewerModal({ open, onClose, tripId, docId, fileName }: DocumentViewerModalProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const proxyUrl = `/api/trips/${tripId}/vault/${docId}/url`;
  const isPdf = fileName.toLowerCase().endsWith(".pdf");

  useEffect(() => {
    if (!open) setIframeLoaded(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-viewer-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-5xl h-[90vh] flex flex-col rounded-[var(--radius-xl)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)] overflow-hidden animate-[modal-in_180ms_cubic-bezier(0.16,1,0.3,1)]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-[var(--color-border)] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={16} strokeWidth={1.5} className="text-[var(--color-text-muted)] shrink-0" />
            <h2
              id="doc-viewer-title"
              className="text-[var(--font-size-sm)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)] truncate"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {fileName}
            </h2>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <a
              href={proxyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
              aria-label="Open in new tab"
              title="Open in new tab"
            >
              <ExternalLink size={16} strokeWidth={1.5} />
            </a>
            <a
              href={proxyUrl}
              download={fileName}
              className="p-2 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
              aria-label="Download"
              title="Download"
            >
              <Download size={16} strokeWidth={1.5} />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
              aria-label="Close"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 bg-[var(--color-surface-secondary)] relative">
          {isPdf ? (
            <>
              {!iframeLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Spinner />
                </div>
              )}
              <iframe
                key={docId}
                src={proxyUrl}
                title={fileName}
                className="w-full h-full border-0 bg-white"
                onLoad={() => setIframeLoaded(true)}
              />
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <FileText size={28} strokeWidth={1.5} className="text-[var(--color-text-muted)] mb-3" />
              <p className="text-[var(--font-size-sm)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)]">
                Preview not available
              </p>
              <p className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] mt-1 mb-4 max-w-sm">
                This file type can&rsquo;t be previewed in-app. Use the buttons above to download or open in a new tab.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
