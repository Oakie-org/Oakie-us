import { Check, X } from "lucide-react";

import { useApplications, useDecideApplication } from "@/lib/queries";
import type { Application, ProjectDetail, UserSummary } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";
import { Chip } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { PersonLine } from "@/components/cards";

const RESOLVED_TONE = {
  approved: "bg-primary text-on-primary",
  rejected: "border border-line text-ink-mute",
  withdrawn: "border border-line text-ink-mute",
  pending: "border border-line text-ink-soft",
} as const;

/**
 * What the applicant's profile says, read against what this project asked
 * for: the skills its open roles name come first, so the decision does not
 * need a trip to the profile.
 */
function ApplicantFacts({
  person,
  project,
}: {
  person: UserSummary;
  project: ProjectDetail;
}) {
  const wanted = new Set(
    project.open_roles.flatMap((role) =>
      role.skills.map((skill) => skill.toLowerCase()),
    ),
  );
  const matching = person.skills.filter((skill) =>
    wanted.has(skill.toLowerCase()),
  );
  const other = person.skills.filter(
    (skill) => !wanted.has(skill.toLowerCase()),
  );
  if (person.skills.length === 0 && !person.city && !person.availability)
    return null;
  return (
    <dl className="grid gap-x-4 gap-y-1 text-[0.9375rem] sm:grid-cols-[auto_1fr]">
      {matching.length > 0 && (
        <>
          <dt className="text-ink-soft">Skills you asked for</dt>
          <dd className="font-medium">{matching.join(", ")}</dd>
        </>
      )}
      {other.length > 0 && (
        <>
          <dt className="text-ink-soft">
            {matching.length > 0 ? "Also" : "Skills"}
          </dt>
          <dd>{other.slice(0, 8).join(", ")}</dd>
        </>
      )}
      {person.availability && (
        <>
          <dt className="text-ink-soft">Can give</dt>
          <dd>{person.availability}</dd>
        </>
      )}
      {person.city && (
        <>
          <dt className="text-ink-soft">Based in</dt>
          <dd>{person.city}</dd>
        </>
      )}
    </dl>
  );
}

function ApplicationCard({
  application,
  project,
}: {
  application: Application;
  project: ProjectDetail;
}) {
  const decide = useDecideApplication(project.id);
  const toast = useToast();
  const pending = application.status === "pending";
  const full = project.current_members >= project.max_members;
  const name = application.applicant?.name ?? "This applicant";

  const resolve = (approve: boolean) =>
    decide.mutate(
      { applicantId: application.applicant_id, approve },
      {
        onSuccess: () =>
          toast.success(
            approve ? `${name} joined the team` : "Application declined",
          ),
        onError: (error) => toast.error(error),
      },
    );

  return (
    <li className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {application.applicant ? (
          <PersonLine person={application.applicant} />
        ) : (
          <span className="font-medium">Former member</span>
        )}
        {pending ? (
          <span className="text-sm text-ink-soft">
            {timeAgo(application.created_at)}
          </span>
        ) : (
          <span
            className={cn(
              "flex h-7 items-center rounded-chip px-2.5 text-[0.8125rem] font-medium capitalize",
              RESOLVED_TONE[application.status],
            )}
          >
            {application.status}
          </span>
        )}
      </div>
      {application.role_title && (
        <div>
          <Chip tone="primary">{application.role_title}</Chip>
        </div>
      )}
      <p className="prose-plain rounded-field bg-sunken p-4">
        {application.message}
      </p>
      {pending && application.applicant && (
        <ApplicantFacts person={application.applicant} project={project} />
      )}
      {pending && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            loading={decide.isPending && decide.variables?.approve}
            disabled={decide.isPending || full}
            onClick={() => resolve(true)}
          >
            <Check aria-hidden /> Welcome to the team
          </Button>
          <Button
            variant="outline"
            loading={decide.isPending && !decide.variables?.approve}
            disabled={decide.isPending}
            onClick={() => resolve(false)}
          >
            <X aria-hidden /> Decline
          </Button>
          {full && (
            <p className="text-sm text-ink-soft">
              Your team is full. Raise the team size to accept more people.
            </p>
          )}
        </div>
      )}
    </li>
  );
}

export function ApplicationsTab({ project }: { project: ProjectDetail }) {
  const applications = useApplications(project.id, true);

  if (applications.isError)
    return (
      <ErrorState
        error={applications.error}
        onRetry={() => void applications.refetch()}
      />
    );
  if (applications.isPending) {
    return (
      <div className="flex max-w-3xl flex-col gap-4">
        {Array.from({ length: 2 }, (_, index) => (
          <Skeleton key={index} className="h-48 rounded-card" />
        ))}
      </div>
    );
  }

  const pending = applications.data.filter(
    (application) => application.status === "pending",
  );
  const resolved = applications.data.filter(
    (application) => application.status !== "pending",
  );

  if (applications.data.length === 0) {
    return (
      <EmptyState title="No applications yet" className="max-w-3xl">
        Add open roles and share the project link. Applications arrive here and
        in your notifications.
      </EmptyState>
    );
  }

  return (
    <div className="flex max-w-3xl flex-col gap-10">
      <section>
        <h2 className="mb-4 font-sans text-lg">
          Waiting for you · {pending.length}
        </h2>
        {pending.length ? (
          <ul className="flex flex-col gap-4">
            {pending.map((application) => (
              <ApplicationCard
                key={application.applicant_id}
                application={application}
                project={project}
              />
            ))}
          </ul>
        ) : (
          <p className="rounded-card border border-line bg-surface p-5 text-ink-soft">
            You're all caught up.
          </p>
        )}
      </section>
      {resolved.length > 0 && (
        <section>
          <h2 className="mb-4 font-sans text-lg">Resolved</h2>
          <ul className="flex flex-col gap-4">
            {resolved.map((application) => (
              <ApplicationCard
                key={application.applicant_id}
                application={application}
                project={project}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
