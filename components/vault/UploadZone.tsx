"use client";

import { useState, useRef, DragEvent } from "react";
import { Upload, FileText } from "lucide-react";
import { toast } from "@/lib/utils/toast";
import { cn } from "@/lib/utils/cn";

const ACCEPTED_MIME = ["application/pdf", "text/plain"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

interface UploadZoneProps {
  tripId: string;
  onUploaded: () => void;
}

export function UploadZone({ tripId, onUploaded }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setInlineError(null);

    if (!ACCEPTED_MIME.includes(file.type)) {
      const msg = "Only PDF and plain-text files are supported.";
      setInlineError(msg);
      setStatusMessage(msg);
      return;
    }
    if (file.size > MAX_BYTES) {
      const msg = `"${file.name}" is too large — max file size is 10 MB.`;
      setInlineError(msg);
      setStatusMessage(msg);
      return;
    }

    setUploading(true);
    setStatusMessage(`Uploading ${file.name}…`);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/trips/${tripId}/vault`, {
      method: "POST",
      body: formData,
    });

    setUploading(false);
    if (res.ok) {
      setStatusMessage(`${file.name} uploaded successfully.`);
      toast.success(`${file.name} uploaded.`);
      onUploaded();
    } else {
      const data = await res.json().catch(() => ({}));
      const msg = data.error ?? "Upload failed. Please try again.";
      setInlineError(msg);
      setStatusMessage(msg);
      toast.error(msg);
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files || uploading) return;
    setInlineError(null);
    Array.from(files).forEach(uploadFile);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (!uploading) setDragging(true);
  }

  function handleDragLeave() {
    setDragging(false);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-2">
      {/* ARIA live region — announces status to screen readers */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {statusMessage}
      </div>

      <div
        role="button"
        tabIndex={uploading ? -1 : 0}
        aria-disabled={uploading}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border-2 border-dashed py-10 px-6 transition-all duration-150 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
          uploading
            ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] cursor-not-allowed opacity-70"
            : dragging
              ? "border-[var(--color-primary)] bg-[var(--color-primary-light)] cursor-pointer"
              : inlineError
                ? "border-[var(--color-danger)] bg-[var(--color-surface)] cursor-pointer"
                : "border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]/40 cursor-pointer"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => !uploading && e.key === "Enter" && inputRef.current?.click()}
        aria-label="Upload documents"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt"
          multiple
          disabled={uploading}
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            // Reset so the same file can be re-selected after an error
            e.target.value = "";
          }}
        />

        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
          dragging ? "bg-[var(--color-primary)]" : "bg-[var(--color-surface-secondary)]"
        )}>
          {uploading ? (
            <div className="w-5 h-5 border-2 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin" />
          ) : (
            <Upload
              size={20}
              strokeWidth={1.5}
              className={dragging ? "text-white" : "text-[var(--color-text-muted)]"}
            />
          )}
        </div>

        <div className="text-center">
          <p className="text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text-primary)]">
            {uploading ? "Uploading…" : "Drop files here, or click to browse"}
          </p>
          <p className="text-[var(--font-size-xs)] text-[var(--color-text-muted)] mt-1">
            PDF or text · max 10 MB per file
          </p>
        </div>
      </div>

      {inlineError && (
        <p
          role="alert"
          className="flex items-start gap-1.5 text-[var(--font-size-xs)] text-[var(--color-danger)] px-1"
        >
          <FileText size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
          {inlineError}
        </p>
      )}
    </div>
  );
}
