import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { useProjects, useStats } from "@/lib/queries";
import type { Project } from "@/lib/types";
import { compact, timeAgo } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { placeLabel } from "@/components/cards";
import { ProjectFeed, ProjectFeedSkeleton } from "@/components/ProjectFeed";
import { useTitle } from "@/components/page";

const STEPS = [
  {
    title: "Publish what you're building",
    body: "An app, a fund, a film, a zine, an event. Say what exists today and which seats are open.",
  },
  {
    title: "Match across disciplines",
    body: "Search people by skill and city. Engineers meet quants, writers meet editors, founders meet co-founders.",
  },
  {
    title: "Build in one shared space",
    body: "A timeline for progress, a board for tasks, a roster that shows who owns what.",
  },
  {
    title: "Leave with proof",
    body: "Every member earns a verifiable contribution record to put on a résumé or an application.",
  },
];

const STUCK = [
  "You have a quant strategy that works on paper, and no one to write the code.",
  "You have a script people would share, and no one who can shoot and cut it.",
  "You have the idea that could become a company, and you're building it alone.",
];

interface Seat {
  role: string;
  project: Project;
}

/** One row per open role, newest project first: what a visitor could join today. */
function openSeats(projects: Project[], max: number): Seat[] {
  return projects
    .filter((project) => project.status !== "Completed")
    .flatMap((project) =>
      project.open_roles.map((role) => ({ role: role.title, project })),
    )
    .slice(0, max);
}

/** The hero's picture is the product's own content: seats that are open now. */
function OpenSeats({ seats }: { seats: Seat[] }) {
  return (
    <section
      aria-labelledby="open-seats"
      className="overflow-hidden rounded-card border border-line bg-surface"
    >
      <div className="flex items-baseline justify-between gap-4 px-5 pb-3 pt-4">
        <h2 id="open-seats" className="font-sans text-sm text-ink-soft">
          Open seats right now
        </h2>
        <Link
          to="/explore?open=1"
          className="text-sm font-medium underline-offset-4 hover:underline"
        >
          See all
        </Link>
      </div>
      <ul>
        {seats.map(({ role, project }) => (
          <li key={`${project.id}:${role}`} className="border-t border-line">
            <Link
              to={`/projects/${project.id}`}
              className="flex items-baseline justify-between gap-4 px-5 py-3 transition-colors hover:bg-sunken"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{role}</span>
                <span className="block truncate text-sm text-ink-soft">
                  {[project.title, placeLabel(project)]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
              <time
                dateTime={project.created_at}
                className="shrink-0 text-[0.8125rem] text-ink-mute"
              >
                {timeAgo(project.created_at)}
              </time>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Stat({ value, label }: { value: number | undefined; label: string }) {
  return (
    <div>
      <dd className="text-3xl font-medium tabular-nums">
        {value === undefined ? "–" : compact.format(value)}
      </dd>
      <dt className="mt-1 text-sm text-ink-soft">{label}</dt>
    </div>
  );
}

export default function Landing() {
  useTitle(undefined);
  const { data: stats } = useStats();
  const featured = useProjects({}, 6);
  const projects = featured.data?.pages[0]?.items ?? [];
  const seats = openSeats(projects, 5);

  return (
    <div className="flex flex-col gap-16 sm:gap-24">
      <section className="grid items-center gap-10 pt-4 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-16 lg:pt-12">
        <div className="animate-rise">
          <h1 className="max-w-[16ch] text-[2.5rem] leading-[1.05] tracking-[-0.02em] sm:text-6xl">
            Find the teammates your project is missing
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg text-ink-soft">
            Post what you're building and which seats are open. People with the
            skills you lack apply, you build it together, and everyone leaves
            with a contribution record anyone can verify.
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
        {seats.length > 0 && <OpenSeats seats={seats} />}
      </section>

      <section aria-label="Oakie in numbers">
        <dl className="grid grid-cols-2 gap-x-8 gap-y-6 border-y border-line py-6 lg:grid-cols-4">
          <Stat value={stats?.projects} label="Projects" />
          <Stat value={stats?.members} label="Members" />
          <Stat value={stats?.teammates_matched} label="Teammates matched" />
          <Stat value={stats?.applications} label="Applications sent" />
        </dl>
      </section>

      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-3xl leading-tight">Recently posted</h2>
          <Link
            to="/explore"
            className="flex items-center gap-1.5 font-medium underline-offset-4 hover:underline"
          >
            See all projects <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        {featured.isPending ? (
          <ProjectFeedSkeleton count={3} />
        ) : (
          <ProjectFeed projects={projects} />
        )}
        {featured.isError && (
          <p className="rounded-card border border-line bg-surface p-5 text-ink-soft">
            Projects couldn't be loaded right now.{" "}
            <Link to="/explore" className="font-medium text-ink underline">
              Try the Explore page
            </Link>
          </p>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-16">
        <div>
          <h2 className="text-3xl leading-tight">Who it's for</h2>
          <p className="mt-3 max-w-[30rem] text-ink-soft">
            In school, at work or in between, the hard part is rarely the idea.
            It's finding the person with the other half of the skills.
          </p>
        </div>
        <ul className="border-b border-line">
          {STUCK.map((line) => (
            <li key={line} className="border-t border-line py-4 text-lg">
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-6 text-3xl leading-tight">How it works</h2>
        <ol className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="border-t border-ink pt-4">
              <span className="text-sm text-ink-mute tabular-nums" aria-hidden>
                {index + 1}
              </span>
              <h3 className="mt-2 text-lg leading-snug">{step.title}</h3>
              <p className="mt-2 text-[0.9375rem] text-ink-soft">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-6 rounded-card border border-line bg-surface p-6 sm:p-8">
        <div>
          <h2 className="text-3xl leading-tight">Start with a profile</h2>
          <p className="mt-2 max-w-xl text-ink-soft">
            Create a profile in two minutes. Post a project, or apply to one
            today.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <ButtonLink to="/register" size="lg">
            Create your profile
          </ButtonLink>
          <Link
            to="/verify"
            className="font-medium underline-offset-4 hover:underline"
          >
            Verify a contribution record
          </Link>
        </div>
      </section>
    </div>
  );
}
