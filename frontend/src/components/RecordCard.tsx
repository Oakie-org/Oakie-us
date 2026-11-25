import { Link } from "react-router-dom";
import { BadgeCheck } from "lucide-react";

import { toneFor } from "@/lib/categories";
import type { ContributionRecord } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

const ROLE_LABEL = {
  owner: "Founder",
  admin: "Project admin",
  member: "Team member",
} as const;

/** The certificate-style card for one contribution record. */
export function RecordCard({
  record,
  verified,
}: {
  record: ContributionRecord;
  verified?: boolean;
}) {
  const tone = toneFor(record.project_category);
  return (
    <article className="overflow-hidden rounded-card bg-surface">
      <div
        className={cn(
          "flex items-start justify-between gap-4 p-6 text-block-ink",
          tone.bg,
        )}
      >
        <div className="min-w-0">
          <p className="font-display text-xs font-semibold tracking-wide uppercase">
            {record.project_category}
          </p>
          <h3 className="mt-1 text-2xl leading-tight">
            <Link
              to={`/projects/${record.project_id}`}
              className="hover:underline"
            >
              {record.project_title}
            </Link>
          </h3>
        </div>
        {verified && (
          <span className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-block-ink px-3 font-display text-sm font-semibold text-[#f6f5ef]">
            <BadgeCheck className="size-4" aria-hidden /> Verified
          </span>
        )}
      </div>
      <div className="flex flex-col gap-5 p-6">
        <Link
          to={`/u/${record.member.id}`}
          className="group flex items-center gap-3"
        >
          <Avatar user={record.member} />
          <span>
            <span className="block font-display text-lg font-semibold group-hover:underline">
              {record.member.name}
            </span>
            <span className="block text-sm text-ink-soft">
              {record.title || ROLE_LABEL[record.role]}
            </span>
          </span>
        </Link>
        <dl className="grid grid-cols-3 gap-4 border-t border-line pt-5 text-sm">
          <div>
            <dt className="text-ink-soft">Role</dt>
            <dd className="mt-0.5 font-display font-semibold">
              {ROLE_LABEL[record.role]}
            </dd>
          </div>
          <div>
            <dt className="text-ink-soft">Member since</dt>
            <dd className="mt-0.5 font-display font-semibold">
              {formatDate(record.joined_at)}
            </dd>
          </div>
          <div>
            <dt className="text-ink-soft">Tasks completed</dt>
            <dd className="mt-0.5 font-display font-semibold">
              {record.tasks_completed} of {record.tasks_assigned}
            </dd>
          </div>
        </dl>
        <p className="flex flex-wrap items-center justify-between gap-2 rounded-field bg-sunken px-4 py-3 text-sm">
          <span className="text-ink-soft">Record code</span>
          <Link
            to={`/verify/${record.code}`}
            className="font-mono text-base font-semibold tracking-wider hover:underline"
          >
            {record.code}
          </Link>
        </p>
      </div>
    </article>
  );
}
