import { Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";

import type { Project, UserSummary } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { StatusDot } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/feedback";

const CARD_BASE =
  "group flex flex-col overflow-hidden rounded-card border-2 border-transparent bg-surface " +
  "transition-[border-color,transform] duration-200 ease-out-soft hover:-translate-y-0.5 hover:border-ink active:translate-y-0 focus-visible:border-ink";
const CARD = `${CARD_BASE} h-full`;

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

/** Where the work happens. A place, never a credential. */
// eslint-disable-next-line react-refresh/only-export-components
export function placeLabel(
  project: Pick<Project, "city" | "remote_ok">,
): string {
  return project.city || (project.remote_ok ? "Remote" : "");
}

/** The opening paragraph: what the author chose to say first. */
function excerpt(text: string): string {
  return text.trim().split(/\n\s*\n/)[0] ?? "";
}

/**
 * The one "ask" on a card: who a team needs, or what a person is open to.
 * The answers are the only bold words, so they are what a scan lands on;
 * each stays on one line.
 */
function Ask({
  label,
  aside,
  items,
  max = 3,
  className,
}: {
  label: string;
  aside?: string;
  items: string[];
  max?: number;
  className?: string;
}) {
  if (items.length === 0) return null;
  const shown = items.slice(0, max);
  const extra = items.length - shown.length;
  return (
    <div
      className={cn(
        "rounded-xl bg-sunken px-3.5 py-2.5 text-[0.8125rem] text-ink-soft",
        className,
      )}
    >
      <p className="flex justify-between gap-3">
        <span>{label}</span>
        {aside && <span className="shrink-0">{aside}</span>}
      </p>
      <p className="mt-0.5 text-[0.9375rem] leading-snug">
        {shown.map((item, index) => (
          <Fragment key={item}>
            <span className="inline-block max-w-full truncate align-bottom font-semibold text-ink">
              {item}
              {index < shown.length - 1 && (
                <span className="font-normal text-ink-soft">,</span>
              )}
            </span>{" "}
          </Fragment>
        ))}
        {extra > 0 && <span>+{extra} more</span>}
      </p>
    </div>
  );
}

/** Who a team needs, with the open-seat count beside the label when given. */
export function LookingFor({
  roles,
  seats,
  className,
}: {
  roles: Project["open_roles"];
  seats?: string;
  className?: string;
}) {
  return (
    <Ask
      label="Looking for"
      aside={seats}
      items={roles.map((role) => role.title)}
      className={className}
    />
  );
}

interface ProjectCardProps {
  project: Project;
  footer?: ReactNode;
  /** When given, a plain click peeks at the project instead of leaving the list. */
  onPreview?: (id: string) => void;
}

/**
 * A project as a post in a feed: a preview of what its author wrote, not a
 * form with every slot filled. A picture appears only when the team uploaded
 * one; otherwise the words carry the card and it shows more of them. Nothing
 * is padded to a common height, so a card is as tall as what it has to say.
 */
export function ProjectCard({ project, footer, onPreview }: ProjectCardProps) {
  const seats = seatsLabel(project);
  const recruiting =
    project.open_roles.length > 0 && project.status !== "Completed";
  const place = placeLabel(project);
  const lead = excerpt(project.description);
  return (
    <Link
      to={`/projects/${project.id}`}
      className={CARD_BASE}
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
      {project.image_url && (
        <img
          src={project.image_url}
          alt=""
          loading="lazy"
          className="max-h-[26rem] min-h-32 w-full bg-sunken object-cover"
        />
      )}
      <div className="flex flex-col gap-2.5 p-5">
        <div className="flex items-center justify-between gap-3 text-[0.8125rem] text-ink-soft">
          <span className="flex min-w-0 items-center gap-1.5">
            <StatusDot status={project.status} />
            <span aria-hidden>·</span>
            <span className="truncate">{project.category}</span>
          </span>
          <time dateTime={project.created_at} className="shrink-0">
            {timeAgo(project.created_at)}
          </time>
        </div>

        <h3 className="line-clamp-3 text-xl leading-snug">{project.title}</h3>

        {project.subtitle && (
          <p className="line-clamp-3 text-[0.975rem] leading-snug">
            {project.subtitle}
          </p>
        )}
        {/* Without a picture the card is a text post, so it quotes more of it. */}
        {lead && (!project.image_url || !project.subtitle) && (
          <p
            className={cn(
              "text-[0.9375rem] leading-normal text-ink-soft",
              project.image_url ? "line-clamp-2" : "line-clamp-5",
            )}
          >
            {lead}
          </p>
        )}

        {recruiting && (
          <LookingFor
            roles={project.open_roles}
            seats={seats.text}
            className="mt-1"
          />
        )}

        <div className="mt-1 flex items-center justify-between gap-3 text-sm text-ink-soft">
          <span className="flex min-w-0 items-center gap-2">
            {project.owner && <Avatar user={project.owner} size="xs" />}
            <span className="truncate">
              {project.owner && (
                <span className="font-medium text-ink">
                  {project.owner.name}
                </span>
              )}
              {project.owner && place && " · "}
              {place}
            </span>
          </span>
          {/* Seats sit with the roles when there are any; a finished project
              already says so in its status. */}
          {!recruiting && project.status !== "Completed" && (
            <span
              className={cn("shrink-0", seats.open && "font-semibold text-ink")}
            >
              {seats.text}
            </span>
          )}
        </div>
        {footer}
      </div>
    </Link>
  );
}

/** Rough card height in rem, so the feed can balance columns before paint. */
// eslint-disable-next-line react-refresh/only-export-components
export function estimateProjectCard(project: Project): number {
  const lines = (text: string, perLine: number, max: number) =>
    Math.min(max, Math.ceil(text.length / perLine));
  let height = 8 + lines(project.title, 26, 3) * 1.7;
  if (project.image_url) height += 13;
  if (project.subtitle) height += lines(project.subtitle, 40, 3) * 1.4;
  if (!project.image_url || !project.subtitle)
    height +=
      lines(excerpt(project.description), 42, project.image_url ? 2 : 5) * 1.45;
  if (project.open_roles.length > 0 && project.status !== "Completed")
    height += 4.6;
  return height;
}

const SKELETON_LINES = [3, 1, 4, 2, 5, 2];

export function ProjectCardSkeleton({ index = 0 }: { index?: number }) {
  const lines = SKELETON_LINES[index % SKELETON_LINES.length];
  return (
    <div className="overflow-hidden rounded-card bg-surface">
      {index % 3 === 1 && <Skeleton className="h-44 w-full rounded-none" />}
      <div className="space-y-3 p-5">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-6 w-3/4" />
        <div className="space-y-2">
          {Array.from({ length: lines }, (_, line) => (
            <Skeleton
              key={line}
              className={cn("h-3.5", line === lines - 1 ? "w-2/3" : "w-full")}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="size-7 rounded-full" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
    </div>
  );
}

/**
 * A person by what they do and what they want next. Where they studied or
 * work is not on the card: it lives on their profile, as one fact among others.
 */
export function PersonCard({ person }: { person: UserSummary }) {
  const where = [person.city, person.availability].filter(Boolean).join(" · ");
  return (
    <Link to={`/u/${person.id}`} className={cn(CARD, "gap-3 p-5")}>
      <div className="flex items-center gap-3">
        <Avatar user={person} size="lg" />
        <div className="min-w-0">
          <h3 className="truncate text-lg leading-tight">{person.name}</h3>
          {where && (
            <p className="mt-0.5 truncate text-sm text-ink-soft">{where}</p>
          )}
        </div>
      </div>
      <p className="line-clamp-3 text-[0.975rem] leading-snug">
        {person.headline || "New to Oakie. Say hello!"}
      </p>
      {person.skills.length > 0 && (
        <p className="line-clamp-2 text-[0.9375rem] text-ink-soft">
          {/* The dot stays with the word before it when the line wraps. */}
          {person.skills.slice(0, 5).join("\u00a0· ")}
        </p>
      )}
      <Ask label="Open to" items={person.open_to} className="mt-auto" />
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
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-14 w-full rounded-xl" />
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
