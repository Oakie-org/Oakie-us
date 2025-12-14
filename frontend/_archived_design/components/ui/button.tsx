import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-full)] font-medium tracking-[-0.01em] transition-all duration-200 ease-in-out cursor-pointer border border-transparent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--color-primary-light)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-primary)] text-white shadow-[var(--shadow-md)] hover:bg-[var(--color-primary-hover)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]",
        secondary:
          "bg-white text-[var(--color-text)] border-[var(--color-border)] shadow-[var(--shadow-sm)] hover:bg-[var(--color-surface-secondary)] hover:border-[var(--color-text-muted)]",
        outline:
          "bg-transparent border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary-light)]",
        ghost: "bg-transparent hover:bg-[var(--color-surface-secondary)]",
        link: "bg-transparent text-[var(--color-primary)] underline-offset-4 hover:underline",
      },
      size: {
        default:
          "px-[var(--spacing-lg)] py-[var(--spacing-sm)] text-[var(--font-size-base)]",
        sm: "px-[var(--spacing-md)] py-[var(--spacing-xs)] text-[var(--font-size-sm)]",
        lg: "px-[var(--spacing-xl)] py-[var(--spacing-md)] text-[var(--font-size-lg)] font-semibold",
        icon: "h-10 w-10 rounded-[var(--radius-full)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
