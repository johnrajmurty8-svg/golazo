"use client";

import { useEffect, useRef, useState } from "react";
import { Paperclip, Download, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/lib/utils/toast";

interface Attachment {
  id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  download_url: string | null;
}

interface EventAttachmentsProps {
  tripId: string;
  eventId: string;
  isOrganiser: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function EventAttachments({ tripId, eventId, isOrganiser }: EventAttachmentsProps) {
  const [attachments, setAttachments] = useState<Attachment[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch(`/api/trips/${tripId}/itinerary/events/${eventId}/attachments`);
      if (!res.ok) {
        if (!cancelled) setAttachments([]);
        return;
      }
      const data = await res.json();
      if (!cancelled) setAttachments(data);
    }
    load();
    return () => { cancelled = true; };
  }, [tripId, eventId]);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Max size is 10MB.");
      e.target.value = "";
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/trips/${tripId}/itinerary/events/${eventId}/attachments`, {
      method: "POST",
      body: formData,
    });
    setUploading(false);
    e.target.value = "";

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Could not upload file.");
      return;
    }

    const newAttachment: Attachment = await res.json();
    setAttachments((prev) => [...(prev ?? []), newAttachment]);
    toast.success("File attached.");
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(
      `/api/trips/${tripId}/itinerary/events/${eventId}/attachments/${id}`,
      { method: "DELETE" }
    );
    setDeletingId(null);
    if (!res.ok) {
      toast.error("Could not delete attachment.");
      return;
    }
    setAttachments((prev) => (prev ?? []).filter((a) => a.id !== id));
    toast.success("Attachment removed.");
  }

  // No attachments and not an organiser: show nothing.
  if (!isOrganiser && (!attachments || attachments.length === 0)) return null;

  return (
    <div className="mt-2 pt-2 border-t border-[var(--color-border)]">
      {attachments && attachments.length > 0 && (
        <ul className="space-y-1 mb-1.5">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-2 text-[var(--font-size-xs)] text-[var(--color-text-secondary)]"
            >
              <Paperclip size={11} strokeWidth={1.5} className="shrink-0 text-[var(--color-text-muted)]" />
              {a.download_url ? (
                <a
                  href={a.download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--color-primary)] transition-colors truncate"
                  title={a.file_name}
                >
                  {a.file_name}
                </a>
              ) : (
                <span className="truncate" title={a.file_name}>{a.file_name}</span>
              )}
              <span className="text-[var(--color-text-muted)] shrink-0">{formatSize(a.file_size)}</span>
              {a.download_url && (
                <a
                  href={a.download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors shrink-0"
                  aria-label={`Download ${a.file_name}`}
                >
                  <Download size={11} strokeWidth={1.5} />
                </a>
              )}
              {isOrganiser && (
                <button
                  type="button"
                  onClick={() => handleDelete(a.id)}
                  disabled={deletingId === a.id}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors shrink-0 disabled:opacity-50"
                  aria-label={`Delete ${a.file_name}`}
                >
                  {deletingId === a.id ? (
                    <Loader2 size={11} strokeWidth={1.5} className="animate-spin" />
                  ) : (
                    <Trash2 size={11} strokeWidth={1.5} />
                  )}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {isOrganiser && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,text/plain,.pdf,.txt"
            className="hidden"
            onChange={handleFileSelected}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1 text-[var(--font-size-xs)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 size={11} strokeWidth={1.5} className="animate-spin" />
            ) : (
              <Paperclip size={11} strokeWidth={1.5} />
            )}
            {uploading ? "Uploading…" : "Attach file"}
          </button>
        </>
      )}
    </div>
  );
}
