import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface FormErrorProps {
  message?: string | null;
  className?: string;
}

export function FormError({ message, className }: FormErrorProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-[var(--radius-md)] bg-[var(--color-danger-bg)] px-3 py-2.5 text-[var(--font-size-sm)] text-[var(--color-danger)]",
        className
      )}
    >
      <AlertCircle size={14} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
