import { Skeleton } from "@/components/ui/Skeleton";

export default function AccommodationLoading() {
  return (
    <div className="flex-1 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-[var(--radius-md)]" />
          <div className="space-y-1.5">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-9 w-36 rounded-[var(--radius-md)]" />
      </div>

      {/* Table */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        <div className="flex gap-4 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
          {[120, 100, 90, 90, 60, 100].map((w, i) => (
            <Skeleton key={i} className="h-3" width={w} />
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center px-4 py-4 border-b border-[var(--color-border)] last:border-0">
            {[120, 100, 90, 90, 60, 100].map((w, j) => (
              <Skeleton key={j} className="h-4" width={w} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
