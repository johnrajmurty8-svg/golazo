import { cn } from "@/lib/utils/cn";

interface CountdownBadgeProps {
  startDate: string;
  className?: string;
}

function getDaysRemaining(startDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  return Math.round((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function CountdownBadge({ startDate, className }: CountdownBadgeProps) {
  const days = getDaysRemaining(startDate);

  let label: string;
  let style: string;

  if (days < 0) {
    label = "In progress";
    style = "bg-[var(--color-success-bg)] text-[var(--color-success)]";
  } else if (days === 0) {
    label = "Today";
    style = "bg-[var(--color-primary)] text-white";
  } else {
    label = `${days}d`;
    style = "bg-[var(--color-primary)] text-white";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-[var(--font-weight-semibold)] tabular-nums",
        style,
        className
      )}
    >
      {label}
    </span>
  );
}
