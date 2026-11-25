import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Clapperboard,
  Code2,
  LineChart,
  Megaphone,
  Palette,
  Rocket,
  Users,
  type LucideIcon,
} from "lucide-react";

import { useProjects, useStats } from "@/lib/queries";
import { cn, compact } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { ProjectFeed, ProjectFeedSkeleton } from "@/components/ProjectFeed";
import { useTitle } from "@/components/page";

const PEOPLE: {
  label: string;
  detail: string;
  icon: LucideIcon;
  tone: string;
  span: string;
}[] = [
  {
    label: "Engineers",
    detail: "Full-stack, AI, hardware",
    icon: Code2,
    tone: "bg-block-sky",
    span: "col-span-2 row-span-2",
  },
  {
    label: "Quants",
    detail: "Strategy, analysis",
    icon: LineChart,
    tone: "bg-block-mint",
    span: "col-span-2",
  },
  {
    label: "Creators",
    detail: "Video, writing",
    icon: Clapperboard,
    tone: "bg-block-coral",
    span: "",
  },
  {
    label: "Designers",
    detail: "UI, illustration",
    icon: Palette,
    tone: "bg-block-pink",
    span: "",
  },
  {
    label: "Founders",
    detail: "Looking for the other half",
    icon: Rocket,
    tone: "bg-block-sun",
    span: "col-span-2",
  },
  {
    label: "Organizers",
    detail: "Events, community",
    icon: Megaphone,
    tone: "bg-block-lilac",
    span: "col-span-2",
  },
];

const STEPS = [
  {
    title: "Publish what you're building",
    body: "An app, a fund, a film, a zine, an event. Say what exists today and which seats are open.",
    tone: "bg-block-sky",
  },
  {
    title: "Match across disciplines",
    body: "Search people by skill and city. Engineers meet quants, writers meet editors, founders meet co-founders.",
    tone: "bg-block-mint",
  },
  {
    title: "Build in one shared space",
    body: "A timeline for progress, a board for tasks, a roster that shows who owns what.",
    tone: "bg-block-sun",
  },
  {
    title: "Leave with proof",
    body: "Every member earns a verifiable contribution record to put on a résumé or an application.",
    tone: "bg-block-coral",
  },
];

const STUCK = [
  "You have a quant strategy that works on paper, and no one to write the code.",
  "You have a script people would share, and no one who can shoot and cut it.",
  "You have the idea that could become a company, and you're building it alone.",
];

function Stat({ value, label }: { value: number | undefined; label: string }) {
  return (
    <div>
      <dd className="font-display text-4xl font-semibold sm:text-5xl">
        {value === undefined ? "–" : compact.format(value)}
      </dd>
      <dt className="mt-1 text-[#f6f5ef]/70">{label}</dt>
    </div>
  );
}

export default function Landing() {
  useTitle(undefined);
  const { data: stats } = useStats();
  const featured = useProjects({}, 6);
  const projects = featured.data?.pages[0]?.items ?? [];

  return (
    <div className="flex flex-col gap-20 sm:gap-28">
      <section className="grid items-center gap-10 pt-4 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pt-10">
        <div className="animate-rise">
          <p className="mb-5 inline-flex h-8 items-center gap-2 rounded-full bg-primary-soft px-3.5 font-display text-sm font-semibold text-on-primary-soft">
            <Users className="size-4" aria-hidden /> For people who make things
          </p>
          <h1 className="text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">
            Find your people.
            <br />
            <span className="text-primary">Build your world.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-soft sm:text-xl">
            Oakie is where people with different skills meet, form teams and
            ship real projects, and where a class side project can turn into a
            company.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to="/register" size="lg">
              Join Oakie <ArrowRight aria-hidden />
            </ButtonLink>
            <ButtonLink to="/explore" size="lg" variant="outline">
              Explore projects
            </ButtonLink>
          </div>
        </div>

        <ul
          className="stagger grid auto-rows-[6rem] grid-cols-4 gap-3 sm:auto-rows-[7rem]"
          aria-label="Who Oakie is for"
        >
          {PEOPLE.map(({ label, detail, icon: Icon, tone, span }) => (
            <li
              key={label}
              className={cn(
                "flex flex-col justify-between rounded-card p-4 text-block-ink",
                tone,
                span,
              )}
            >
              <Icon className="size-6" aria-hidden />
              <div>
                <p className="font-display text-lg font-semibold leading-tight sm:text-xl">
                  {label}
                </p>
                {span && <p className="text-sm text-block-ink/75">{detail}</p>}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-label="Oakie in numbers"
        className="rounded-card bg-block-ink px-6 py-10 text-[#f6f5ef] sm:px-12"
      >
        <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          <Stat value={stats?.projects} label="Projects on the island" />
          <Stat value={stats?.members} label="Members" />
          <Stat value={stats?.teammates_matched} label="Teammates matched" />
          <Stat value={stats?.applications} label="Applications sent" />
        </dl>
      </section>

      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl">Teams looking for you</h2>
            <p className="mt-2 text-lg text-ink-soft">
              Real projects, open seats, this week.
            </p>
          </div>
          <ButtonLink to="/explore" variant="outline">
            See all projects <ArrowRight aria-hidden />
          </ButtonLink>
        </div>
        {featured.isPending ? (
          <ProjectFeedSkeleton count={3} />
        ) : (
          <ProjectFeed projects={projects} />
        )}
        {featured.isError && (
          <p className="rounded-card bg-sunken p-6 text-ink-soft">
            Projects couldn't be loaded right now.{" "}
            <Link to="/explore" className="font-semibold text-ink underline">
              Try the Explore page.
            </Link>
          </p>
        )}
      </section>

      <section className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
        <div>
          <h2 className="text-3xl sm:text-4xl">Good ideas die alone.</h2>
          <p className="mt-3 text-lg text-ink-soft">
            In school, at work or in between, the hard part is rarely the idea.
            It's finding the person with the other half of the skills.
          </p>
        </div>
        <ul className="flex flex-col gap-3">
          {STUCK.map((line, index) => (
            <li
              key={line}
              className="flex items-start gap-4 rounded-card bg-surface p-5 text-lg"
            >
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent font-display font-semibold text-on-accent"
                aria-hidden
              >
                {index + 1}
              </span>
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-6 text-3xl sm:text-4xl">
          From first hello to shipped
        </h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className={cn(
                "flex min-h-56 flex-col rounded-card p-6 text-block-ink",
                step.tone,
              )}
            >
              <span className="font-display text-5xl font-semibold" aria-hidden>
                {index + 1}
              </span>
              <h3 className="mt-auto text-xl leading-snug">{step.title}</h3>
              <p className="mt-2 text-[0.95rem] text-block-ink/80">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid items-center gap-6 rounded-card bg-primary p-8 text-on-primary sm:p-12 lg:grid-cols-[1fr_auto]">
        <div>
          <BadgeCheck className="mb-4 size-10" aria-hidden />
          <h2 className="text-3xl sm:text-4xl">
            Your next teammate is already here.
          </h2>
          <p className="mt-3 max-w-xl text-lg opacity-85">
            Create a profile in two minutes. Post a project, or apply to one
            today.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink to="/register" size="lg" variant="accent">
            Create your profile
          </ButtonLink>
          <Link
            to="/verify"
            className="flex h-13 items-center rounded-full px-5 font-display font-semibold underline-offset-4 hover:underline"
          >
            Verify a contribution record
          </Link>
        </div>
      </section>
    </div>
  );
}
