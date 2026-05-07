import { cn } from "@/lib/utils/cn";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ required, className, children, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "block text-[var(--font-size-sm)] font-[var(--font-weight-medium)] text-[var(--color-text-primary)] mb-1.5",
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-0.5 text-[var(--color-danger)]" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}
