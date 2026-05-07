"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/lib/utils/toast";
import { useRouter } from "next/navigation";

interface ParseAllButtonProps {
  tripId: string;
  unparsedCount: number;
  onParseStart: () => void;
  onParseComplete: () => void;
}

export function ParseAllButton({ tripId, unparsedCount, onParseStart, onParseComplete }: ParseAllButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleParse() {
    setLoading(true);
    onParseStart();
    try {
      const res = await fetch(`/api/trips/${tripId}/parse`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Parsing failed. Please check your documents or enter details manually.");
      } else {
        toast.success("Documents parsed. Review your itinerary.");
        router.refresh();
      }
    } catch {
      toast.error("Parsing failed. Please try again.");
    } finally {
      setLoading(false);
      onParseComplete();
    }
  }

  return (
    <Button
      variant="primary"
      size="md"
      loading={loading}
      disabled={unparsedCount === 0}
      onClick={handleParse}
      className="gap-2"
    >
      <Sparkles size={14} strokeWidth={1.5} />
      Parse {unparsedCount > 0 ? `${unparsedCount} ` : ""}document{unparsedCount !== 1 ? "s" : ""}
    </Button>
  );
}
