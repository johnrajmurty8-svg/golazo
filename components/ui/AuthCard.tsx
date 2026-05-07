import { cn } from "@/lib/utils/cn";

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        "w-full max-w-[420px] rounded-[var(--radius-xl)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)] p-8",
        className
      )}
    >
      {children}
    </div>
  );
}
