import { Skeleton } from "@/components/ui/Skeleton";

export default function VaultLoading() {
  return (
    <div className="flex-1 p-6 lg:p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="h-10 w-10 rounded-[var(--radius-md)]" />
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>

      {/* Upload zone skeleton */}
      <Skeleton className="h-36 w-full rounded-[var(--radius-xl)] mb-4" />

      {/* Document list */}
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
            <Skeleton className="h-9 w-9 rounded-[var(--radius-md)] shrink-0" />
            <div className="flex-1 space-y-1.5 min-w-0">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
