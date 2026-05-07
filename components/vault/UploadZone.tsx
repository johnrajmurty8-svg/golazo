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
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    if (!ACCEPTED_MIME.includes(file.type)) {
      toast.error("Only PDF and text files are supported.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("File too large. Max size is 10MB.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/trips/${tripId}/vault`, {
      method: "POST",
      body: formData,
    });

    setUploading(false);
    if (res.ok) {
      toast.success(`${file.name} uploaded.`);
      onUploaded();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Upload failed. Please try again.");
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach(uploadFile);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    setDragging(true);
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
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border-2 border-dashed py-10 px-6 cursor-pointer transition-all duration-150 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
        dragging || uploading
          ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]"
          : "border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)]/40"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      aria-label="Upload documents"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
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
  );
}
