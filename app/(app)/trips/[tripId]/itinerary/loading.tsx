import { Skeleton } from "@/components/ui/Skeleton";

export default function ItineraryLoading() {
  return (
    <div className="flex-1 p-6 lg:p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="h-10 w-10 rounded-[var(--radius-md)]" />
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-4 w-44" />
        </div>
      </div>

      {/* Day sections */}
      {Array.from({ length: 3 }).map((_, dayIdx) => (
        <div key={dayIdx} className="mb-6">
          {/* Day header */}
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-5 w-40" />
          </div>

          {/* Events */}
          <div className="ml-7 space-y-2">
            {Array.from({ length: dayIdx === 1 ? 3 : 2 }).map((_, i) => (
              <div key={i} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-6 w-14 rounded-full shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
