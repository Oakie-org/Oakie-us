import { useState, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";

import { cn } from "@/lib/utils";

interface ChipInputProps {
  id?: string;
  value: string[];
  onChange: (value: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  max?: number;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
}

/** Free-form list of short labels (skills, tags) with one-tap suggestions. */
export function ChipInput({
  value,
  onChange,
  suggestions = [],
  placeholder,
  max = 8,
  ...control
}: ChipInputProps) {
  const [draft, setDraft] = useState("");
  const full = value.length >= max;

  function add(raw: string) {
    const label = raw.trim().replace(/,+$/, "").slice(0, 40);
    if (!label || full) return;
    if (
      !value.some((existing) => existing.toLowerCase() === label.toLowerCase())
    )
      onChange([...value, label]);
    setDraft("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      add(draft);
    } else if (event.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  const remaining = suggestions.filter(
    (option) => !value.some((v) => v.toLowerCase() === option.toLowerCase()),
  );

  return (
    <div>
      <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-field border-2 border-line bg-surface px-2.5 py-2 transition-colors focus-within:border-primary hover:border-ink-soft">
        {value.map((label) => (
          <span
            key={label}
            className="inline-flex h-8 items-center gap-1 rounded-full bg-primary-soft pl-3 pr-1 text-sm font-medium text-on-primary-soft"
          >
            {label}
            <button
              type="button"
              onClick={() => onChange(value.filter((v) => v !== label))}
              aria-label={`Remove ${label}`}
              className="flex size-6 items-center justify-center rounded-full hover:bg-on-primary-soft/15"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </span>
        ))}
        <input
          {...control}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => add(draft)}
          disabled={full}
          placeholder={full ? `Up to ${max}` : placeholder}
          className="h-8 min-w-32 flex-1 bg-transparent px-1.5 text-base outline-none placeholder:text-ink-soft/70"
        />
      </div>
      {remaining.length > 0 && !full && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {remaining.slice(0, 10).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => add(option)}
              className={cn(
                "inline-flex h-8 items-center gap-1 rounded-full border border-line px-3 text-sm text-ink-soft transition-colors hover:border-ink hover:text-ink",
              )}
            >
              <Plus className="size-3.5" aria-hidden />
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
