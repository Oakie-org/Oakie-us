import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowUpRight, X } from "lucide-react";

import { useAuth } from "@/auth/AuthProvider";
import { useMembers, useProject } from "@/lib/queries";
import type { ProjectDetail } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { Avatar, AvatarStack } from "@/components/ui/avatar";
import { Chip, StatusDot } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { ErrorState, Skeleton } from "@/components/ui/feedback";
import { Drawer, DrawerClose } from "@/components/ui/overlay";
import { placeLabel, seatsLabel } from "@/components/cards";
import { ApplyDialog } from "@/pages/project/ApplyDialog";

function Body({
  project,
  onApply,
}: {
  project: ProjectDetail;
  onApply: (role: string) => void;
}) {
  const members = useMembers(project.id);
  const seats = seatsLabel(project);
  const { viewer } = project;
  const canApply =
    !viewer.role &&
    !viewer.invitation &&
    viewer.application_status !== "pending" &&
    seats.open;
  const page = `/projects/${project.id}`;

  return (
    <>
      <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6 sm:px-7">
        {project.image_url && (
          <img
            src={project.image_url}
            alt=""
            className="mb-5 max-h-64 w-full rounded-2xl bg-sunken object-cover"
          />
        )}
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-soft">
          <StatusDot status={project.status} />
          <span aria-hidden>·</span>
          {project.category}
        </p>
        <h2 className="mt-1.5 text-2xl leading-tight">{project.title}</h2>
        {project.subtitle && (
          <p className="mt-2 text-lg leading-snug text-ink-soft">
            {project.subtitle}
          </p>
        )}

        <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.9375rem] text-ink-soft">
          {project.owner && (
            <Link
              to={`/u/${project.owner.id}`}
              className="group flex items-center gap-2 rounded-full"
            >
              <Avatar user={project.owner} size="xs" />
              <span className="font-medium text-ink group-hover:underline">
                {project.owner.name}
              </span>
            </Link>
          )}
          {project.owner && <span aria-hidden>·</span>}
          <span>posted {timeAgo(project.created_at)}</span>
          {placeLabel(project) && (
            <>
              <span aria-hidden>·</span>
              <span>{placeLabel(project)}</span>
            </>
          )}
        </p>

        <p className="prose-plain mt-5 line-clamp-[10] text-[0.975rem]">
          {project.description}
        </p>
        {project.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <Chip key={tag} tone="outline">
                {tag}
              </Chip>
            ))}
          </div>
        )}

        <section className="mt-6 rounded-2xl bg-surface px-4">
          <div className="flex items-center justify-between gap-4 py-4">
            <div>
              <h3 className="text-lg">{seats.text}</h3>
              <p className="text-sm text-ink-soft">
                {project.current_members} of {project.max_members} on the team
                {project.uni && ` · ${project.uni}`}
              </p>
            </div>
            {members.data && (
              <AvatarStack
                users={members.data.map((member) => member.user)}
                max={4}
              />
            )}
          </div>
          {project.open_roles.length > 0 && project.status !== "Completed" && (
            <ul className="divide-y divide-line border-t border-line">
              {project.open_roles.map((role) => (
                <li
                  key={role.title}
                  className="flex items-center justify-between gap-3 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="font-display font-semibold">{role.title}</p>
                    {role.skills.length > 0 && (
                      <p className="mt-0.5 truncate text-sm text-ink-soft">
                        {role.skills.join(" · ")}
                      </p>
                    )}
                  </div>
                  {canApply && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onApply(role.title)}
                    >
                      Apply
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <footer className="flex items-center gap-2 border-t border-line bg-paper px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-7">
        {viewer.role ? (
          <ButtonLink to={page} size="lg" className="flex-1">
            Open your project
          </ButtonLink>
        ) : viewer.invitation ? (
          <ButtonLink to={page} size="lg" className="flex-1">
            Answer your invitation
          </ButtonLink>
        ) : viewer.application_status === "pending" ? (
          <Button size="lg" className="flex-1" disabled>
            Application sent
          </Button>
        ) : seats.open ? (
          <Button size="lg" className="flex-1" onClick={() => onApply("")}>
            Apply to join
          </Button>
        ) : (
          <Button size="lg" className="flex-1" disabled>
            {seats.text}
          </Button>
        )}
        <ButtonLink to={page} variant="outline" size="lg">
          Full page <ArrowUpRight aria-hidden />
        </ButtonLink>
      </footer>
    </>
  );
}

/**
 * Peek at a project without leaving the list. The open project lives in the
 * URL (`?preview=<id>`), so Back closes it and the link can be shared.
 */
export function ProjectPreview({
  id,
  onClose,
}: {
  id: string | null;
  onClose: () => void;
}) {
  const query = useProject(id ?? "");
  const { status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [applyRole, setApplyRole] = useState<string | null>(null);

  function apply(role: string) {
    if (status === "signedIn") setApplyRole(role);
    else
      navigate("/login", {
        state: { from: location.pathname + location.search },
      });
  }

  return (
    <Drawer
      open={id !== null}
      onOpenChange={(open) => !open && onClose()}
      label={query.data?.title ?? "Project preview"}
    >
      <div className="flex items-center justify-between px-3 pt-3 sm:px-5">
        {id && (
          <Link
            to={`/projects/${id}`}
            className="flex h-9 items-center gap-1 rounded-full px-3 text-sm font-semibold text-ink-soft hover:bg-sunken hover:text-ink"
          >
            Open full page <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        )}
        <DrawerClose
          aria-label="Close preview"
          className="flex size-11 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-sunken hover:text-ink"
        >
          <X className="size-5" aria-hidden />
        </DrawerClose>
      </div>
      {query.isError ? (
        <div className="p-6">
          <ErrorState
            error={query.error}
            onRetry={() => void query.refetch()}
          />
        </div>
      ) : !id || !query.data ? (
        <div className="flex-1 space-y-4 px-5 sm:px-7" aria-busy>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : (
        <>
          <Body project={query.data} onApply={apply} />
          <ApplyDialog
            project={query.data}
            role={applyRole}
            onClose={() => setApplyRole(null)}
          />
        </>
      )}
    </Drawer>
  );
}
