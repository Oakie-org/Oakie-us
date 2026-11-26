import type { ReactNode } from "react";
import { BadgeCheck } from "lucide-react";

import type { ProjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ChipProps {
  children: ReactNode;
  className?: string;
  tone?: "neutral" | "primary" | "outline";
}

const CHIP_TONES = {
  neutral: "bg-sunken text-ink",
  primary: "bg-primary-soft text-on-primary-soft",
  outline: "border border-line text-ink-soft",
};

export function Chip({ children, className, tone = "neutral" }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex h-7 max-w-full items-center gap-1 rounded-chip px-2.5 text-[0.8125rem] font-medium whitespace-nowrap",
        CHIP_TONES[tone],
        className,
      )}
    >
      <span className="truncate">{children}</span>
    </span>
  );
}

// A dot and a word. Only "Recruiting" is coloured, because an open door is
// the one status a visitor acts on; the shape tells the others apart.
const STATUS_DOT: Record<ProjectStatus, string> = {
  Recruiting: "bg-positive",
  "In Progress": "bg-ink",
  Idea: "border border-ink-soft",
  Completed: "bg-ink-mute",
};

/** Status as a dot and a word: readable in a scan without shouting. */
export function StatusDot({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 text-[0.8125rem] text-ink-soft",
        className,
      )}
    >
      <span
        className={cn(
          "size-2 rounded-full",
          STATUS_DOT[status] ?? STATUS_DOT.Idea,
        )}
        aria-hidden
      />
      {status}
    </span>
  );
}

/**
 * Marks a community a member confirmed with an email address from it, in the
 * seal colour Oakie keeps for what it has checked. It vouches for that one
 * claim, not for the person, so it sits beside the community's name and never
 * beside the member's.
 */
export function VerifiedMark({ className }: { className?: string }) {
  return (
    <span
      title="Confirmed with an email address from this community"
      className={cn("inline-flex shrink-0 text-accent", className)}
    >
      <BadgeCheck className="size-[1.1em]" aria-hidden />
      <span className="sr-only">Confirmed by email</span>
    </span>
  );
}

export function CountBadge({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-accent px-1 text-[0.6875rem] font-medium text-on-accent tabular-nums ring-2 ring-paper">
      <span aria-hidden>{count > 9 ? "9+" : count}</span>
      <span className="sr-only">{`${count} ${label}`}</span>
    </span>
  );
}
