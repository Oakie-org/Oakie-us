import type { ReactNode } from "react";
import * as MenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown, X } from "lucide-react";

import type { FacetOption } from "@/lib/types";
import { cn } from "@/lib/utils";

const PILL =
  "flex h-10 shrink-0 items-center gap-1.5 rounded-field border px-3.5 text-sm font-medium transition-colors duration-150";
const IDLE = "border-line bg-surface text-ink hover:border-ink-soft";
const ACTIVE = "border-ink bg-ink text-paper";

interface FacetMenuProps {
  /** What the facet is called when nothing is chosen, e.g. "Discipline". */
  label: string;
  value: string;
  options: FacetOption[];
  onChange: (value: string) => void;
  /** For option lists that have no live counts behind them. */
  hideCounts?: boolean;
}

/**
 * One filter as a menu of real options with live counts. Choosing applies it
 * immediately; choosing the current option again clears it.
 */
export function FacetMenu({
  label,
  value,
  options,
  onChange,
  hideCounts,
}: FacetMenuProps) {
  // The current choice always stays listed, even when nothing else matches it.
  const listed =
    value &&
    !options.some(
      (option) => option.value.toLowerCase() === value.toLowerCase(),
    )
      ? [{ value, count: 0 }, ...options]
      : options;
  return (
    <MenuPrimitive.Root>
      <MenuPrimitive.Trigger
        className={cn(PILL, value ? ACTIVE : IDLE)}
        aria-label={value ? `${label}: ${value}` : label}
      >
        <span className="max-w-40 truncate">{value || label}</span>
        <ChevronDown className="size-4 opacity-70" aria-hidden />
      </MenuPrimitive.Trigger>
      <MenuPrimitive.Portal>
        <MenuPrimitive.Content
          align="start"
          sideOffset={8}
          className="z-50 max-h-80 min-w-56 animate-pop overflow-y-auto rounded-field border border-line bg-surface p-1.5 shadow-float"
        >
          {listed.length === 0 && (
            <p className="px-3 py-2 text-sm text-ink-soft">
              No options for the current filters.
            </p>
          )}
          {listed.map((option) => {
            const chosen = option.value.toLowerCase() === value.toLowerCase();
            return (
              <MenuPrimitive.Item
                key={option.value}
                onSelect={() => onChange(chosen ? "" : option.value)}
                className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-3 text-[0.95rem] outline-none data-highlighted:bg-sunken"
              >
                <span className="flex size-4 shrink-0 items-center justify-center">
                  {chosen && <Check className="size-4" aria-hidden />}
                </span>
                <span
                  className={cn("flex-1 truncate", chosen && "font-medium")}
                >
                  {option.value}
                </span>
                {!hideCounts && (
                  <span className="text-sm tabular-nums text-ink-soft">
                    {option.count}
                  </span>
                )}
              </MenuPrimitive.Item>
            );
          })}
        </MenuPrimitive.Content>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  );
}

/** An on/off filter, e.g. "Open seats". */
export function FilterToggle({
  active,
  onChange,
  children,
}: {
  active: boolean;
  onChange: (active: boolean) => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onChange(!active)}
      className={cn(PILL, active ? ACTIVE : IDLE)}
    >
      {active && <Check className="size-4" aria-hidden />}
      {children}
    </button>
  );
}

export interface AppliedFilter {
  key: string;
  label: string;
  onRemove: () => void;
}

/** The overview of what is narrowing the list, each removable on its own. */
export function AppliedFilters({
  filters,
  onClear,
}: {
  filters: AppliedFilter[];
  onClear: () => void;
}) {
  if (filters.length === 0) return null;
  return (
    <ul
      className="flex flex-wrap items-center gap-2"
      aria-label="Applied filters"
    >
      {filters.map((filter) => (
        <li key={filter.key} className="animate-pop">
          <button
            type="button"
            onClick={filter.onRemove}
            aria-label={`Remove filter: ${filter.label}`}
            className="group flex h-8 items-center gap-1.5 rounded-chip bg-primary-soft pl-3 pr-2 text-[0.8125rem] font-medium text-on-primary-soft transition-colors hover:bg-line hover:text-ink"
          >
            <span className="max-w-48 truncate">{filter.label}</span>
            <X
              className="size-3.5 opacity-70 group-hover:opacity-100"
              aria-hidden
            />
          </button>
        </li>
      ))}
      {filters.length > 1 && (
        <li>
          <button
            type="button"
            onClick={onClear}
            className="h-8 rounded-chip px-2 text-[0.8125rem] font-medium text-ink-soft underline-offset-2 hover:text-ink hover:underline"
          >
            Clear all
          </button>
        </li>
      )}
    </ul>
  );
}
