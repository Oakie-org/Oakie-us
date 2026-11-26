import { useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  ArrowUpRight,
  Award,
  Building2,
  FolderOpen,
  MapPin,
} from "lucide-react";

import { toneNamed } from "@/lib/categories";
import { useContributions, useUser } from "@/lib/queries";
import { cn, pluralize } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Chip, VerifiedMark } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/feedback";
import { Logo } from "@/components/Logo";

/**
 * A profile as a self-contained card, served without the app shell so it can
 * sit in an iframe on a portfolio or personal site. Every link opens Oakie in
 * a new tab; nothing here needs a session.
 */
export default function EmbedProfile() {
  const { id = "" } = useParams();
  const user = useUser(id);
  const records = useContributions(id);

  useEffect(() => {
    // The host page shows through around the card.
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    document.body.style.minHeight = "0";
  }, []);

  const href = `${window.location.origin}/u/${id}`;
  if (user.isPending)
    return (
      <div className="p-1">
        <Skeleton className="h-56 rounded-card" />
      </div>
    );
  if (user.isError) {
    return (
      <div className="m-1 rounded-card border border-line bg-surface p-5 text-sm text-ink-soft">
        This Oakie profile is not available.
      </div>
    );
  }

  const profile = user.data;
  const tone = toneNamed(profile.accent);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group m-1 block overflow-hidden rounded-card border border-line bg-surface text-ink transition-colors hover:border-ink"
    >
      <div className={cn("h-2", tone ?? "bg-ink")} />
      <div className="p-5">
        <div className="flex items-center gap-3">
          <Avatar user={profile} size="lg" />
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-lg font-medium leading-tight">
              <span className="truncate">{profile.name}</span>
            </p>
            {profile.headline && (
              <p className="line-clamp-2 text-sm text-ink-soft">
                {profile.headline}
              </p>
            )}
          </div>
        </div>
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
          {profile.city && (
            <span className="flex items-center gap-1">
              <MapPin className="size-4" aria-hidden />
              {profile.city}
            </span>
          )}
          {profile.uni && (
            <span className="flex items-center gap-1">
              <Building2 className="size-4" aria-hidden />
              {profile.uni}
              {profile.verified_school && <VerifiedMark />}
            </span>
          )}
        </p>
        {profile.skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile.skills.slice(0, 4).map((skill) => (
              <Chip key={skill}>{skill}</Chip>
            ))}
            {profile.skills.length > 4 && (
              <Chip tone="outline">+{profile.skills.length - 4}</Chip>
            )}
          </div>
        )}
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3 text-sm">
          <span className="flex items-center gap-3 text-ink-soft">
            <span className="flex items-center gap-1">
              <FolderOpen className="size-4" aria-hidden />
              {pluralize(profile.num_projects, "project")}
            </span>
            {Boolean(records.data?.length) && (
              <span className="flex items-center gap-1">
                <Award className="size-4" aria-hidden />
                {records.data!.length} verified
              </span>
            )}
          </span>
          <span className="flex items-center gap-1 font-medium group-hover:underline">
            <Logo className="h-4" />{" "}
            <ArrowUpRight className="size-4" aria-hidden />
          </span>
        </div>
      </div>
    </a>
  );
}
