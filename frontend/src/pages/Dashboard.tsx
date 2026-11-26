import { Link } from "react-router-dom";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

import { useAuth } from "@/auth/AuthProvider";
import {
  isBlankProfile,
  nextProfileLink,
  profileStrength,
} from "@/lib/profile";
import {
  useAnswerInvitation,
  useFollowedProjects,
  useMatches,
  useMyApplications,
  useMyInvitations,
  useProjects,
  useUserProjects,
} from "@/lib/queries";
import type {
  Application,
  ApplicationStatus,
  Invitation,
  Project,
} from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";
import { Chip, StatusDot } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { seatsLabel } from "@/components/cards";
import { ProjectPreview } from "@/components/ProjectPreview";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { ProjectFeed, ProjectFeedSkeleton } from "@/components/ProjectFeed";
import { Section, useTitle } from "@/components/page";

const APPLICATION_TONE: Record<ApplicationStatus, string> = {
  pending: "border border-line text-ink-soft",
  approved: "bg-primary text-on-primary",
  rejected: "border border-line text-ink-mute",
  withdrawn: "border border-line text-ink-mute",
};

const ROLE_LABEL = {
  owner: "You own this",
  admin: "Admin",
  member: "Member",
} as const;

const ROW =
  "flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-sunken";

function ApplicationRow({ application }: { application: Application }) {
  return (
    <li>
      <Link to={`/projects/${application.project_id}`} className={ROW}>
        <span className="min-w-0">
          <span className="block truncate font-medium">
            {application.project_title}
          </span>
          <span className="block truncate text-sm text-ink-soft">
            {application.role_title ? `${application.role_title} · ` : ""}
            applied {timeAgo(application.created_at)}
          </span>
        </span>
        <span
          className={cn(
            "flex h-7 shrink-0 items-center rounded-chip px-2.5 text-[0.8125rem] font-medium capitalize",
            APPLICATION_TONE[application.status],
          )}
        >
          {application.status}
        </span>
      </Link>
    </li>
  );
}

/** A followed project as one line: the viewer already knows what it is. */
function FollowedRow({ project }: { project: Project }) {
  return (
    <li>
      <Link to={`/projects/${project.id}`} className={ROW}>
        <span className="min-w-0">
          <span className="block truncate font-medium">{project.title}</span>
          <span className="flex items-center gap-1.5 text-sm text-ink-soft">
            <StatusDot status={project.status} className="text-sm" />
            {project.status !== "Completed" && (
              <>
                <span aria-hidden>·</span>
                <span className="truncate">{seatsLabel(project).text}</span>
              </>
            )}
          </span>
        </span>
        <ArrowRight className="size-4 shrink-0 text-ink-mute" aria-hidden />
      </Link>
    </li>
  );
}

function InvitationRow({ invitation }: { invitation: Invitation }) {
  const answer = useAnswerInvitation();
  const toast = useToast();
  const respond = (accept: boolean) =>
    answer.mutate(
      { projectId: invitation.project_id, accept },
      {
        onSuccess: () =>
          toast.success(
            accept
              ? `You joined ${invitation.project_title}`
              : "Invitation declined",
          ),
        onError: (error) => toast.error(error),
      },
    );
  return (
    <li className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className="mt-2 size-2 shrink-0 rounded-full bg-accent"
          aria-hidden
        />
        <div className="min-w-0">
          <p>
            <span className="font-medium">
              {invitation.inviter?.name ?? "A team"}
            </span>{" "}
            invited you to join{" "}
            <Link
              to={`/projects/${invitation.project_id}`}
              className="font-medium underline-offset-4 hover:underline"
            >
              {invitation.project_title}
            </Link>
            {invitation.role_title && (
              <>
                {" "}
                as <span className="font-medium">{invitation.role_title}</span>
              </>
            )}
          </p>
          {invitation.message && (
            <p className="mt-1 line-clamp-2 text-[0.9375rem] text-ink-soft">
              “{invitation.message}”
            </p>
          )}
          <p className="mt-1 text-[0.8125rem] text-ink-mute">
            {timeAgo(invitation.created_at)}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2 pl-5 sm:pl-0">
        <Button
          variant="outline"
          size="sm"
          loading={answer.isPending && answer.variables?.accept === false}
          onClick={() => respond(false)}
        >
          Decline
        </Button>
        <Button
          size="sm"
          loading={answer.isPending && answer.variables?.accept === true}
          onClick={() => respond(true)}
        >
          <Check aria-hidden /> Accept
        </Button>
      </div>
    </li>
  );
}

const LIST =
  "divide-y divide-line overflow-hidden rounded-card border border-line bg-surface";

