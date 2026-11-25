import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Lock,
  Minus,
  Plus,
  RotateCcw,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import { useAuth } from "@/auth/AuthProvider";
import { toneFor } from "@/lib/categories";
import { useCatalog, useSaveProject } from "@/lib/queries";
import type {
  Project,
  ProjectInput,
  ProjectStatus,
  ProjectVisibility,
} from "@/lib/types";
import { cn, readStored, writeStored } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/button";
import { ChipInput } from "@/components/ui/chip-input";
import { FormError } from "@/components/ui/feedback";
import { Field, Input, Textarea } from "@/components/ui/field";
import { ImagePicker } from "@/components/ui/image-picker";
import { useToast } from "@/components/ui/toast";
import { ProjectCard } from "@/components/cards";
import { useTitle } from "@/components/page";

const DRAFT_KEY = "oakie:project-draft";

const BLANK: ProjectInput = {
  title: "",
  subtitle: "",
  description: "",
  category: "Software",
  tags: [],
  status: "Recruiting",
  uni: "",
  city: "",
  remote_ok: true,
  max_members: 5,
  open_roles: [],
  image_url: null,
  visibility: "public",
};

interface Draft {
  input: ProjectInput;
  step: number;
}

const STEPS = [
  {
    title: "What are you building?",
    lead: "A name and one line are enough to start. Everything can change later.",
  },
  {
    title: "Who do you need?",
    lead: "Teams that name the roles they need get far better applications.",
  },
  {
    title: "Tell the story",
    lead: "Three short answers. People join problems they understand.",
  },
  {
    title: "Where and who sees it",
    lead: "All optional. We filled in what we already know about you.",
  },
  {
    title: "Ready to publish",
    lead: "This is how people will meet your project.",
  },
] as const;

// Roles people most often recruit for, by discipline: one tap instead of typing.
const ROLE_IDEAS: Record<string, [string, string[]][]> = {
  Software: [
    ["Frontend developer", ["Frontend"]],
    ["Backend engineer", ["Backend"]],
    ["Product designer", ["UI/UX Design"]],
    ["Mobile developer", ["Mobile"]],
  ],
  "AI & Data": [
    ["ML engineer", ["Machine Learning"]],
    ["Data analyst", ["Data Analysis"]],
    ["Backend engineer", ["Backend"]],
  ],
  "Finance & Quant": [
    ["Quant researcher", ["Quant Research"]],
    ["Data engineer", ["Backend", "Data Analysis"]],
    ["Financial analyst", ["Financial Modeling"]],
  ],
  "Media & Content": [
    ["Video editor", ["Video Editing"]],
    ["Copywriter", ["Copywriting"]],
    ["Growth marketer", ["Marketing"]],
  ],
  "Design & Art": [
    ["Illustrator", ["Illustration"]],
    ["Brand designer", ["UI/UX Design"]],
    ["Campaign manager", ["Marketing"]],
  ],
  "Events & Community": [
    ["Community lead", ["Community Ops"]],
    ["Sponsorship lead", ["Business Development"]],
    ["Content creator", ["Copywriting"]],
  ],
  Research: [
    ["Research assistant", ["Data Analysis"]],
    ["ML engineer", ["Machine Learning"]],
    ["Technical writer", ["Copywriting"]],
  ],
  Startup: [
    ["Technical co-founder", ["Backend", "Frontend"]],
    ["Product manager", ["Product Management"]],
    ["Growth lead", ["Marketing"]],
  ],
  "Social Impact": [
    ["Field researcher", ["Community Ops"]],
    ["Mobile developer", ["Mobile"]],
    ["Partnerships lead", ["Business Development"]],
  ],
};

const STAGES: { value: ProjectStatus; detail: string }[] = [
  { value: "Idea", detail: "Nothing built yet" },
  { value: "Recruiting", detail: "Forming the team" },
  { value: "In Progress", detail: "Already building" },
];

const PROMPTS = ["The problem", "What exists today", "Who we need and why"];

const VISIBILITY: {
  value: ProjectVisibility;
  label: string;
  detail: string;
  icon: LucideIcon;
}[] = [
  {
    value: "public",
    label: "Public",
    detail: "Listed in Explore. Anyone can read updates.",
    icon: Eye,
  },
  {
    value: "members_only",
    label: "Team-only updates",
    detail: "Listed, but updates stay with the team.",
    icon: EyeOff,
  },
  {
    value: "private",
    label: "Private",
    detail: "Hidden from everyone except the team.",
    icon: Lock,
  },
];

