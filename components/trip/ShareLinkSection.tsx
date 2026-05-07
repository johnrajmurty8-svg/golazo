"use client";

import { useState } from "react";
import { Link, RefreshCw, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/utils/toast";

interface ShareLinkSectionProps {
  tripId: string;
  shareToken: string;
}

export function ShareLinkSection({ tripId, shareToken: initialToken }: ShareLinkSectionProps) {
  const [token, setToken] = useState(initialToken);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/share/${tripId}?token=${token}`;

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  }

  async function regenerate() {
    setRegenerating(true);
    const res = await fetch(`/api/trips/${tripId}/share`, { method: "POST" });
    setRegenerating(false);
    if (res.ok) {
      const data = await res.json();
      setToken(data.share_token);
      toast.success("Share link regenerated. The old link is now invalid.");
    } else {
      toast.error("Could not regenerate link. Please try again.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 py-2.5">
        <Link size={14} strokeWidth={1.5} className="text-[var(--color-text-muted)] shrink-0" />
        <p className="flex-1 text-[var(--font-size-xs)] text-[var(--color-text-secondary)] truncate font-mono">
          {shareUrl}
        </p>
        <button
          type="button"
          onClick={copyLink}
          className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors p-1"
          aria-label="Copy link"
        >
          {copied ? (
            <Check size={14} strokeWidth={2} className="text-[var(--color-success)]" />
          ) : (
            <Copy size={14} strokeWidth={1.5} />
          )}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="primary" size="sm" onClick={copyLink}>
          <Copy size={13} strokeWidth={1.5} />
          Copy share link
        </Button>
        <Button
          variant="ghost"
          size="sm"
          loading={regenerating}
          onClick={regenerate}
          className="text-[var(--color-text-secondary)] gap-1.5"
        >
          <RefreshCw size={13} strokeWidth={1.5} />
          Regenerate link
        </Button>
      </div>

      <p className="text-[var(--font-size-xs)] text-[var(--color-text-muted)]">
        Share this link with your group. They can view the trip without logging in.
        Regenerating invalidates the old link.
      </p>
    </div>
  );
}
