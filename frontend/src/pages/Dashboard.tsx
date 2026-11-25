import { Link } from "react-router-dom";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  FolderPlus,
  Hourglass,
  MailOpen,
  Sparkles,
} from "lucide-react";

import { useAuth } from "@/auth/AuthProvider";
import { profileStrength } from "@/lib/profile";
import {
  useAnswerInvitation,
  useFollowedProjects,
  useMyApplications,
  useMyInvitations,
  useProjects,
  useUserProjects,
} from "@/lib/queries";
import type { Application, ApplicationStatus, Invitation } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";
import { Chip } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ProjectPreview } from "@/components/ProjectPreview";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { ProjectFeed, ProjectFeedSkeleton } from "@/components/ProjectFeed";
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
    <li className="flex flex-wrap items-center justify-between gap-4 rounded-card border-2 border-primary bg-surface p-4 sm:p-5">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <MailOpen className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0">
          <p>
            <span className="font-semibold">
              {invitation.inviter?.name ?? "A team"}
            </span>{" "}
            invited you to join{" "}
            <Link
              to={`/projects/${invitation.project_id}`}
              className="font-display font-semibold underline-offset-2 hover:underline"
            >
              {invitation.project_title}
            </Link>
            {invitation.role_title && (
              <>
                {" "}
                as{" "}
                <span className="font-semibold">{invitation.role_title}</span>
              </>
            )}
          </p>
          {invitation.message && (
            <p className="mt-1 line-clamp-2 text-[0.95rem] text-ink-soft">
              “{invitation.message}”
            </p>
          )}
          <p className="mt-1 text-sm text-ink-soft">
            {timeAgo(invitation.created_at)}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          variant="ghost"
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

export default function Dashboard() {
  useTitle("Home");
  const { me } = useAuth();
  const mine = useUserProjects(me?.id);
  const applications = useMyApplications(Boolean(me));
  const followed = useFollowedProjects(Boolean(me));
  const fresh = useProjects({ open_only: true }, 6);
  const invitations = useMyInvitations(Boolean(me));
  const [previewing, setPreviewing] = useState<string | null>(null);

  if (!me) return <Skeleton className="h-40 rounded-card" />;

  const myIds = new Set(mine.data?.map((project) => project.id));
  const suggestions = (fresh.data?.pages[0]?.items ?? [])
    .filter((project) => !myIds.has(project.id))
    .slice(0, 3);
  const strength = profileStrength(me);
  const profileThin = strength.percent < 60;
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
                Your profile is {strength.percent}% there
              </p>
              <p className="text-block-ink/80">
                Next: {strength.next?.label.toLowerCase()}. {strength.next?.why}
              </p>
            </div>
          </div>
          <ButtonLink
            to={`/settings#${strength.next?.key ?? ""}`}
            variant="ink"
          >
            Continue
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
          className="mt-10"
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

      <Section title="Your projects" className="mt-10">
        {mine.isPending ? (
          <ProjectFeedSkeleton count={3} />
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
          <ProjectFeed
            projects={mine.data}
            footer={(project) => (
              <div className="mt-1 border-t border-line pt-3">
                <Chip tone={project.role === "owner" ? "primary" : "neutral"}>
                  {project.member_title || ROLE_LABEL[project.role]}
                </Chip>
              </div>
            )}
          />
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
          <ProjectFeed projects={followed.data!} />
        </Section>
      )}

      <Section
        title="Teams with open seats"
        action={
          <ButtonLink to="/explore?open=1" variant="ghost" size="sm">
            See all <ArrowRight aria-hidden />
          </ButtonLink>
        }
      >
        {fresh.isPending ? (
          <ProjectFeedSkeleton count={3} />
        ) : suggestions.length === 0 ? (
          <EmptyState icon={Hourglass} title="No open teams right now">
            Check back soon, or start one yourself.
          </EmptyState>
        ) : (
          <ProjectFeed projects={suggestions} onPreview={setPreviewing} />
        )}
      </Section>
      <ProjectPreview id={previewing} onClose={() => setPreviewing(null)} />
    </>
  );
}
