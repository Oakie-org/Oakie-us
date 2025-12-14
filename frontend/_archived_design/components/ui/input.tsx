import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "unstyled";
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          variant === "unstyled"
            ? "w-full bg-transparent outline-none"
            : "flex w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-[var(--spacing-md)] py-[var(--spacing-sm)] text-[var(--font-size-base)] text-[var(--color-text)] transition-all duration-200 ease-in-out placeholder:text-[var(--color-text-muted)] focus-visible:outline-none focus-visible:border-[var(--color-primary)] focus-visible:ring-[3px] focus-visible:ring-[var(--color-primary-light)] disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
