import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Heart, MapPin, Users } from "lucide-react";

import type { Project, UserSummary } from "@/lib/types";
import { toneFor } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Chip, StatusBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/feedback";
import { ProjectCover } from "@/components/ProjectCover";

const CARD =
  "group flex h-full flex-col overflow-hidden rounded-card border-2 border-transparent bg-surface " +
  "transition-[border-color,transform] duration-200 ease-out-soft hover:-translate-y-1 hover:border-ink focus-visible:border-ink";

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

export function ProjectCard({
  project,
  footer,
}: {
  project: Project;
  footer?: ReactNode;
}) {
  const openSeats = Math.max(0, project.max_members - project.current_members);
  return (
    <Link to={`/projects/${project.id}`} className={CARD}>
      <div className="relative aspect-[2/1] overflow-hidden">
        <ProjectCover
          project={project}
          className="transition-transform duration-500 ease-out-soft group-hover:scale-[1.04]"
        />
        <StatusBadge
          status={project.status}
          className="absolute left-3 top-3"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <CategoryLabel category={project.category} />
        <h3 className="text-xl leading-snug">{project.title}</h3>
        {project.subtitle && (
          <p className="line-clamp-2 text-[0.95rem] text-ink-soft">
            {project.subtitle}
          </p>
        )}
        {project.open_roles.length > 0 && project.status !== "Completed" && (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {project.open_roles.slice(0, 2).map((role) => (
              <Chip key={role.title} tone="primary">
                {role.title}
              </Chip>
            ))}
            {project.open_roles.length > 2 && (
              <Chip tone="outline">+{project.open_roles.length - 2}</Chip>
            )}
          </div>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 pt-3 text-sm text-ink-soft">
          <span className="flex min-w-0 items-center gap-1.5">
            <MapPin className="size-4 shrink-0" aria-hidden />
            <span className="truncate">
              {project.uni || project.city || "Remote"}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-3">
            <span
              className="flex items-center gap-1"
              title={`${openSeats} open ${openSeats === 1 ? "seat" : "seats"}`}
            >
              <Users className="size-4" aria-hidden />
              <span className="sr-only">Team size</span>
              {project.current_members}/{project.max_members}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="size-4" aria-hidden />
              <span className="sr-only">Likes</span>
              {project.likes}
            </span>
          </span>
        </div>
        {footer}
      </div>
    </Link>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card bg-surface">
      <Skeleton className="aspect-[2/1] rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

export function PersonCard({ person }: { person: UserSummary }) {
  return (
    <Link to={`/u/${person.id}`} className={cn(CARD, "gap-3 p-5")}>
      <div className="flex items-center gap-3">
        <Avatar user={person} size="lg" />
        <div className="min-w-0">
          <h3 className="truncate text-lg leading-tight">{person.name}</h3>
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
        <span className="block truncate font-display font-semibold group-hover:underline">
          {person.name}
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
