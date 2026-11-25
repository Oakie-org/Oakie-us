import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, MapPin, Users } from "lucide-react";

import type { Project, UserSummary } from "@/lib/types";
import { toneFor } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Chip, StatusDot, VerifiedMark } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/feedback";
import { ProjectCover } from "@/components/ProjectCover";

const CARD =
  "group flex h-full flex-col overflow-hidden rounded-card border-2 border-transparent bg-surface " +
  "transition-[border-color,transform] duration-200 ease-out-soft hover:-translate-y-0.5 hover:border-ink active:translate-y-0 focus-visible:border-ink";

export function CategoryLabel({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-display text-xs font-semibold tracking-wide text-ink-soft uppercase",
        className,
      )}
    >
      <span
        className={cn("size-2.5 rounded-[3px]", toneFor(category).bg)}
        aria-hidden
      />
      {category}
    </span>
  );
}

/** "3 seats open", "Team full", "Completed": the one fact that decides whether to click. */
// eslint-disable-next-line react-refresh/only-export-components
export function seatsLabel(
  project: Pick<Project, "status" | "max_members" | "current_members">,
): { text: string; open: boolean } {
  if (project.status === "Completed") return { text: "Completed", open: false };
  const open = Math.max(0, project.max_members - project.current_members);
  if (open === 0) return { text: "Team full", open: false };
  return { text: `${open} ${open === 1 ? "seat" : "seats"} open`, open: true };
}

interface ProjectCardProps {
  project: Project;
  footer?: ReactNode;
  /** When given, a plain click peeks at the project instead of leaving the list. */
  onPreview?: (id: string) => void;
}

/**
 * Information first: what it is, who it needs, where, and whether there is a
 * seat. Colour is limited to the small cover tile so a list can be scanned.
 */
export function ProjectCard({ project, footer, onPreview }: ProjectCardProps) {
  const seats = seatsLabel(project);
  const recruiting =
    project.open_roles.length > 0 && project.status !== "Completed";
  const place =
    project.uni || project.city || (project.remote_ok ? "Remote" : "");
  return (
    <Link
      to={`/projects/${project.id}`}
      className={cn(CARD, "gap-3 p-5")}
      onClick={(event) => {
        // Modified clicks keep their browser meaning (new tab, new window).
        if (
          !onPreview ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.button !== 0
        )
          return;
        event.preventDefault();
        onPreview(project.id);
      }}
    >
      <div className="flex items-start gap-3.5">
        <div className="size-12 shrink-0 overflow-hidden rounded-xl">
          <ProjectCover project={project} columns={2} rows={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[0.8125rem] text-ink-soft">
              {project.category}
            </span>
            <StatusDot status={project.status} />
          </div>
          <h3 className="mt-0.5 truncate text-lg leading-snug">
            {project.title}
          </h3>
        </div>
      </div>

      <p className="line-clamp-2 min-h-[2.85em] text-[0.95rem] leading-snug text-ink-soft">
        {project.subtitle || project.description}
      </p>

      <div className="min-h-[3.4rem]">
        {recruiting ? (
          <>
            <p className="text-xs font-semibold tracking-wide text-ink-soft uppercase">
              Looking for
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {project.open_roles.slice(0, 2).map((role) => (
                <Chip key={role.title}>{role.title}</Chip>
              ))}
              {project.open_roles.length > 2 && (
                <Chip tone="outline">+{project.open_roles.length - 2}</Chip>
              )}
            </div>
          </>
        ) : (
          project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-[1.4rem]">
              {project.tags.slice(0, 3).map((tag) => (
                <Chip key={tag} tone="outline">
                  {tag}
                </Chip>
              ))}
            </div>
          )
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3 text-sm text-ink-soft">
        <span className="flex min-w-0 items-center gap-1.5">
          {place && <MapPin className="size-4 shrink-0" aria-hidden />}
          <span className="truncate">{place}</span>
        </span>
        <span
          className={cn(
            "flex shrink-0 items-center gap-1.5",
            seats.open && "font-semibold text-ink",
          )}
        >
          <Users className="size-4" aria-hidden />
          {seats.text}
        </span>
      </div>
      {footer}
    </Link>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="space-y-4 rounded-card bg-surface p-5">
      <div className="flex items-center gap-3.5">
        <Skeleton className="size-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-3/4" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-7 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function PersonCard({ person }: { person: UserSummary }) {
  return (
    <Link to={`/u/${person.id}`} className={cn(CARD, "gap-3 p-5")}>
      <div className="flex items-center gap-3">
        <Avatar user={person} size="lg" />
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 text-lg leading-tight">
            <span className="truncate">{person.name}</span>
            {person.verified_school && <VerifiedMark />}
          </h3>
          {(person.uni || person.city) && (
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-soft">
              {person.uni ? (
                <GraduationCap className="size-4 shrink-0" aria-hidden />
              ) : (
                <MapPin className="size-4 shrink-0" aria-hidden />
              )}
              <span className="truncate">{person.uni || person.city}</span>
            </p>
          )}
        </div>
      </div>
      <p className="line-clamp-2 min-h-[2.9em] text-[0.95rem] text-ink-soft">
        {person.headline || "New to Oakie. Say hello!"}
      </p>
      <div className="mt-auto flex flex-wrap gap-1.5">
        {person.skills.slice(0, 3).map((skill) => (
          <Chip key={skill}>{skill}</Chip>
        ))}
        {person.skills.length > 3 && (
          <Chip tone="outline">+{person.skills.length - 3}</Chip>
        )}
      </div>
      {person.open_to.length > 0 && (
        <p className="border-t border-line pt-3 text-sm text-ink-soft">
          Open to{" "}
          <span className="font-medium text-ink">
            {person.open_to.slice(0, 2).join(", ")}
          </span>
        </p>
      )}
    </Link>
  );
}

export function PersonCardSkeleton() {
  return (
    <div className="space-y-4 rounded-card bg-surface p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="size-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-7 w-3/4" />
    </div>
  );
}

/** Compact person row used across lists (members, applicants, authors). */
export function PersonLine({
  person,
  detail,
  size = "md",
}: {
  person: UserSummary;
  detail?: ReactNode;
  size?: "sm" | "md";
}) {
  return (
    <Link
      to={`/u/${person.id}`}
      className="group flex min-w-0 items-center gap-3 rounded-xl"
    >
      <Avatar user={person} size={size} />
      <span className="min-w-0">
        <span className="flex items-center gap-1 font-display font-semibold">
          <span className="truncate group-hover:underline">{person.name}</span>
          {person.verified_school && <VerifiedMark />}
        </span>
        {detail !== undefined ? (
          <span className="block truncate text-sm text-ink-soft">{detail}</span>
        ) : (
          person.headline && (
            <span className="block truncate text-sm text-ink-soft">
              {person.headline}
            </span>
          )
        )}
      </span>
    </Link>
  );
}
