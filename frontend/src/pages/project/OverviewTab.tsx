import { Link } from "react-router-dom";
import { Eye, ImagePlus, MapPin } from "lucide-react";

import type { ProjectPart } from "@/lib/project";
import { useMembers } from "@/lib/queries";
import type { ProjectDetail } from "@/lib/types";
import { formatDate, pluralize } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Chip } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddPrompt, EditButton } from "@/components/ui/edit";
import { placeLabel, seatsLabel } from "@/components/cards";

const SEATS_SHOWN = 8;

/** The team as it is: a face per member, an empty outline per open seat. */
function Seats({ project }: { project: ProjectDetail }) {
  const members = useMembers(project.id);
  const people = (members.data ?? []).map((member) => member.user);
  const faces = people.slice(0, SEATS_SHOWN - 1);
  const open = Math.max(0, project.max_members - project.current_members);
  const empty = Math.min(open, SEATS_SHOWN - faces.length);
  const hidden = project.max_members - faces.length - empty;
  return (
    <div
      className="flex min-h-9 flex-wrap items-center gap-1.5"
      role="img"
      aria-label={`${project.current_members} of ${project.max_members} seats filled`}
    >
      {faces.map((person) => (
        <Avatar key={person.id} user={person} size="sm" />
      ))}
      {members.data &&
        Array.from({ length: empty }, (_, index) => (
          <span
            key={index}
            className="size-9 rounded-full border-2 border-dashed border-line"
          />
        ))}
      {members.data && hidden > 0 && (
        <span className="pl-1 text-sm text-ink-soft">+{hidden}</span>
      )}
    </div>
  );
}

const VISIBLE_TO = {
  public: "Public",
  members_only: "Team-only updates",
  private: "Private",
} as const;

export function OverviewTab({
  project,
  onApply,
  onEdit,
}: {
  project: ProjectDetail;
  onApply: (role: string) => void;
  /** Given to the people who manage the project: each part gets a pencil. */
  onEdit?: (part: ProjectPart) => void;
}) {
  const seats = seatsLabel(project);
  const canApply =
    !project.viewer.role &&
    !project.viewer.invitation &&
    project.viewer.application_status !== "pending" &&
    seats.open;
  const recruiting =
    project.open_roles.length > 0 && project.status !== "Completed";
  const facts = [
    ["Where", placeLabel(project)],
    ["Remote", project.city && project.remote_ok ? "Welcome" : ""],
    ["Community", project.uni],
    ["Posted", formatDate(project.created_at)],
    [
      "Following",
      project.follows ? pluralize(project.follows, "person", "people") : "",
    ],
  ].filter(([, value]) => value);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
      <div className="flex min-w-0 flex-col gap-6">
        {project.image_url ? (
          <div className="relative">
            <a
              href={project.image_url}
              target="_blank"
              rel="noreferrer"
              aria-label="Open the picture at full size"
              className="block overflow-hidden rounded-card bg-sunken"
            >
              <img
                src={project.image_url}
                alt=""
                className="max-h-[34rem] w-full object-contain"
              />
            </a>
            {onEdit && (
              <Button
                variant="ink"
                size="icon"
                className="absolute right-3 top-3"
                aria-label="Change the picture"
                title="Change the picture"
                onClick={() => onEdit("picture")}
              >
                <ImagePlus aria-hidden />
              </Button>
            )}
          </div>
        ) : (
          onEdit && (
            <AddPrompt
              label="Add a picture"
              why="A screenshot, a photo, a sketch. Optional: without one the card shows more of your words."
              onClick={() => onEdit("picture")}
            />
          )
        )}

        <section className="relative rounded-card bg-surface p-6 sm:p-8">
          {onEdit && (
            <EditButton
              label="Edit the story"
              onClick={() => onEdit("story")}
              className="absolute right-3 top-3 m-0"
            />
          )}
          <p
            className={
              onEdit
                ? "prose-plain pr-8 text-[1.0625rem]"
                : "prose-plain text-[1.0625rem]"
            }
          >
            {project.description}
          </p>
          {project.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-1.5">
              {project.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/explore?q=${encodeURIComponent(tag)}`}
                  className="rounded-full"
                >
                  <Chip className="transition-colors hover:bg-line">{tag}</Chip>
                </Link>
              ))}
            </div>
          )}
        </section>

        {recruiting && (
          <section className="rounded-card bg-surface px-6 pt-6 pb-2 sm:px-8">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl">
                Looking for{" "}
                <span className="font-sans text-base font-normal text-ink-soft">
                  {pluralize(project.open_roles.length, "role")}
                </span>
              </h2>
              {onEdit && (
                <EditButton
                  label="Edit roles and team size"
                  onClick={() => onEdit("roles")}
                />
              )}
            </div>
            <ul className="mt-2 divide-y divide-line">
              {project.open_roles.map((role) => (
                <li
                  key={role.title}
                  className="flex items-center justify-between gap-4 py-4"
                >
                  <div className="min-w-0">
                    <h3 className="text-lg leading-snug">{role.title}</h3>
                    {role.skills.length > 0 && (
                      <p className="mt-0.5 text-[0.9375rem] text-ink-soft">
                        {role.skills.join(" · ")}
                      </p>
                    )}
                  </div>
                  {canApply && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => onApply(role.title)}
                    >
                      Apply
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
        {onEdit && !recruiting && project.status !== "Completed" && (
          <AddPrompt
            label="Name the roles you need"
            why="Teams that name roles get far better applications."
            onClick={() => onEdit("roles")}
          />
        )}
      </div>

      <aside className="rounded-card bg-surface p-6 lg:sticky lg:top-24">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-xl">{seats.text}</h2>
          <Link
            to="?tab=team"
            replace
            className="text-sm font-semibold text-primary hover:underline"
          >
            Meet the team
          </Link>
        </div>
        <p className="mt-0.5 text-[0.9375rem] text-ink-soft">
          {project.current_members} of {project.max_members} on the team
        </p>
        <div className="mt-4">
          <Seats project={project} />
        </div>
        <dl className="mt-5 flex flex-col gap-2.5 border-t border-line pt-4 text-[0.9375rem]">
          {facts.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4">
              <dt className="shrink-0 text-ink-soft">{label}</dt>
              <dd className="min-w-0 text-right font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        {onEdit && (
          <div className="mt-4 flex flex-col gap-1 border-t border-line pt-3">
            <button
              type="button"
              onClick={() => onEdit("place")}
              className="flex min-h-11 items-center gap-2 rounded-xl px-2 text-left text-[0.9375rem] font-medium transition-colors hover:bg-sunken"
            >
              <MapPin className="size-4 text-ink-soft" aria-hidden />
              Edit where it happens
            </button>
            <button
              type="button"
              onClick={() => onEdit("visibility")}
              className="flex min-h-11 items-center gap-2 rounded-xl px-2 text-left text-[0.9375rem] font-medium transition-colors hover:bg-sunken"
            >
              <Eye className="size-4 text-ink-soft" aria-hidden />
              <span className="flex-1">Who can see it</span>
              <span className="font-normal text-ink-soft">
                {VISIBLE_TO[project.visibility]}
              </span>
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
