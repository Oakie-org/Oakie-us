import { Link } from "react-router-dom";

import type { ContributionRecord } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

const ROLE_LABEL = {
  owner: "Founder",
  admin: "Project admin",
  member: "Team member",
} as const;

/**
 * Oakie's seal: 搭, the first character of its name, set like a carved stamp.
 * It appears only on a record that has just been checked against the server,
 * pressed on slightly askew the way a stamp lands.
 */
function Seal() {
  return (
    <span className="flex shrink-0 flex-col items-center gap-1.5 text-accent">
      <span
        aria-hidden
        lang="zh"
        className="flex size-14 -rotate-3 items-center justify-center rounded-md bg-accent font-serif text-[2rem] leading-none text-on-accent"
      >
        搭
      </span>
      <span className="text-[0.8125rem] font-medium">Verified</span>
    </span>
  );
}

/** One contribution record, laid out like the document it stands in for. */
export function RecordCard({
  record,
  verified,
}: {
  record: ContributionRecord;
  verified?: boolean;
}) {
  return (
    <article className="rounded-card border border-line bg-surface p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[0.8125rem] text-ink-mute">
            Contribution record · {record.project_category}
          </p>
          <h3 className="mt-1 font-serif text-2xl leading-tight">
            <Link
              to={`/projects/${record.project_id}`}
              className="underline-offset-4 hover:underline"
            >
              {record.project_title}
            </Link>
          </h3>
        </div>
        {verified && <Seal />}
      </div>

      <Link
        to={`/u/${record.member.id}`}
        className="group mt-5 flex items-center gap-3"
      >
        <Avatar user={record.member} />
        <span className="min-w-0">
          <span className="block truncate font-medium underline-offset-4 group-hover:underline">
            {record.member.name}
          </span>
          <span className="block truncate text-sm text-ink-soft">
            {record.title || ROLE_LABEL[record.role]}
          </span>
        </span>
      </Link>

      <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-line pt-4 text-sm">
        <div>
          <dt className="text-ink-soft">Role</dt>
          <dd className="mt-0.5 font-medium">{ROLE_LABEL[record.role]}</dd>
        </div>
        <div>
          <dt className="text-ink-soft">Member since</dt>
          <dd className="mt-0.5 font-medium">{formatDate(record.joined_at)}</dd>
        </div>
        <div>
          <dt className="text-ink-soft">Tasks completed</dt>
          <dd className="mt-0.5 font-medium tabular-nums">
            {record.tasks_completed} of {record.tasks_assigned}
          </dd>
        </div>
      </dl>

      <p className="mt-4 flex flex-wrap items-baseline justify-between gap-2 border-t border-line pt-4 text-sm">
        <span className="text-ink-soft">Record code</span>
        <Link
          to={`/verify/${record.code}`}
          className="font-mono text-[0.9375rem] underline-offset-4 hover:underline"
        >
          {record.code}
        </Link>
      </p>
    </article>
  );
}