function OptionCard({
  active,
  onSelect,
  children,
  name,
  value,
}: {
  active: boolean;
  onSelect: () => void;
  children: ReactNode;
  name: string;
  value: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-3.5 transition-colors has-focus-visible:outline-3 has-focus-visible:outline-primary",
        active
          ? "border-primary bg-primary-soft"
          : "border-line bg-surface hover:border-ink-soft",
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={active}
        onChange={onSelect}
        className="sr-only"
      />
      {children}
    </label>
  );
}

function clean(input: ProjectInput): ProjectInput {
  return {
    ...input,
    title: input.title.trim(),
    subtitle: input.subtitle.trim(),
    description: input.description.trim(),
    open_roles: input.open_roles
      .filter((role) => role.title.trim())
      .map((role) => ({ ...role, title: role.title.trim() })),
    max_members: Math.max(
      input.max_members,
      input.open_roles.filter((role) => role.title.trim()).length + 1,
    ),
  };
}

export default function ProjectWizard() {
  useTitle("Start a project");
  const navigate = useNavigate();
  const toast = useToast();
  const { me } = useAuth();
  const { data: catalog } = useCatalog();
  const save = useSaveProject();

  // A draft from an earlier visit wins; otherwise start from what the profile already says.
  const [stored] = useState(() => readStored<Draft | null>(DRAFT_KEY, null));
  const [input, setInput] = useState<ProjectInput>(
    () =>
      stored?.input ?? { ...BLANK, uni: me?.uni ?? "", city: me?.city ?? "" },
  );
  const [step, setStep] = useState(() =>
    Math.min(stored?.step ?? 0, STEPS.length - 1),
  );
  const [restored, setRestored] = useState(Boolean(stored?.input.title));
  const [attempted, setAttempted] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const published = useRef(false);

  const set = <K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) =>
    setInput((current) => ({ ...current, [key]: value }));

  // Autosave: nothing typed here is ever lost to a closed tab.
  useEffect(() => {
    if (published.current) return;
    const timer = window.setTimeout(() => {
      const empty =
        !input.title.trim() &&
        !input.description.trim() &&
        input.open_roles.length === 0;
      writeStored(DRAFT_KEY, empty ? null : { input, step });
      if (!empty) setSavedAt(Date.now());
    }, 400);
    return () => window.clearTimeout(timer);
  }, [input, step]);

  const errors: Partial<Record<number, string>> = {
    0:
      input.title.trim().length < 3
        ? "Give your project a name of at least 3 characters."
        : undefined,
    2: !input.description.trim()
      ? "Write at least a sentence about what you're building."
      : undefined,
  };
  const firstInvalid = [0, 2].find((index) => errors[index]);
  const last = step === STEPS.length - 1;

  function go(next: number) {
    setAttempted(false);
    setStep(next);
    requestAnimationFrame(() => {
      heading.current?.focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!last) {
      if (errors[step]) return setAttempted(true);
      return go(step + 1);
    }
    if (firstInvalid !== undefined) {
      go(firstInvalid);
      return setAttempted(true);
    }
    save.mutate(clean(input), {
      onSuccess: (project) => {
        published.current = true;
        writeStored(DRAFT_KEY, null);
        toast.success("Your project is live");
        navigate(`/projects/${project.id}?created=1`);
      },
    });
  }

  function startOver() {
    writeStored(DRAFT_KEY, null);
    setInput({ ...BLANK, uni: me?.uni ?? "", city: me?.city ?? "" });
    setRestored(false);
    setSavedAt(null);
    go(0);
  }

  const ideas = (ROLE_IDEAS[input.category] ?? ROLE_IDEAS.Software).filter(
    ([title]) =>
      !input.open_roles.some(
        (role) => role.title.toLowerCase() === title.toLowerCase(),
      ),
  );
  const updateRole = (
    index: number,
    patch: Partial<ProjectInput["open_roles"][number]>,
  ) =>
    set(
      "open_roles",
      input.open_roles.map((role, position) =>
        position === index ? { ...role, ...patch } : role,
      ),
    );
  const minSeats = input.open_roles.length + 1;

  const preview: Project = {
    ...clean(input),
    title: input.title.trim() || "Your project name",
    subtitle:
      input.subtitle.trim() ||
      (input.description.trim() ? "" : "Your one-line summary appears here."),
    id: "draft",
    owner_id: me?.id ?? "",
    owner: me,
    current_members: 1,
    likes: 0,
    follows: 0,
    priority: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <form onSubmit={onSubmit} noValidate className="min-w-0">
        <div className="flex items-center justify-between gap-3 text-sm text-ink-soft">
          <p className="font-medium" aria-live="polite">
            Step {step + 1} of {STEPS.length}
          </p>
          <p className="flex items-center gap-1.5" aria-live="polite">
            {savedAt && (
              <>
                <Check className="size-4 text-primary" aria-hidden /> Draft
                saved
              </>
            )}
          </p>
        </div>
        <ol className="mt-2 flex gap-1.5" aria-hidden>
          {STEPS.map((item, index) => (
            <li
              key={item.title}
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"
            >
              <span
                className={cn(
                  "block h-full rounded-full bg-primary transition-transform duration-500 ease-out-soft",
                  index <= step ? "translate-x-0" : "-translate-x-full",
                )}
              />
            </li>
          ))}
        </ol>

        {restored && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-primary-soft px-4 py-3 text-on-primary-soft">
            <p className="text-[0.95rem] font-medium">
              Welcome back. We kept your draft of “{input.title.trim()}”.
            </p>
            <Button variant="ghost" size="sm" onClick={startOver}>
              <RotateCcw aria-hidden /> Start over
            </Button>
          </div>
        )}

        <div key={step} className="mt-8 animate-step">
          <h1
            ref={heading}
            tabIndex={-1}
            className="text-3xl outline-none sm:text-4xl"
          >
            {STEPS[step].title}
          </h1>
          <p className="mt-2 text-lg text-ink-soft">{STEPS[step].lead}</p>

          <div className="mt-8 flex flex-col gap-6">
            {step === 0 && (
              <>
                <Field
                  label="Project name"
                  required
                  error={attempted ? errors[0] : undefined}
                >
                  {(control) => (
                    <Input
                      {...control}
                      autoFocus
                      value={input.title}
                      onChange={(event) => set("title", event.target.value)}
                      maxLength={80}
                      placeholder="DormSwap"
                      className="h-14 text-lg"
                    />
                  )}
                </Field>
                <Field
                  label="In one line"
                  hint={`What it is and who it's for. ${input.subtitle.length}/140`}
                >
                  {(control) => (
                    <Input
                      {...control}
                      value={input.subtitle}
                      onChange={(event) => set("subtitle", event.target.value)}
                      maxLength={140}
                      placeholder="A trusted micro-marketplace for move-out season"
                    />
                  )}
                </Field>
                <fieldset>
                  <legend className="font-display text-sm font-semibold">
                    Discipline
                  </legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    {(catalog?.categories ?? [input.category]).map(
                      (category) => (
                        <OptionCard
                          key={category}
                          name="category"
                          value={category}
                          active={input.category === category}
                          onSelect={() => set("category", category)}
                        >
                          <span
                            className={cn(
                              "size-3.5 shrink-0 rounded-[4px]",
                              toneFor(category).bg,
                            )}
                            aria-hidden
                          />
                          <span className="text-[0.95rem] font-medium">
                            {category}
                          </span>
                        </OptionCard>
                      ),
                    )}
                  </div>
                </fieldset>
              </>
            )}

            {step === 1 && (
              <>
                {ideas.length > 0 && input.open_roles.length < 8 && (
                  <div>
                    <p className="font-display text-sm font-semibold">
                      Common for {input.category}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {ideas.map(([title, skills]) => (
                        <button
                          key={title}
                          type="button"
                          onClick={() =>
                            setInput((current) => ({
                              ...current,
                              open_roles: [
                                ...current.open_roles,
                                { title, skills },
                              ],
                              max_members: Math.max(
                                current.max_members,
                                current.open_roles.length + 2,
                              ),
                            }))
                          }
                          className="flex h-10 items-center gap-1.5 rounded-full border border-dashed border-ink-soft px-3.5 text-sm font-medium transition-colors hover:border-solid hover:border-ink hover:bg-surface"
                        >
                          <Plus className="size-4" aria-hidden /> {title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {input.open_roles.map((role, index) => (
                  <div
                    key={index}
                    className="flex animate-pop flex-col gap-3 rounded-2xl bg-surface p-4"
                  >
                    <div className="flex items-end gap-2">
                      <Field label={`Role ${index + 1}`} className="flex-1">
                        {(control) => (
                          <Input
                            {...control}
                            value={role.title}
                            onChange={(event) =>
                              updateRole(index, { title: event.target.value })
                            }
                            maxLength={40}
                            placeholder="Backend engineer"
                          />
                        )}
                      </Field>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove role ${index + 1}`}
                        onClick={() =>
                          set(
                            "open_roles",
                            input.open_roles.filter(
                              (_, position) => position !== index,
                            ),
                          )
                        }
                      >
                        <Trash2 aria-hidden />
                      </Button>
                    </div>
                    <Field label="Skills wanted">
                      {(control) => (
                        <ChipInput
                          {...control}
                          value={role.skills}
                          onChange={(skills) => updateRole(index, { skills })}
                          suggestions={catalog?.skills ?? []}
                          max={6}
                          placeholder="Add a skill"
                        />
                      )}
                    </Field>
                  </div>
                ))}
                {input.open_roles.length < 8 && (
                  <Button
                    variant="outline"
                    className="self-start"
                    onClick={() =>
                      set("open_roles", [
                        ...input.open_roles,
                        { title: "", skills: [] },
                      ])
                    }
                  >
                    <Plus aria-hidden /> Add{" "}
                    {input.open_roles.length ? "another" : "a custom"} role
                  </Button>
                )}

                <div>
                  <p className="font-display text-sm font-semibold">
                    Team size, including you
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="One fewer seat"
                      disabled={input.max_members <= minSeats}
                      onClick={() => set("max_members", input.max_members - 1)}
                    >
                      <Minus aria-hidden />
                    </Button>
                    <span
                      className="w-10 text-center font-display text-2xl font-semibold tabular-nums"
                      aria-live="polite"
                    >
                      {input.max_members}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="One more seat"
                      disabled={input.max_members >= 50}
                      onClick={() => set("max_members", input.max_members + 1)}
                    >
                      <Plus aria-hidden />
                    </Button>
                    <span className="text-sm text-ink-soft">
                      Applications close when every seat is filled.
                    </span>
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <fieldset>
                  <legend className="font-display text-sm font-semibold">
                    Where does it stand?
                  </legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    {STAGES.map(({ value, detail }) => (
                      <OptionCard
                        key={value}
                        name="stage"
                        value={value}
                        active={input.status === value}
                        onSelect={() => set("status", value)}
                      >
                        <span>
                          <span className="block font-display font-semibold">
                            {value}
                          </span>
                          <span className="block text-sm text-ink-soft">
                            {detail}
                          </span>
                        </span>
                      </OptionCard>
                    ))}
                  </div>
                </fieldset>
                <Field
                  label="Description"
                  required
                  error={attempted ? errors[2] : undefined}
                  hint={`${input.description.length}/6000`}
                >
                  {(control) => (
                    <Textarea
                      {...control}
                      autoFocus
                      value={input.description}
                      onChange={(event) =>
                        set("description", event.target.value)
                      }
                      maxLength={6000}
                      rows={10}
                      placeholder={
                        "What problem are you solving?\nWhat exists today?\nWho do you need, and why would they love this?"
                      }
                    />
                  )}
                </Field>
                {!input.description.trim() && (
                  <Button
                    variant="outline"
                    className="-mt-2 self-start"
                    onClick={() =>
                      set(
                        "description",
                        PROMPTS.map((prompt) => `${prompt}\n`).join("\n"),
                      )
                    }
                  >
                    Start from three prompts
                  </Button>
                )}
              </>
            )}

            {step === 3 && (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label="Community"
                    hint="Optional. A school, company, club or lab, if the project belongs to one."
                  >
                    {(control) => (
                      <Input
                        {...control}
                        value={input.uni}
                        onChange={(event) => set("uni", event.target.value)}
                        maxLength={140}
                        placeholder="NYU, a studio, a maker space…"
                      />
                    )}
                  </Field>
                  <Field label="City">
                    {(control) => (
                      <Input
                        {...control}
                        value={input.city}
                        onChange={(event) => set("city", event.target.value)}
                        maxLength={140}
                        placeholder="New York, NY"
                      />
                    )}
                  </Field>
                </div>
                <label className="flex min-h-11 items-center gap-3">
                  <input
                    type="checkbox"
                    checked={input.remote_ok}
                    onChange={(event) => set("remote_ok", event.target.checked)}
                    className="size-5 accent-(--primary)"
                  />
                  <span className="font-medium">
                    Remote teammates are welcome
                  </span>
                </label>
                <Field
                  label="Tags"
                  hint="Press Enter to add. Tools, topics, anything people might search for."
                >
                  {(control) => (
                    <ChipInput
                      {...control}
                      value={input.tags}
                      onChange={(tags) => set("tags", tags)}
                      max={8}
                      placeholder="React, Backtesting, Zine…"
                    />
                  )}
                </Field>
                <ImagePicker
                  label="Picture (optional)"
                  hint="A screenshot, a photo, a sketch: something real from the project. No picture is fine too, the card then shows more of your words."
                  purpose="project_cover"
                  value={input.image_url}
                  onChange={(url) => set("image_url", url)}
                  preview={
                    input.image_url && (
                      <img
                        src={input.image_url}
                        alt=""
                        className="h-20 w-32 rounded-xl bg-sunken object-cover"
                      />
                    )
                  }
                />
                <fieldset>
                  <legend className="font-display text-sm font-semibold">
                    Who can see it
                  </legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    {VISIBILITY.map(({ value, label, detail, icon: Icon }) => (
                      <OptionCard
                        key={value}
                        name="visibility"
                        value={value}
                        active={input.visibility === value}
                        onSelect={() => set("visibility", value)}
                      >
                        <span>
                          <span className="flex items-center gap-1.5 font-display font-semibold">
                            <Icon className="size-4" aria-hidden />
                            {label}
                          </span>
                          <span className="mt-0.5 block text-sm text-ink-soft">
                            {detail}
                          </span>
                        </span>
                      </OptionCard>
                    ))}
                  </div>
                </fieldset>
              </>
            )}

            {step === 4 && (
              <>
                <div className="max-w-sm lg:hidden">
                  <ProjectCard project={preview} />
                </div>
                <ul className="flex flex-col gap-2">
                  {[
                    {
                      done: !errors[0],
                      label: "Name and one-liner",
                      detail: input.title.trim() || "Missing a name",
                      at: 0,
                    },
                    {
                      done: input.open_roles.length > 0,
                      label: "Open roles",
                      detail: input.open_roles.length
                        ? input.open_roles
                            .map((role) => role.title)
                            .filter(Boolean)
                            .join(", ")
                        : "None yet. Projects with named roles get more applications.",
                      at: 1,
                    },
                    {
                      done: !errors[2],
                      label: "The story",
                      detail: input.description.trim()
                        ? `${
                            input.description.trim().split(/\s+/).length
                          } words`
                        : "Missing a description",
                      at: 2,
                    },
                    {
                      done: Boolean(input.city || input.remote_ok),
                      label: "Place and visibility",
                      detail: [
                        input.city || (input.remote_ok ? "Remote" : ""),
                        input.uni,
                        VISIBILITY.find(
                          (option) => option.value === input.visibility,
                        )?.label,
                      ]
                        .filter(Boolean)
                        .join(" · "),
                      at: 3,
                    },
                  ].map((item) => (
                    <li
                      key={item.label}
                      className="flex items-center gap-3 rounded-2xl bg-surface p-4"
                    >
                      <span
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-full",
                          item.done
                            ? "bg-primary text-on-primary"
                            : "border-2 border-dashed border-ink-soft",
                        )}
                      >
                        {item.done && <Check className="size-4" aria-hidden />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display font-semibold">
                          {item.label}
                        </span>
                        <span className="block truncate text-sm text-ink-soft">
                          {item.detail}
                        </span>
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => go(item.at)}
                      >
                        Edit
                      </Button>
                    </li>
                  ))}
                </ul>
                <FormError error={save.error} />
              </>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => go(step - 1)}>
              <ArrowLeft aria-hidden /> Back
            </Button>
          ) : (
            <ButtonLink to="/" variant="ghost">
              Cancel
            </ButtonLink>
          )}
          <div className="flex items-center gap-3">
            {(step === 1 || step === 3) && (
              <Button variant="ghost" onClick={() => go(step + 1)}>
                Skip for now
              </Button>
            )}
            <Button type="submit" size="lg" loading={save.isPending}>
              {last ? (
                "Publish project"
              ) : (
                <>
                  Continue <ArrowRight aria-hidden />
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <p className="mb-3 text-xs font-semibold tracking-wide text-ink-soft uppercase">
            Live preview
          </p>
          <div className="pointer-events-none" aria-hidden>
            <ProjectCard project={preview} />
          </div>
          <p className="mt-3 text-sm text-ink-soft">
            This is the card people see in Explore. It fills in as you go.
          </p>
        </div>
      </aside>
    </div>
  );
}
