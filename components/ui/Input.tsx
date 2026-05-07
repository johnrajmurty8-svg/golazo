import { cn } from "@/lib/utils/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export function Input({ error, className, ...props }: InputProps) {
  return (
    <div className="w-full">
      <input
        className={cn(
          "w-full h-10 px-3 rounded-[var(--radius-md)] border bg-[var(--color-surface)] text-[var(--color-text-primary)] text-[var(--font-size-base)] placeholder:text-[var(--color-text-muted)] transition-colors duration-100",
          "focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[var(--shadow-focus)]",
          error
            ? "border-[var(--color-danger)]"
            : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]",
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-[var(--font-size-sm)] text-[var(--color-danger)]">
          {error}
        </p>
      )}
    </div>
  );
}
