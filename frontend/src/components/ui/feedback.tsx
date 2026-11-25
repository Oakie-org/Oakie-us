import type { ReactNode } from "react";
import { Loader2, RotateCw, type LucideIcon } from "lucide-react";

import { errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("size-5 animate-spin text-ink-soft", className)}
      aria-hidden
    />
  );
}

export function PageSpinner() {
  return (
    <div
      className="flex min-h-[50vh] items-center justify-center"
      role="status"
      aria-label="Loading"
    >
      <Spinner className="size-8" />
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-sunken", className)}
      aria-hidden
    />
  );
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  tone?: string;
  className?: string;
}

/** What a list shows when it has nothing: say why, and what to do next. */
export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
  tone = "bg-block-sand",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-card border-2 border-dashed border-line px-6 py-12 text-center",
        className,
      )}
    >
      <span
        className={cn(
          "mb-4 flex size-14 items-center justify-center rounded-2xl text-block-ink",
          tone,
        )}
      >
        <Icon className="size-6" aria-hidden />
      </span>
      <h3 className="text-lg">{title}</h3>
      {children && <p className="mt-1 max-w-sm text-ink-soft">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center rounded-card bg-danger-soft px-6 py-10 text-center"
    >
      <h3 className="text-lg text-danger">That didn't load</h3>
      <p className="mt-1 max-w-sm text-ink">{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RotateCw aria-hidden /> Try again
        </Button>
      )}
    </div>
  );
}

/** Inline form-level error. */
export function FormError({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <p
      role="alert"
      className="rounded-field bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
    >
      {errorMessage(error)}
    </p>
  );
}
