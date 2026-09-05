import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label": string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className = "", children, ...rest }, ref) => (
    <button
      ref={ref}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted
        transition-colors duration-150 hover:bg-surface-sunken hover:text-ink
        disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...rest}
    >
      {children}
    </button>
  ),
);
IconButton.displayName = "IconButton";
