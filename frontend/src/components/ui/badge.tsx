import type { ReactNode } from "react";
import {
  CheckCircle2,
  CircleDashed,
  Lightbulb,
  Megaphone,
  type LucideIcon,
} from "lucide-react";

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
        "inline-flex h-7 max-w-full items-center gap-1 rounded-full px-3 text-[0.8125rem] font-medium whitespace-nowrap",
        CHIP_TONES[tone],
        className,
      )}
    >
      <span className="truncate">{children}</span>
    </span>
  );
}

// Status is carried by icon and label, never by colour alone.
const STATUS: Record<ProjectStatus, { icon: LucideIcon; className: string }> = {
  Recruiting: { icon: Megaphone, className: "bg-primary text-on-primary" },
  "In Progress": {
    icon: CircleDashed,
    className: "bg-block-sun text-block-ink",
  },
  Idea: { icon: Lightbulb, className: "bg-block-lilac text-block-ink" },
  Completed: { icon: CheckCircle2, className: "bg-ink text-paper" },
};

export function StatusBadge({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  const { icon: Icon, className: tone } = STATUS[status] ?? STATUS.Idea;
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full px-3 font-display text-[0.8125rem] font-semibold whitespace-nowrap",
        tone,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {status}
    </span>
  );
}

export function CountBadge({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[0.6875rem] font-bold text-on-accent ring-2 ring-paper">
      <span aria-hidden>{count > 9 ? "9+" : count}</span>
      <span className="sr-only">{`${count} ${label}`}</span>
    </span>
  );
}
