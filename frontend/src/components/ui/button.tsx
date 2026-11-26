import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

const BASE =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-field font-medium whitespace-nowrap " +
  "transition-[background-color,border-color,color,transform] duration-150 ease-out-soft active:scale-[0.98] " +
  "disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[1.1em] [&_svg]:shrink-0";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  outline:
    "border border-line-strong bg-surface text-ink hover:border-ink-soft hover:bg-sunken",
  ghost: "text-ink hover:bg-sunken",
  danger: "bg-danger-soft text-danger hover:bg-danger hover:text-surface",
};

// Every size keeps at least a 44px touch target; `sm` extends it invisibly.
const SIZES: Record<Size, string> = {
  sm: "relative h-9 px-3.5 text-sm after:absolute after:-inset-y-1 after:inset-x-0",
  md: "h-11 px-4 text-[0.9375rem]",
  lg: "h-12 px-5 text-base",
  icon: "size-11",
};

interface StyleProps {
  variant?: Variant;
  size?: Size;
  className?: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export function buttonClass({
  variant = "primary",
  size = "md",
  className,
}: StyleProps = {}) {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    StyleProps {
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant,
  size,
  className,
  loading,
  disabled,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Loader2 className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  className,
  ...rest
}: LinkProps & StyleProps) {
  return (
    <Link className={buttonClass({ variant, size, className })} {...rest} />
  );
}
