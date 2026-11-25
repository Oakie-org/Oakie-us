import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "accent" | "ink" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

const BASE =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-display font-semibold whitespace-nowrap " +
  "transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] " +
  "disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[1.15em] [&_svg]:shrink-0";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  accent: "bg-accent text-on-accent hover:brightness-95",
  ink: "bg-ink text-paper hover:bg-ink/85",
  outline: "border-2 border-line bg-surface text-ink hover:border-ink",
  ghost: "text-ink hover:bg-sunken",
  danger: "bg-danger-soft text-danger hover:brightness-95",
};

// Every size keeps at least a 44px touch target; `sm` extends it invisibly.
const SIZES: Record<Size, string> = {
  sm: "relative h-9 px-4 text-sm after:absolute after:-inset-y-1 after:inset-x-0",
  md: "h-11 px-5 text-[0.95rem]",
  lg: "h-13 px-7 text-base",
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
