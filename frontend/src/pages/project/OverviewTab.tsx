import { Link } from "react-router-dom";
import { ArrowRight, Heart, Users } from "lucide-react";

import { useMembers } from "@/lib/queries";
import type { ProjectDetail } from "@/lib/types";
import { formatDate, pluralize } from "@/lib/utils";
import { AvatarStack } from "@/components/ui/avatar";
import { Chip } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function OverviewTab({
  project,
  onApply,
}: {
  project: ProjectDetail;
  onApply: (role: string) => void;
}) {
  const members = useMembers(project.id);
  const openSeats = Math.max(0, project.max_members - project.current_members);
  const canApply =
    !project.viewer.role &&
    project.viewer.application_status !== "pending" &&
    project.status !== "Completed" &&
    openSeats > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-6">
        <section className="rounded-card bg-surface p-6 sm:p-8">
          <h2 className="text-xl">About this project</h2>
          <p className="prose-plain mt-3 text-[1.05rem]">
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

        {project.open_roles.length > 0 && project.status !== "Completed" && (
          <section>
            <h2 className="mb-4 text-xl">Open roles</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {project.open_roles.map((role) => (
                <li
                  key={role.title}
                  className="flex flex-col gap-3 rounded-card bg-surface p-5"
                >
                  <h3 className="text-lg">{role.title}</h3>
                  {role.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {role.skills.map((skill) => (
                        <Chip key={skill} tone="primary">
                          {skill}
                        </Chip>
                      ))}
                    </div>
                  )}
                  {canApply && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-auto self-start"
                      onClick={() => onApply(role.title)}
                    >
                      Apply for this role <ArrowRight aria-hidden />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <aside className="flex flex-col gap-4">
        <section className="rounded-card bg-block-ink p-6 text-[#f6f5ef]">
          <p className="font-display text-5xl font-semibold">{openSeats}</p>
          <p className="mt-1 text-[#f6f5ef]/75">
            open {openSeats === 1 ? "seat" : "seats"} on a team of{" "}
            {project.max_members}
          </p>
          <div
            className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#f6f5ef]/20"
            role="img"
            aria-label={`${project.current_members} of ${project.max_members} seats filled`}
          >
            <div
              className="h-full rounded-full bg-accent"
              style={{
                width: `${Math.min(
                  100,
                  (project.current_members / project.max_members) * 100,
                )}%`,
              }}
            />
          </div>
        </section>

        <section className="rounded-card bg-surface p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg">Team</h2>
            <Link
              to="?tab=team"
              replace
              className="text-sm font-semibold text-primary hover:underline"
            >
              See everyone
            </Link>
          </div>
          <div className="mt-3">
            {members.data ? (
              <AvatarStack
                users={members.data.map((member) => member.user)}
                max={6}
              />
            ) : (
              <div className="h-9" />
            )}
          </div>
          <dl className="mt-5 flex flex-col gap-2.5 border-t border-line pt-4 text-[0.95rem]">
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-2 text-ink-soft">
                <Users className="size-4" aria-hidden /> Members
              </dt>
              <dd className="font-semibold">{project.current_members}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-2 text-ink-soft">
                <Heart className="size-4" aria-hidden /> Likes
              </dt>
              <dd className="font-semibold">{project.likes}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-ink-soft">
            {pluralize(project.follows, "follower")} · started{" "}
            {formatDate(project.created_at)}
          </p>
        </section>
      </aside>
    </div>
  );
}