export default function Dashboard() {
  useTitle("Home");
  const { me } = useAuth();
  const mine = useUserProjects(me?.id);
  const applications = useMyApplications(Boolean(me));
  const followed = useFollowedProjects(Boolean(me));
  const fresh = useProjects({ open_only: true }, 6);
  const invitations = useMyInvitations(Boolean(me));
  const matches = useMatches(Boolean(me?.skills.length), 3);
  const [previewing, setPreviewing] = useState<string | null>(null);

  if (!me) return <Skeleton className="h-40 rounded-card" />;

  const myIds = new Set(mine.data?.map((project) => project.id));
  const suggestions = (fresh.data?.pages[0]?.items ?? [])
    .filter((project) => !myIds.has(project.id))
    .slice(0, 3);
  const matched = matches.data ?? [];
  const strength = profileStrength(me);
  const profileThin = strength.percent < 60;
  const blank = isBlankProfile(me);
  const hasApplications = Boolean(applications.data?.length);
  const hasFollowed = Boolean(followed.data?.length);
  // Applications and follows are short lists, so they sit beside the feeds
  // instead of each taking a row of the page to themselves.
  const aside = hasApplications || hasFollowed;
  const columns = aside ? 2 : 3;

  return (
    <>
      <h1 className="text-3xl leading-tight sm:text-4xl">Home</h1>

      {profileThin && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-card border border-line bg-surface p-4 sm:p-5">
          <div>
            <p className="font-medium">
              {blank
                ? "Tell teams who you are"
                : `Your profile is ${strength.percent}% there`}
            </p>
            <p className="mt-0.5 text-ink-soft">
              {blank
                ? "Three quick questions, about a minute. Then this page shows the projects that need you."
                : `Next: ${strength.next?.label.toLowerCase()}. ${strength.next
                    ?.why}`}
            </p>
          </div>
          <ButtonLink to={nextProfileLink(me) ?? `/u/${me.id}`}>
            {blank ? "Get started" : "Continue"}
          </ButtonLink>
        </div>
      )}

      {Boolean(invitations.data?.length) && (
        <Section
          title={
            invitations.data!.length === 1
              ? "You have an invitation"
              : `You have ${invitations.data!.length} invitations`
          }
          className="mt-8"
        >
          <ul className="flex flex-col gap-3">
            {invitations.data!.map((invitation) => (
              <InvitationRow
                key={invitation.project_id}
                invitation={invitation}
              />
            ))}
          </ul>
        </Section>
      )}

      <div
        className={cn(
          "mt-10 grid gap-10",
          aside && "lg:grid-cols-[minmax(0,1fr)_20rem]",
        )}
      >
        <div className="min-w-0">
          <Section title="Your projects" className="mt-0">
            {mine.isPending ? (
              <ProjectFeedSkeleton count={columns} />
            ) : !mine.data?.length ? (
              <EmptyState
                title="You're not on a team yet"
                action={
                  <div className="flex flex-wrap gap-3">
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
              <ProjectFeed
                projects={mine.data}
                maxColumns={columns}
                footer={(project) => (
                  <div className="mt-1 border-t border-line pt-3">
                    <Chip
                      tone={project.role === "owner" ? "primary" : "neutral"}
                    >
                      {project.member_title || ROLE_LABEL[project.role]}
                    </Chip>
                  </div>
                )}
              />
            )}
          </Section>

          {matched.length > 0 ? (
            <Section
              title="Teams looking for your skills"
              action={
                <ButtonLink to="/explore?open=1" variant="ghost" size="sm">
                  See all open teams <ArrowRight aria-hidden />
                </ButtonLink>
              }
            >
              <ProjectFeed
                projects={matched}
                maxColumns={columns}
                onPreview={setPreviewing}
                footer={(project) => (
                  <p className="text-[0.8125rem] text-ink-soft">
                    Wants your{" "}
                    <span className="font-medium text-ink">
                      {project.matched_skills.join(", ")}
                    </span>
                  </p>
                )}
              />
            </Section>
          ) : (
            <Section
              title="Teams with open seats"
              action={
                <ButtonLink to="/explore?open=1" variant="ghost" size="sm">
                  See all <ArrowRight aria-hidden />
                </ButtonLink>
              }
            >
              {fresh.isPending ? (
                <ProjectFeedSkeleton count={columns} />
              ) : suggestions.length === 0 ? (
                <EmptyState title="No open teams right now">
                  Check back soon, or start one yourself.
                </EmptyState>
              ) : (
                <ProjectFeed
                  projects={suggestions}
                  maxColumns={columns}
                  onPreview={setPreviewing}
                />
              )}
            </Section>
          )}
        </div>

        {aside && (
          <aside className="flex min-w-0 flex-col gap-10">
            {hasApplications && (
              <Section title="Your applications" className="mt-0">
                <ul className={LIST}>
                  {applications.data!.map((application) => (
                    <ApplicationRow
                      key={application.project_id}
                      application={application}
                    />
                  ))}
                </ul>
              </Section>
            )}
            {hasFollowed && (
              <Section title="Projects you follow" className="mt-0">
                <ul className={LIST}>
                  {followed.data!.map((project) => (
                    <FollowedRow key={project.id} project={project} />
                  ))}
                </ul>
              </Section>
            )}
          </aside>
        )}
      </div>
      <ProjectPreview id={previewing} onClose={() => setPreviewing(null)} />
    </>
  );
}
