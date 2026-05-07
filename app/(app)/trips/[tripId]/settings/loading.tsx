import { Skeleton } from "@/components/ui/Skeleton";

export default function SettingsLoading() {
  return (
    <div className="flex-1 p-6 lg:p-8 max-w-2xl space-y-6">
      {/* Header */}
      <div className="space-y-1.5">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-52" />
      </div>

      {/* Trip details section */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4">
        <Skeleton className="h-5 w-28" />
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full rounded-[var(--radius-md)]" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-[var(--radius-md)]" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full rounded-[var(--radius-md)]" />
            </div>
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full rounded-[var(--radius-md)]" />
            </div>
          </div>
        </div>
      </div>

      {/* Members section */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4">
        <Skeleton className="h-5 w-24" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>

      {/* Share link section */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-10 w-full rounded-[var(--radius-md)]" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-[var(--radius-md)]" />
          <Skeleton className="h-9 w-36 rounded-[var(--radius-md)]" />
        </div>
      </div>
    </div>
  );
}
