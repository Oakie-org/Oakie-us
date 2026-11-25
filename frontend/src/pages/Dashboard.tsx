import { Link } from "react-router-dom";
import { ArrowRight, FolderPlus, Hourglass, Sparkles } from "lucide-react";

import { useAuth } from "@/auth/AuthProvider";
import {
  useFollowedProjects,
  useMyApplications,
  useProjects,
  useUserProjects,
} from "@/lib/queries";
import type { Application, ApplicationStatus } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";
import { Chip } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { ProjectCard, ProjectCardSkeleton } from "@/components/cards";
import { Section, useTitle } from "@/components/page";

const APPLICATION_TONE: Record<ApplicationStatus, string> = {
  pending: "bg-block-sun text-block-ink",
  approved: "bg-primary text-on-primary",
  rejected: "bg-sunken text-ink-soft",
  withdrawn: "bg-sunken text-ink-soft",
};

const ROLE_LABEL = {
  owner: "You own this",
  admin: "Admin",
  member: "Member",
} as const;

function ApplicationRow({ application }: { application: Application }) {
  return (
    <li>
      <Link
        to={`/projects/${application.project_id}`}
        className="flex items-center justify-between gap-4 rounded-card border-2 border-transparent bg-surface p-4 transition-colors hover:border-ink"
      >
        <span className="min-w-0">
          <span className="block truncate font-display font-semibold">
            {application.project_title}
          </span>
          <span className="block truncate text-sm text-ink-soft">
            {application.role_title ? `${application.role_title} · ` : ""}
            applied {timeAgo(application.created_at)}
          </span>
        </span>
        <span
          className={cn(
            "flex h-7 shrink-0 items-center rounded-full px-3 font-display text-[0.8125rem] font-semibold capitalize",
            APPLICATION_TONE[application.status],
          )}
        >
          {application.status}
        </span>
      </Link>
    </li>
  );
}

export default function Dashboard() {
  useTitle("Home");
  const { me } = useAuth();
  const mine = useUserProjects(me?.id);
  const applications = useMyApplications(Boolean(me));
  const followed = useFollowedProjects(Boolean(me));
  const fresh = useProjects({ status: "Recruiting" }, 6);

  if (!me) return <Skeleton className="h-40 rounded-card" />;

  const myIds = new Set(mine.data?.map((project) => project.id));
  const suggestions = (fresh.data?.pages[0]?.items ?? [])
    .filter((project) => !myIds.has(project.id))
    .slice(0, 3);
  const profileThin = !me.headline || me.skills.length === 0;
  const firstName = me.name.split(" ")[0];

  return (
    <>
      <header>
        <h1 className="text-4xl sm:text-5xl">Hey, {firstName}</h1>
        <p className="mt-3 text-lg text-ink-soft">
          Here's what's moving across your teams.
        </p>
      </header>

      {profileThin && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-card bg-block-sun p-5 text-block-ink">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-6 shrink-0" aria-hidden />
            <div>
              <p className="font-display text-lg font-semibold">
                Teams can't find you yet
              </p>
              <p className="text-block-ink/80">
                Add a headline and a few skills so you show up when people
                search.
              </p>
            </div>
          </div>
          <ButtonLink to="/settings" variant="ink">
            Finish your profile
          </ButtonLink>
        </div>
      )}

      <Section title="Your projects" className="mt-10">
        {mine.isPending ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <ProjectCardSkeleton key={index} />
            ))}
          </div>
        ) : !mine.data?.length ? (
          <EmptyState
            icon={FolderPlus}
            title="You're not on a team yet"
            tone="bg-block-mint"
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <ButtonLink to="/projects/new">Start a project</ButtonLink>
                <ButtonLink to="/explore" variant="outline">
                  Find one to join
                </ButtonLink>
              </div>
            }
          >
            Post your own idea, or apply to a team that needs your skills.
          </EmptyState>
        ) : (
          <div className="stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {mine.data.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                footer={
                  <div className="mt-3 border-t border-line pt-3">
                    <Chip
                      tone={project.role === "owner" ? "primary" : "neutral"}
                    >
                      {project.member_title || ROLE_LABEL[project.role]}
                    </Chip>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </Section>

      {Boolean(applications.data?.length) && (
        <Section title="Your applications">
          <ul className="grid gap-3 lg:grid-cols-2">
            {applications.data!.map((application) => (
              <ApplicationRow
                key={application.project_id}
                application={application}
              />
            ))}
          </ul>
        </Section>
      )}

      {Boolean(followed.data?.length) && (
        <Section title="Projects you follow">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {followed.data!.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </Section>
      )}

      <Section
        title="Recruiting now"
        action={
          <ButtonLink to="/explore?status=Recruiting" variant="ghost" size="sm">
            See all <ArrowRight aria-hidden />
          </ButtonLink>
        }
      >
        {fresh.isPending ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <ProjectCardSkeleton key={index} />
            ))}
          </div>
        ) : suggestions.length === 0 ? (
          <EmptyState icon={Hourglass} title="No open teams right now">
            Check back soon, or start one yourself.
          </EmptyState>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {suggestions.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
