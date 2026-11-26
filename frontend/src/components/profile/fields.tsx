import { useState } from "react";
import { Check } from "lucide-react";

import { useCatalog } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/field";

/**
 * The profile questions that are answered by tapping. The guided start and the
 * edit sheets on the profile ask them with the same controls.
 */

// What each choice means to a team reading it. Unknown options show no detail.
const OPEN_TO_DETAIL: Record<string, string> = {
  "Co-founder": "Start something serious together",
  "Side project": "Build outside work or class",
  Hackathon: "A weekend sprint with a team",
  Internship: "Real work on a real team",
  Mentoring: "Guide a team, or find a guide",
};

export function OpenToPicker({
  value,
  onChange,
  legend = "Open to",
}: {
  value: string[];
  onChange: (value: string[]) => void;
  legend?: string;
}) {
  const { data: catalog } = useCatalog();
  // A choice saved earlier stays visible even if the list has since changed.
  const options = [
    ...(catalog?.open_to ?? []),
    ...value.filter((option) => !catalog?.open_to.includes(option)),
  ];
  return (
    <fieldset>
      <legend className="font-display text-sm font-semibold">{legend}</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const active = value.includes(option);
          return (
            <label
              key={option}
              className={cn(
                "flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 px-3.5 py-2.5 transition-colors has-focus-visible:outline-3 has-focus-visible:outline-primary",
                active
                  ? "border-primary bg-primary-soft"
                  : "border-line bg-surface hover:border-ink-soft",
              )}
            >
              <input
                type="checkbox"
                checked={active}
                onChange={() =>
                  onChange(
                    active
                      ? value.filter((chosen) => chosen !== option)
                      : [...value, option],
                  )
                }
                className="sr-only"
              />
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-md border-2",
                  active
                    ? "border-primary bg-primary text-on-primary"
                    : "border-ink-soft",
                )}
                aria-hidden
              >
                {active && <Check className="size-3.5" strokeWidth={3} />}
              </span>
              <span className="min-w-0">
                <span className="block font-display font-semibold leading-tight">
                  {option}
                </span>
                {OPEN_TO_DETAIL[option] && (
                  <span className="block text-sm text-ink-soft">
                    {OPEN_TO_DETAIL[option]}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** One choice from a fixed scale; tapping the chosen one again clears it. */
export function AvailabilityPicker({
  value,
  onChange,
  legend = "Time you can give",
}: {
  value: string;
  onChange: (value: string) => void;
  legend?: string;
}) {
  const { data: catalog } = useCatalog();
  return (
    <fieldset>
      <legend className="font-display text-sm font-semibold">{legend}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {(catalog?.availability ?? []).map((option) => {
          const active = value === option;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active ? "" : option)}
              className={cn(
                "flex h-11 items-center gap-1.5 rounded-full border-2 px-4 text-[0.95rem] font-medium transition-colors",
                active
                  ? "border-primary bg-primary-soft text-on-primary-soft"
                  : "border-line bg-surface hover:border-ink-soft",
              )}
            >
              {active && <Check className="size-4" aria-hidden />}
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * Skills as toggles that stay where they are: tapping several in a row never
 * makes the next one move. Anything not on the list is typed in below and
 * joins the toggles.
 */
export function SkillPicker({
  value,
  onChange,
  max = 20,
  ...control
}: {
  value: string[];
  onChange: (value: string[]) => void;
  max?: number;
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
}) {
  const { data: catalog } = useCatalog();
  const [draft, setDraft] = useState("");
  const has = (skill: string) =>
    value.some((chosen) => chosen.toLowerCase() === skill.toLowerCase());
  const known = catalog?.skills ?? [];
  // Their own additions follow the catalog, in the order they were added.
  const options = [
    ...known,
    ...value.filter(
      (skill) =>
        !known.some((option) => option.toLowerCase() === skill.toLowerCase()),
    ),
  ];
  const full = value.length >= max;

  function add(raw: string) {
    const label = raw.trim().replace(/,+$/, "").slice(0, 40);
    setDraft("");
    if (!label || full || has(label)) return;
    // Typing a listed skill picks the listed spelling.
    const listed = known.find(
      (option) => option.toLowerCase() === label.toLowerCase(),
    );
    onChange([...value, listed ?? label]);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Skills">
        {options.map((option) => {
          const active = has(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              disabled={full && !active}
              onClick={() =>
                onChange(
                  active
                    ? value.filter(
                        (chosen) =>
                          chosen.toLowerCase() !== option.toLowerCase(),
                      )
                    : [...value, option],
                )
              }
              className={cn(
                "flex h-10 items-center gap-1.5 rounded-full border-2 px-3.5 text-[0.95rem] font-medium transition-colors disabled:opacity-50",
                active
                  ? "border-primary bg-primary-soft text-on-primary-soft"
                  : "border-line bg-surface hover:border-ink-soft",
              )}
            >
              {active && <Check className="size-4" aria-hidden />}
              {option}
            </button>
          );
        })}
      </div>
      <Input
        {...control}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            add(draft);
          }
        }}
        onBlur={() => add(draft)}
        disabled={full}
        maxLength={40}
        enterKeyHint="done"
        placeholder={
          full ? `Up to ${max}` : "Something else? Type it and press Enter"
        }
      />
    </div>
  );
}
