import { useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Camera, Plus } from "lucide-react";

import { useAuth } from "@/auth/AuthProvider";
import { useMatches, useProjects, useUpdateMe } from "@/lib/queries";
import type { Me, ProfileUpdate } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button, ButtonLink } from "@/components/ui/button";
import { FormError, PageSpinner } from "@/components/ui/feedback";
import { Field, Input } from "@/components/ui/field";
import { PersonCard } from "@/components/cards";
import { Logo } from "@/components/Logo";
import { useTitle } from "@/components/page";
import {
  AvailabilityPicker,
  OpenToPicker,
  SkillPicker,
} from "@/components/profile/fields";
import { PhotoDialog } from "@/components/profile/PhotoDialog";
import { ProjectFeed, ProjectFeedSkeleton } from "@/components/ProjectFeed";

const STEPS = [
  {
    title: "What brings you here?",
    lead: "Pick as many as fit. It decides which invitations reach you.",
  },
  {
    title: "What can you bring to a team?",
    lead: "Tap a few. Teams search people by skill, and we'll show you the projects that need yours.",
  },
  {
    title: "Help people recognise you",
    lead: "A face, a line and a city. This is the card teams see.",
  },
] as const;

type Draft = Required<
  Pick<
    ProfileUpdate,
    "open_to" | "availability" | "skills" | "headline" | "city" | "uni"
  >
>;

// Which fields each step owns: a step saves only what it asked.
const FIELDS: (keyof Draft)[][] = [
  ["open_to", "availability"],
  ["skills"],
  ["headline", "city", "uni"],
];

