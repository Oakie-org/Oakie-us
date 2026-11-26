import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/** Sets the browser tab title for the current screen. */
// eslint-disable-next-line react-refresh/only-export-components
export function useTitle(title: string | undefined) {
  useEffect(() => {
    document.title = title
      ? `${title} · Oakie`
      : "Oakie: projects looking for teammates";
  }, [title]);
}

interface PageHeaderProps {
  title: string;
  lead?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  lead,
  action,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-6 flex flex-wrap items-end justify-between gap-4",
        className,
      )}
    >
      <div className="max-w-2xl">
        <h1 className="text-3xl leading-tight sm:text-4xl">{title}</h1>
        {lead && <p className="mt-2 text-ink-soft">{lead}</p>}
      </div>
      {action}
    </header>
  );
}

export function Section({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mt-10", className)}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-[1.375rem] leading-tight">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

interface LoadMoreProps {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
}

/** Infinite scroll with a visible, keyboard-reachable fallback button. */
export function LoadMore({ hasMore, loading, onLoadMore }: LoadMoreProps) {
  const sentinel = useRef<HTMLDivElement>(null);
  const callback = useRef(onLoadMore);
  useEffect(() => {
    callback.current = onLoadMore;
  });

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && callback.current(),
      { rootMargin: "400px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  if (!hasMore) return null;
  return (
    <div ref={sentinel} className="mt-8 flex justify-center">
      <Button variant="outline" loading={loading} onClick={onLoadMore}>
        {loading ? "Loading…" : "Load more"}
      </Button>
    </div>
  );
}

interface FilterPillsProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  allLabel?: string;
}

/** Single-choice filter rendered as a scrollable row of pills. */
export function FilterPills({
  label,
  options,
  value,
  onChange,
  allLabel = "All",
}: FilterPillsProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0"
    >
      {["", ...options].map((option) => {
        const active = option === value;
        return (
          <button
            key={option || "all"}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? "" : option)}
            className={cn(
              "h-10 shrink-0 rounded-field border px-3.5 text-sm font-medium transition-colors duration-150",
              active
                ? "border-ink bg-ink text-paper"
                : "border-line-strong bg-surface text-ink hover:bg-sunken",
            )}
          >
            {option || allLabel}
          </button>
        );
      })}
    </div>
  );
}
