"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/utils/toast";

interface ParseCTAProps {
  tripId: string;
  unparsedCount: number;
}

export function ParseCTA({ tripId, unparsedCount }: ParseCTAProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleParse() {
    setLoading(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/parse`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Parsing failed. Please try again.");
      } else {
        toast.success("Documents parsed. Review your itinerary.");
        router.refresh();
      }
    } catch {
      toast.error("Parsing failed. Please check your documents or enter details manually.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-4 rounded-[var(--radius-lg)] bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 p-5">
      <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center shrink-0">
        <Sparkles size={18} strokeWidth={1.5} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[var(--font-size-sm)] font-[var(--font-weight-semibold)] text-[var(--color-text-primary)]">
          {unparsedCount} document{unparsedCount !== 1 ? "s" : ""} ready to parse
        </p>
        <p className="text-[var(--font-size-xs)] text-[var(--color-text-secondary)] mt-0.5">
          Claude will extract flights, accommodation and build your itinerary.
        </p>
      </div>
      <Button variant="primary" size="sm" loading={loading} onClick={handleParse}>
        Parse now
      </Button>
    </div>
  );
}