function same(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** The last screen: what the answers were for. */
function Finish({ me, next }: { me: Me; next: string | null }) {
  const matches = useMatches(me.skills.length > 0, 3);
  const matched = matches.data ?? [];
  const waiting = me.skills.length > 0 && matches.isPending;
  // Nothing asks for these skills yet (or none were given): show what is open.
  const open = useProjects({ open_only: true }, 3);
  const fallback = (open.data?.pages[0]?.items ?? []).filter(
    (project) => project.owner_id !== me.id,
  );
  const showing = matched.length > 0 ? matched : fallback;
  return (
    <div className="mx-auto max-w-5xl animate-step">
      <h1 className="text-3xl leading-tight sm:text-4xl">
        Your profile is live
      </h1>
      <p className="mt-2 max-w-xl text-lg text-ink-soft">
        {matched.length > 0
          ? "These teams are looking for what you do. Open one, or start something of your own."
          : "Your profile is live. Find a team with an open seat, or start something of your own."}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        {next ? (
          <ButtonLink to={next} size="lg">
            Continue where you left off <ArrowRight aria-hidden />
          </ButtonLink>
        ) : (
          <ButtonLink to="/explore?open=1" size="lg">
            Explore projects <ArrowRight aria-hidden />
          </ButtonLink>
        )}
        <ButtonLink to="/projects/new" variant="outline" size="lg">
          <Plus aria-hidden /> Start a project
        </ButtonLink>
        <ButtonLink to={`/u/${me.id}`} variant="ghost" size="lg">
          See your profile
        </ButtonLink>
      </div>

      <section className="mt-12">
        <h2 className="mb-5 text-2xl">
          {matched.length > 0
            ? "Teams looking for your skills"
            : "Teams with open seats"}
        </h2>
        {waiting || (matched.length === 0 && open.isPending) ? (
          <ProjectFeedSkeleton count={3} />
        ) : showing.length === 0 ? (
          <p className="text-ink-soft">
            No team has an open seat right now. Yours could be the first.
          </p>
        ) : matched.length > 0 ? (
          <ProjectFeed
            projects={matched}
            footer={(project) => (
              <p className="text-[0.8125rem] text-ink-soft">
                Wants your{" "}
                <span className="font-medium text-ink">
                  {project.matched_skills.join(", ")}
                </span>
              </p>
            )}
          />
        ) : (
          <ProjectFeed projects={fallback} />
        )}
      </section>
    </div>
  );
}

function Steps({ me, next }: { me: Me; next: string | null }) {
  const update = useUpdateMe();
  const navigate = useNavigate();
  const heading = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState(0);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [showCommunity, setShowCommunity] = useState(Boolean(me.uni));
  const [draft, setDraft] = useState<Draft>({
    open_to: me.open_to,
    availability: me.availability,
    skills: me.skills,
    headline: me.headline,
    city: me.city,
    uni: me.uni,
  });
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  function go(target: number) {
    update.reset();
    setStep(target);
    requestAnimationFrame(() => {
      heading.current?.focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Every step is saved as it is left, so closing the tab loses nothing.
  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const changed: ProfileUpdate = {};
    for (const key of FIELDS[step]) {
      const value =
        typeof draft[key] === "string"
          ? (draft[key] as string).trim()
          : draft[key];
      if (!same(value, me[key])) Object.assign(changed, { [key]: value });
    }
    if (Object.keys(changed).length === 0) return go(step + 1);
    update.mutate(changed, { onSuccess: () => go(step + 1) });
  }

  if (step >= STEPS.length) return <Finish me={me} next={next} />;

  const answered = [
    draft.open_to.length > 0 || Boolean(draft.availability),
    draft.skills.length > 0,
    Boolean(draft.headline.trim() || draft.city.trim() || me.avatar_url),
  ][step];
  const preview = {
    ...me,
    ...draft,
    headline: draft.headline.trim() || "Your headline appears here.",
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <form onSubmit={onSubmit} noValidate className="min-w-0">
        <p className="text-sm font-medium text-ink-soft" aria-live="polite">
          Step {step + 1} of {STEPS.length}
        </p>
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

        <div key={step} className="mt-8 animate-step">
          <h1
            ref={heading}
            tabIndex={-1}
            className="text-3xl leading-tight outline-none sm:text-4xl"
          >
            {STEPS[step].title}
          </h1>
          <p className="mt-2 text-lg text-ink-soft">{STEPS[step].lead}</p>

          <div className="mt-8 flex flex-col gap-7">
            {step === 0 && (
              <>
                <OpenToPicker
                  value={draft.open_to}
                  onChange={(value) => set("open_to", value)}
                  legend="I'm open to"
                />
                <AvailabilityPicker
                  value={draft.availability}
                  onChange={(value) => set("availability", value)}
                  legend="Time I can give"
                />
              </>
            )}

            {step === 1 && (
              <Field
                label="Skills"
                hint={
                  draft.skills.length >= 3
                    ? "That's plenty to be found by. Add more any time."
                    : "Three is a good start."
                }
              >
                {(control) => (
                  <SkillPicker
                    {...control}
                    value={draft.skills}
                    onChange={(skills) => set("skills", skills)}
                  />
                )}
              </Field>
            )}

            {step === 2 && (
              <>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setPhotoOpen(true)}
                    className="group relative shrink-0 rounded-full"
                    aria-label={
                      me.avatar_url ? "Change your photo" : "Add a photo"
                    }
                  >
                    <Avatar user={me} size="xl" className="size-24 text-3xl" />
                    <span className="absolute -bottom-0.5 -right-0.5 flex size-9 items-center justify-center rounded-full bg-ink text-paper ring-4 ring-paper transition-transform group-hover:scale-110">
                      <Camera className="size-4" aria-hidden />
                    </span>
                  </button>
                  <div>
                    <Button
                      variant="outline"
                      onClick={() => setPhotoOpen(true)}
                    >
                      {me.avatar_url ? "Change photo" : "Add a photo"}
                    </Button>
                    <p className="mt-1.5 text-sm text-ink-soft">
                      People answer faces faster than initials.
                    </p>
                  </div>
                </div>
                <Field
                  label="Headline"
                  hint={`One line on what you do. ${draft.headline.length}/140`}
                >
                  {(control) => (
                    <Input
                      {...control}
                      value={draft.headline}
                      onChange={(event) => set("headline", event.target.value)}
                      maxLength={140}
                      placeholder="Illustrator who also codes"
                      className="h-14 text-lg"
                    />
                  )}
                </Field>
                <Field label="City" hint="Most teams start local.">
                  {(control) => (
                    <Input
                      {...control}
                      value={draft.city}
                      onChange={(event) => set("city", event.target.value)}
                      maxLength={140}
                      autoComplete="address-level2"
                      placeholder="New York, NY"
                    />
                  )}
                </Field>
                {showCommunity ? (
                  <Field
                    label="Community"
                    hint="Optional. A school, company, club or studio you're part of."
                  >
                    {(control) => (
                      <Input
                        {...control}
                        autoFocus={!me.uni}
                        value={draft.uni}
                        onChange={(event) => set("uni", event.target.value)}
                        maxLength={140}
                        autoComplete="organization"
                      />
                    )}
                  </Field>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-mt-3 self-start"
                    onClick={() => setShowCommunity(true)}
                  >
                    <Plus aria-hidden /> Add a school, company or club
                  </Button>
                )}
              </>
            )}
            <FormError error={update.error} />
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => go(step - 1)}>
              <ArrowLeft aria-hidden /> Back
            </Button>
          ) : (
            <span />
          )}
          <Button
            type="submit"
            size="lg"
            variant={answered ? "primary" : "outline"}
            loading={update.isPending}
          >
            {!answered
              ? "Skip for now"
              : step === STEPS.length - 1
                ? "Finish"
                : "Continue"}{" "}
            <ArrowRight aria-hidden />
          </Button>
        </div>
        <p className="mt-6 text-sm text-ink-soft">
          Nothing here is required, and all of it can be changed from your
          profile.{" "}
          <button
            type="button"
            className="font-medium text-ink underline underline-offset-2"
            onClick={() => navigate(next ?? "/")}
          >
            Do this later
          </button>
        </p>
      </form>

      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <p className="mb-3 text-sm text-ink-soft">How teams see you</p>
          <div className="pointer-events-none" aria-hidden>
            <PersonCard person={preview} />
          </div>
          <p className="mt-3 text-sm text-ink-soft">
            Your card in People and in search. It fills in as you go.
          </p>
        </div>
      </aside>
      <PhotoDialog me={me} open={photoOpen} onOpenChange={setPhotoOpen} />
    </div>
  );
}

/**
 * The guided start after sign-up: three short screens, each one question,
 * each saved as it is left, ending on the projects the answers lead to.
 */
export default function Welcome() {
  useTitle("Welcome");
  const { me } = useAuth();
  const location = useLocation();
  // Someone who signed up in the middle of something goes back to it.
  const from = (location.state as { from?: string } | null)?.from;
  const next = from && from !== "/" ? from : null;
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" aria-label="Oakie home" className="rounded-lg">
          <Logo />
        </Link>
      </header>
      <main className="px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
        {me ? <Steps me={me} next={next} /> : <PageSpinner />}
      </main>
    </div>
  );
}
