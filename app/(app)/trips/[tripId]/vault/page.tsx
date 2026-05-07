import { redirect, notFound } from "next/navigation";
import { FolderOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { VaultPage } from "@/components/vault/VaultPage";

interface VaultPageProps {
  params: Promise<{ tripId: string }>;
}

export default async function DocumentVaultPage({ params }: VaultPageProps) {
  const { tripId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("trip_members")
    .select("role")
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .single();

  if (!membership) notFound();

  const isOrganiser = membership.role === "organiser";

  const { data: docs } = await supabase
    .from("documents")
    .select("*")
    .eq("trip_id", tripId)
    .order("uploaded_at", { ascending: false });

  return (
    <div className="flex-1 p-6 lg:p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-primary-light)] flex items-center justify-center">
          <FolderOpen size={20} strokeWidth={1.5} className="text-[var(--color-primary)]" />
        </div>
        <div>
          <h1
            className="text-[var(--font-size-xl)] font-[var(--font-weight-bold)] text-[var(--color-text-primary)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Documents
          </h1>
          <p className="text-[var(--font-size-sm)] text-[var(--color-text-secondary)]">
            Upload booking confirmations to let Claude parse your itinerary.
          </p>
        </div>
      </div>

      <VaultPage
        tripId={tripId}
        initialDocs={docs ?? []}
        isOrganiser={isOrganiser}
      />
    </div>
  );
}
