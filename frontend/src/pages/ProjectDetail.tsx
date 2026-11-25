import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  Bell,
  BellRing,
  Check,
  GraduationCap,
  Heart,
  Hourglass,
  Lock,
  MailOpen,
  MapPin,
  Megaphone,
  Pencil,
  Share2,
  UserPlus,
  Wifi,
  X,
} from "lucide-react";

import { useAuth } from "@/auth/AuthProvider";
import { ApiError } from "@/lib/api";
import {
  useAnswerInvitation,
  useProject,
  useProjectReaction,
  useWithdrawApplication,
} from "@/lib/queries";
import type { ProjectDetail as Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Chip, StatusBadge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { ErrorState, PageSpinner } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { CategoryLabel, PersonLine } from "@/components/cards";
import { useTitle } from "@/components/page";
import { ProjectCover } from "@/components/ProjectCover";
import NotFound from "@/pages/NotFound";
import { ApplicationsTab } from "@/pages/project/ApplicationsTab";
import { ApplyDialog } from "@/pages/project/ApplyDialog";
import { InviteDialog } from "@/pages/project/InviteDialog";
import { BoardTab } from "@/pages/project/BoardTab";
import { OverviewTab } from "@/pages/project/OverviewTab";
import { TeamTab } from "@/pages/project/TeamTab";
import { UpdatesTab } from "@/pages/project/UpdatesTab";

/** Shown to someone the team invited: the answer is one click. */
function InvitationBanner({ project }: { project: Project }) {
  const answer = useAnswerInvitation();
  const toast = useToast();
  const invitation = project.viewer.invitation;
  if (!invitation) return null;
  const respond = (accept: boolean) =>
    answer.mutate(
      { projectId: project.id, accept },
      {
        onSuccess: () =>
          toast.success(
            accept ? `Welcome to ${project.title}` : "Invitation declined",
          ),
        onError: (error) => toast.error(error),
      },
    );
  return (
    <section className="mb-6 flex animate-rise flex-wrap items-center justify-between gap-4 rounded-card border-2 border-primary bg-primary-soft p-5 text-on-primary-soft">
      <div className="flex min-w-0 items-start gap-3">
        <MailOpen className="mt-0.5 size-6 shrink-0" aria-hidden />
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold">
            {invitation.inviter?.name ?? "The team"} invited you to join
            {invitation.role_title ? ` as ${invitation.role_title}` : ""}
          </p>
          {invitation.message && <p className="mt-1">“{invitation.message}”</p>}
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          loading={answer.isPending && answer.variables?.accept === false}
          onClick={() => respond(false)}
        >
          Decline
        </Button>
        <Button
          loading={answer.isPending && answer.variables?.accept === true}
          onClick={() => respond(true)}
        >
          <Check aria-hidden /> Accept and join
        </Button>
      </div>
    </section>
  );
}

/** Right after publishing: the three things that turn a page into a team. */
function NextSteps({
  project,
  onInvite,
  onShare,
  onDismiss,
}: {
  project: Project;
  onInvite: () => void;
  onShare: () => void;
  onDismiss: () => void;
}) {
  return (
    <section className="mb-6 animate-rise rounded-card bg-surface p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl">
            {project.title} is live. Now find your first teammate.
          </h2>
          <p className="mt-1 text-ink-soft">
            Projects that do these in the first day fill their seats much
            sooner.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Dismiss"
          onClick={onDismiss}
        >
          <X aria-hidden />
        </Button>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Button variant="outline" className="justify-start" onClick={onInvite}>
          <UserPlus aria-hidden /> Invite someone
        </Button>
        <ButtonLink
          to="?tab=updates"
          variant="outline"
          className="justify-start"
        >
          <Megaphone aria-hidden /> Post a first update
        </ButtonLink>
        <Button variant="outline" className="justify-start" onClick={onShare}>
          <Share2 aria-hidden /> Share the link
        </Button>
      </div>
    </section>
  );
}

type TabId = "overview" | "updates" | "team" | "board" | "applications";

function JoinAction({
  project,
  onApply,
}: {
  project: Project;
  onApply: () => void;
}) {
  const { viewer } = project;
  const withdraw = useWithdrawApplication(project.id);
  const toast = useToast();

  if (viewer.role) {
    return (
      <span className="flex h-11 items-center gap-2 rounded-full bg-primary-soft px-5 font-display font-semibold text-on-primary-soft">
        <Check className="size-4" aria-hidden />
        {viewer.role === "owner" ? "Your project" : "You're on the team"}
      </span>
    );
  }
  if (viewer.invitation) return null; // The invitation banner carries the answer buttons.
  if (viewer.application_status === "pending") {
    return (
      <span className="flex flex-wrap items-center gap-2">
        <span className="flex h-11 items-center gap-2 rounded-full bg-block-sun px-5 font-display font-semibold text-block-ink">
          <Hourglass className="size-4" aria-hidden /> Application sent
        </span>
        <Button
          variant="ghost"
          size="sm"
          loading={withdraw.isPending}
          onClick={() =>
            withdraw.mutate(undefined, {
              onSuccess: () => toast.success("Application withdrawn"),
              onError: (error) => toast.error(error),
            })
          }
        >
          Withdraw
        </Button>
      </span>
    );
  }
  if (project.status === "Completed") return null;
  if (project.current_members >= project.max_members) {
    return <Button disabled>Team is full</Button>;
  }
  return (
    <Button size="lg" onClick={onApply}>
      {viewer.application_status ? "Apply again" : "Apply to join"}
    </Button>
  );
}

export default function ProjectDetail() {
  const { id = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const [inviting, setInviting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { status } = useAuth();
  const toast = useToast();
  const query = useProject(id);
  const like = useProjectReaction(id, "like");
  const follow = useProjectReaction(id, "follow");
  const [applyRole, setApplyRole] = useState<string | null>(null);
  useTitle(query.data?.title);

  if (query.isPending) return <PageSpinner />;
  if (query.error instanceof ApiError && query.error.status === 404) {
    return (
      <NotFound title="We couldn't find that project">
        It may have been deleted, or it's private to its team.
      </NotFound>
    );
  }
  if (query.isError)
    return (
      <ErrorState error={query.error} onRetry={() => void query.refetch()} />
    );

  const project = query.data;
  const { viewer } = project;
  const isMember = viewer.role !== null;
  const canManage = viewer.role === "owner" || viewer.role === "admin";

  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "updates", label: "Updates" },
    { id: "team", label: `Team · ${project.current_members}` },
    ...(isMember ? [{ id: "board" as const, label: "Board" }] : []),
    ...(canManage
      ? [{ id: "applications" as const, label: "Applications" }]
      : []),
  ];
  const requested = params.get("tab") as TabId | null;
  const tab = tabs.some((candidate) => candidate.id === requested)
    ? requested!
    : "overview";

  function requireSignIn(action: () => void) {
    if (status === "signedIn") action();
    else
      navigate("/login", {
        state: { from: location.pathname + location.search },
      });
  }

  async function share() {
    const url = window.location.origin + location.pathname;
    try {
      if (navigator.share) await navigator.share({ title: project.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      // Share sheet dismissed: nothing to report.
    }
  }

  const dismissCreated = () =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete("created");
        return next;
      },
      { replace: true },
    );

  return (
    <>
      <InvitationBanner project={project} />
      {params.has("created") && canManage && (
        <NextSteps
          project={project}
          onInvite={() => setInviting(true)}
          onShare={() => void share()}
          onDismiss={dismissCreated}
        />
      )}
      <div className="relative h-20 overflow-hidden rounded-card sm:h-28">
        <ProjectCover project={project} columns={12} rows={2} />
      </div>

      <header className="mt-6 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <CategoryLabel category={project.category} />
            <StatusBadge status={project.status} />
            {project.visibility !== "public" && (
              <Chip tone="outline">
                <Lock className="size-3.5" aria-hidden />{" "}
                {project.visibility === "private"
                  ? "Private"
                  : "Team-only updates"}
              </Chip>
            )}
          </div>
          <h1 className="mt-3 text-4xl sm:text-5xl">{project.title}</h1>
          {project.subtitle && (
            <p className="mt-2 text-xl text-ink-soft">{project.subtitle}</p>
          )}
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[0.95rem] text-ink-soft">
            {project.uni && (
              <li className="flex items-center gap-1.5">
                <GraduationCap className="size-4" aria-hidden />
                {project.uni}
              </li>
            )}
            {project.city && (
              <li className="flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden />
                {project.city}
              </li>
            )}
            {project.remote_ok && (
              <li className="flex items-center gap-1.5">
                <Wifi className="size-4" aria-hidden />
                Remote friendly
              </li>
            )}
          </ul>
          {project.owner && (
            <div className="mt-5">
              <PersonLine
                person={project.owner}
                detail="Started this project"
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <JoinAction
            project={project}
            onApply={() => requireSignIn(() => setApplyRole(""))}
          />
          <Button
            variant="outline"
            aria-pressed={viewer.has_liked}
            aria-label={viewer.has_liked ? "Unlike" : "Like"}
            onClick={() =>
              requireSignIn(() =>
                like.mutate(!viewer.has_liked, {
                  onError: (error) => toast.error(error),
                }),
              )
            }
          >
            <Heart
              key={String(viewer.has_liked)}
              className={cn(
                viewer.has_liked && "animate-burst fill-accent text-accent",
              )}
              aria-hidden
            />
            {project.likes}
          </Button>
          <Button
            variant="outline"
            aria-pressed={viewer.is_following}
            onClick={() =>
              requireSignIn(() =>
                follow.mutate(!viewer.is_following, {
                  onError: (error) => toast.error(error),
                }),
              )
            }
          >
            {viewer.is_following ? (
              <BellRing aria-hidden />
            ) : (
              <Bell aria-hidden />
            )}
            {viewer.is_following ? "Following" : "Follow"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Share"
            onClick={() => void share()}
          >
            <Share2 aria-hidden />
          </Button>
          {canManage && (
            <ButtonLink
              to={`/projects/${project.id}/edit`}
              variant="outline"
              size="icon"
              aria-label="Edit project"
            >
              <Pencil aria-hidden />
            </ButtonLink>
          )}
        </div>
      </header>

      <nav
        aria-label="Project sections"
        className="-mx-4 mt-8 flex gap-1 overflow-x-auto border-b-2 border-line px-4 [scrollbar-width:none] sm:mx-0 sm:px-0"
      >
        {tabs.map(({ id: tabId, label }) => {
          const active = tabId === tab;
          return (
            <Link
              key={tabId}
              to={tabId === "overview" ? location.pathname : `?tab=${tabId}`}
              replace
              preventScrollReset
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-0.5 flex h-12 shrink-0 items-center border-b-[3px] px-4 font-display font-semibold transition-colors",
                active
                  ? "border-primary text-ink"
                  : "border-transparent text-ink-soft hover:text-ink",
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8" key={tab}>
        {tab === "overview" && (
          <OverviewTab
            project={project}
            onApply={(role) => requireSignIn(() => setApplyRole(role))}
          />
        )}
        {tab === "updates" && <UpdatesTab project={project} />}
        {tab === "team" && <TeamTab project={project} />}
        {tab === "board" && <BoardTab project={project} />}
        {tab === "applications" && <ApplicationsTab project={project} />}
      </div>

      <ApplyDialog
        project={project}
        role={applyRole}
        onClose={() => setApplyRole(null)}
      />
      {canManage && (
        <InviteDialog
          project={project}
          open={inviting}
          onOpenChange={setInviting}
        />
      )}
    </>
  );
}
