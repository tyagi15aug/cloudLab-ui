import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { SpinnerIcon } from "../icons";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-ink hover:bg-accent-hover disabled:hover:bg-accent shadow-soft",
  secondary:
    "bg-surface-raised text-ink border border-border hover:border-border-strong shadow-soft",
  ghost: "bg-transparent text-ink-muted hover:bg-surface-sunken hover:text-ink",
  danger: "bg-danger text-white hover:opacity-90 shadow-soft",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "secondary", size = "md", loading, disabled, className = "", children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center rounded-lg font-medium
          transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed
          ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...rest}
      >
        {loading && <SpinnerIcon width={16} height={16} className="-ml-0.5" />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
