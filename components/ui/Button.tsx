"use client";

import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] active:scale-[0.97]",
  secondary:
    "bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-secondary)] active:scale-[0.97]",
  danger:
    "bg-[var(--color-danger-bg)] text-[var(--color-danger)] border border-[var(--color-danger)] hover:bg-red-100 active:scale-[0.97]",
  ghost:
    "bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] active:scale-[0.97]",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-[var(--font-size-sm)]",
  md: "h-10 px-4 text-[var(--font-size-sm)]",
  lg: "h-12 px-6 text-[var(--font-size-base)]",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-[var(--font-weight-medium)] transition-all duration-100 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] disabled:opacity-40 disabled:cursor-not-allowed select-none",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}
