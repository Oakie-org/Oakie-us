import type { ReactNode } from "react";
import { Loader2, RotateCw } from "lucide-react";

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
      className={cn("animate-pulse rounded-md bg-sunken", className)}
      aria-hidden
    />
  );
}

interface EmptyStateProps {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** What a list shows when it has nothing: say why, and what to do next. */
export function EmptyState({
  title,
  children,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-card border border-line bg-surface px-5 py-6 sm:px-6",
        className,
      )}
    >
      <h3 className="text-base">{title}</h3>
      {children && <p className="mt-1 max-w-prose text-ink-soft">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
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
      className="rounded-card border border-line bg-surface px-5 py-6 sm:px-6"
    >
      <h3 className="text-base text-danger">That didn't load</h3>
      <p className="mt-1 max-w-prose text-ink-soft">{errorMessage(error)}</p>
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
