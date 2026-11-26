import { Pencil, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * What only the person who can edit a page sees on it: a pencil beside each
 * part, and a quiet prompt where an empty part would go.
 */
export function EditButton({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "-my-2 -mr-2 shrink-0 text-ink-soft hover:text-ink",
        className,
      )}
    >
      <Pencil aria-hidden />
    </Button>
  );
}

export function AddPrompt({
  label,
  why,
  onClick,
}: {
  label: string;
  /** Why it is worth filling, in the editor's own interest. */
  why: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-2xl border border-dashed border-ink-soft px-4 py-3 text-left transition-colors hover:border-solid hover:border-ink"
    >
      <Plus className="size-5 shrink-0 text-ink-soft" aria-hidden />
      <span className="min-w-0">
        <span className="block font-display font-semibold">{label}</span>
        <span className="block text-sm text-ink-soft">{why}</span>
      </span>
    </button>
  );
}
