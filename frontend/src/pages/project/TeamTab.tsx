import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  MoreHorizontal,
  ShieldCheck,
  ShieldOff,
  UserMinus,
  UserPlus,
} from "lucide-react";

import { useAuth } from "@/auth/AuthProvider";
import { useMembers, useRemoveMember, useUpdateMember } from "@/lib/queries";
import type { Member, ProjectDetail } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Chip } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorState, Skeleton } from "@/components/ui/feedback";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { PersonLine } from "@/components/cards";
import { InviteDialog } from "@/pages/project/InviteDialog";

const ROLE_LABEL = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
} as const;

export function TeamTab({
  project,
  onEditSeats,
}: {
  project: ProjectDetail;
  /** Opens the sheet that holds the team size. */
  onEditSeats: () => void;
}) {
  const { me } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const members = useMembers(project.id);
  const [inviting, setInviting] = useState(false);
  const update = useUpdateMember(project.id);
  const remove = useRemoveMember(project.id);

  const iAmOwner = project.viewer.role === "owner";
  const canManage = iAmOwner || project.viewer.role === "admin";
  const onError = (error: unknown) => toast.error(error);

  function actionsFor(member: Member) {
    const isSelf = member.user.id === me?.id;
    if (member.role === "owner") return null;
    const items = [];
    if (iAmOwner && !isSelf) {
      items.push(
        member.role === "admin" ? (
          <MenuItem
            key="demote"
            onSelect={() =>
              update.mutate(
                { userId: member.user.id, role: "member" },
                { onError },
              )
            }
          >
            <ShieldOff aria-hidden /> Remove admin rights
          </MenuItem>
        ) : (
          <MenuItem
            key="promote"
            onSelect={() =>
              update.mutate(
                { userId: member.user.id, role: "admin" },
                { onError },
              )
            }
          >
            <ShieldCheck aria-hidden /> Make admin
          </MenuItem>
        ),
      );
    }
    if (isSelf) {
      items.push(
        <MenuItem
          key="leave"
          danger
          onSelect={() =>
            remove.mutate(member.user.id, {
              onSuccess: () => {
                toast.success(`You left ${project.title}`);
                navigate(`/projects/${project.id}`, { replace: true });
              },
              onError,
            })
          }
        >
          <LogOut aria-hidden /> Leave project
        </MenuItem>,
      );
    } else if (canManage) {
      items.push(
        <MenuItem
          key="remove"
          danger
          onSelect={() =>
            remove.mutate(member.user.id, {
              onSuccess: () => toast.success(`${member.user.name} was removed`),
              onError,
            })
          }
        >
          <UserMinus aria-hidden /> Remove from team
        </MenuItem>,
      );
    }
    if (items.length === 0) return null;
    return (
      <Menu>
        <MenuTrigger
          aria-label={`Actions for ${member.user.name}`}
          className="flex size-11 shrink-0 items-center justify-center rounded-field text-ink-soft hover:bg-sunken"
        >
          <MoreHorizontal className="size-5" aria-hidden />
        </MenuTrigger>
        <MenuContent>{items}</MenuContent>
      </Menu>
    );
  }

  if (members.isError)
    return (
      <ErrorState
        error={members.error}
        onRetry={() => void members.refetch()}
      />
    );
  if (members.isPending) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-20 rounded-card" />
        ))}
      </div>
    );
  }

  const seats = Math.max(0, project.max_members - project.current_members);
  return (
    <>
      {canManage && project.status !== "Completed" && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-card border border-dashed border-ink-soft p-4">
          <p className="text-[0.95rem]">
            <span className="font-medium">
              {seats} {seats === 1 ? "seat" : "seats"} open.
            </span>{" "}
            <span className="text-ink-soft">
              {seats
                ? "Know someone who fits? Don't wait for them to find you."
                : "Raise the team size to bring in more people."}
            </span>
          </p>
          {seats > 0 ? (
            <Button onClick={() => setInviting(true)}>
              <UserPlus aria-hidden /> Invite people
            </Button>
          ) : (
            <Button variant="outline" onClick={onEditSeats}>
              Edit team size
            </Button>
          )}
        </div>
      )}
      <ul className="grid gap-3 md:grid-cols-2">
        {members.data.map((member) => (
          <li
            key={member.user.id}
            className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface p-4"
          >
            <PersonLine
              person={member.user}
              detail={`${
                member.title || member.user.headline || "Team member"
              } · since ${formatDate(member.joined_at, {
                month: "short",
                year: "numeric",
              })}`}
            />
            <div className="flex shrink-0 items-center gap-1">
              {member.role !== "member" && (
                <Chip tone={member.role === "owner" ? "primary" : "neutral"}>
                  {ROLE_LABEL[member.role]}
                </Chip>
              )}
              {actionsFor(member)}
            </div>
          </li>
        ))}
      </ul>
      <InviteDialog
        project={project}
        open={inviting}
        onOpenChange={setInviting}
      />
    </>
  );
}
