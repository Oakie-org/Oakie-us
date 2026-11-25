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
  MapPin,
  Pencil,
  Share2,
  Wifi,
} from "lucide-react";

import { useAuth } from "@/auth/AuthProvider";
import { ApiError } from "@/lib/api";
import {
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
import { BoardTab } from "@/pages/project/BoardTab";
import { OverviewTab } from "@/pages/project/OverviewTab";
import { TeamTab } from "@/pages/project/TeamTab";
import { UpdatesTab } from "@/pages/project/UpdatesTab";

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
  const [params] = useSearchParams();
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

  return (
    <>
      <div className="relative aspect-[2/1] overflow-hidden rounded-card sm:aspect-[3/1] lg:aspect-[4/1]">
        <ProjectCover project={project} />
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
              className={cn(viewer.has_liked && "fill-accent text-accent")}
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
    </>
  );
}
