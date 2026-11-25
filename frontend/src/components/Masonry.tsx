import { useEffect, useMemo, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

// Matches the grid everywhere else: 1 column, 2 from `sm`, 3 from `lg`.
const BREAKPOINTS = [1024, 640];

function readColumns(): number {
  if (typeof window === "undefined") return 1;
  const wide = BREAKPOINTS.findIndex(
    (width) => window.matchMedia(`(min-width: ${width}px)`).matches,
  );
  return wide === -1 ? 1 : 3 - wide;
}

function useColumns(max: number): number {
  const [columns, setColumns] = useState(readColumns);
  useEffect(() => {
    const queries = BREAKPOINTS.map((width) =>
      window.matchMedia(`(min-width: ${width}px)`),
    );
    const update = () => setColumns(readColumns());
    queries.forEach((query) => query.addEventListener("change", update));
    return () =>
      queries.forEach((query) => query.removeEventListener("change", update));
  }, []);
  return Math.min(columns, max);
}

interface MasonryProps<T> {
  items: T[];
  getKey: (item: T) => string;
  /** Approximate height of an item, in any consistent unit. */
  estimate: (item: T) => number;
  children: (item: T, index: number) => ReactNode;
  maxColumns?: number;
  className?: string;
}

/**
 * A feed of cards that keep their own height. Each item goes to whichever
 * column is shortest so far, judged by an estimate rather than a measurement:
 * placement is decided before paint and never changes when more items are
 * appended, so loading the next page does not reshuffle what is on screen.
 */
export function Masonry<T>({
  items,
  getKey,
  estimate,
  children,
  maxColumns = 3,
  className,
}: MasonryProps<T>) {
  const count = useColumns(maxColumns);
  const columns = useMemo(() => {
    const result = Array.from({ length: count }, () => ({
      height: 0,
      items: [] as { item: T; index: number }[],
    }));
    items.forEach((item, index) => {
      let target = result[0];
      for (const column of result)
        if (column.height < target.height) target = column;
      target.items.push({ item, index });
      target.height += estimate(item) + 1;
    });
    return result;
  }, [items, count, estimate]);

  return (
    <div className={cn("flex items-start gap-4", className)}>
      {columns.map((column, index) => (
        <div key={index} className="flex min-w-0 flex-1 flex-col gap-4">
          {column.items.map(({ item, index: position }) => (
            <div key={getKey(item)}>{children(item, position)}</div>
          ))}
        </div>
      ))}
    </div>
  );
}
