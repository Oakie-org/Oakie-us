import { useEffect, useState } from "react";
import { Check, Search, Send, X } from "lucide-react";

import {
  useInvitations,
  useInvite,
  useMembers,
  useRevokeInvitation,
  useTalent,
} from "@/lib/queries";
import type { ProjectDetail, UserSummary } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FormError, Skeleton } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Dialog } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";

type InviteTarget = Pick<
  UserSummary,
  "id" | "name" | "headline" | "avatar_url"
> & { skills?: string[] };

/** The second, small step: which seat, and a note. Shared by every place that invites. */
export function InviteForm({
  project,
  person,
  onDone,
  onBack,
}: {
  project: Pick<ProjectDetail, "id" | "title" | "open_roles">;
  person: InviteTarget;
  onDone: () => void;
  onBack?: () => void;
}) {
  const invite = useInvite(project.id);
  const toast = useToast();
  const [role, setRole] = useState(project.open_roles[0]?.title ?? "");
  const [message, setMessage] = useState("");
  const first = person.name.split(" ")[0];

  return (
    <form
      className="flex animate-step flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        invite.mutate(
          { user_id: person.id, role_title: role, message: message.trim() },
          {
            onSuccess: () => {
              toast.success(`Invitation sent to ${first}`);
              onDone();
            },
          },
        );
      }}
    >
      <div className="flex items-center gap-3 rounded-2xl bg-sunken p-3">
        <Avatar user={person} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 font-display font-semibold">
            <span className="truncate">{person.name}</span>
          </p>
          {person.headline && (
            <p className="truncate text-sm text-ink-soft">{person.headline}</p>
          )}
        </div>
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            Change
          </Button>
        )}
      </div>
      {project.open_roles.length > 0 && (
        <Field label="For which role">
          {(control) => (
            <Select
              {...control}
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              {project.open_roles.map((open) => (
                <option key={open.title}>{open.title}</option>
              ))}
              <option value="">No specific role</option>
            </Select>
          )}
        </Field>
      )}
      <Field
        label="Add a note"
        hint="Optional, but invitations with a reason get answered."
      >
        {(control) => (
          <Textarea
            {...control}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={600}
            rows={3}
            placeholder={`Why ${first}? What would they work on?`}
          />
        )}
      </Field>
      <FormError error={invite.error} />
      <Button type="submit" size="lg" loading={invite.isPending}>
        <Send aria-hidden /> Send invitation
      </Button>
    </form>
  );
}

function Picker({
  project,
  onPick,
}: {
  project: ProjectDetail;
  onPick: (person: UserSummary) => void;
}) {
  const [text, setText] = useState("");
  const [term, setTerm] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => setTerm(text.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [text]);

  // With nothing typed, suggest people who have the skills the open roles ask for.
  const wanted = project.open_roles.flatMap((role) => role.skills)[0];
  const people = useTalent(term ? { q: term } : { skill: wanted });
  const members = useMembers(project.id);
  const invitations = useInvitations(project.id, true);
  const revoke = useRevokeInvitation(project.id);
  const toast = useToast();

  const onTeam = new Set(members.data?.map((member) => member.user.id));
  const pending = (invitations.data ?? []).filter(
    (invitation) => invitation.status === "pending",
  );
  const invited = new Set(pending.map((invitation) => invitation.invitee_id));
  const found = (people.data?.pages[0]?.items ?? [])
    .filter((person) => !onTeam.has(person.id))
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-soft"
          aria-hidden
        />
        <Input
          autoFocus
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Search by name, skill or city"
          aria-label="Search people to invite"
          className="pl-12"
          maxLength={80}
        />
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold tracking-wide text-ink-soft uppercase">
          {term
            ? "Results"
            : wanted
              ? `People who do ${wanted}`
              : "Recently joined"}
        </p>
        {people.isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : found.length === 0 ? (
          <p className="py-4 text-ink-soft">
            No one found. Try a different name or skill.
          </p>
        ) : (
          <ul>
            {found.map((person) => (
              <li key={person.id} className="flex items-center gap-3 py-2">
                <Avatar user={person} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 font-display font-semibold">
                    <span className="truncate">{person.name}</span>
                  </p>
                  <p className="truncate text-sm text-ink-soft">
                    {person.skills.slice(0, 3).join(" · ") || person.headline}
                  </p>
                </div>
                {invited.has(person.id) ? (
                  <span className="flex items-center gap-1 text-sm font-medium text-ink-soft">
                    <Check className="size-4" aria-hidden /> Invited
                  </span>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPick(person)}
                  >
                    Invite
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {pending.length > 0 && (
        <div className="border-t border-line pt-4">
          <p className="mb-1 text-xs font-semibold tracking-wide text-ink-soft uppercase">
            Waiting for an answer
          </p>
          <ul>
            {pending.map(
              (invitation) =>
                invitation.invitee && (
                  <li
                    key={invitation.invitee_id}
                    className="flex items-center gap-3 py-2"
                  >
                    <Avatar user={invitation.invitee} size="sm" />
                    <p className="min-w-0 flex-1 truncate text-[0.95rem]">
                      <span className="font-medium">
                        {invitation.invitee.name}
                      </span>
                      <span className="text-ink-soft">
                        {" "}
                        · {invitation.role_title || "any role"} ·{" "}
                        {timeAgo(invitation.created_at)}
                      </span>
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Cancel invitation to ${invitation.invitee.name}`}
                      onClick={() =>
                        revoke.mutate(invitation.invitee_id, {
                          onSuccess: () =>
                            toast.success("Invitation cancelled"),
                          onError: (error) => toast.error(error),
                        })
                      }
                    >
                      <X aria-hidden /> Cancel
                    </Button>
                  </li>
                ),
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Find someone, then say which seat is theirs. Two small steps instead of one long form. */
export function InviteDialog({
  project,
  open,
  onOpenChange,
}: {
  project: ProjectDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [person, setPerson] = useState<UserSummary | null>(null);
  const seats = Math.max(0, project.max_members - project.current_members);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setPerson(null);
        onOpenChange(next);
      }}
      title={person ? `Invite ${person.name.split(" ")[0]}` : "Invite people"}
      description={
        person
          ? `To ${project.title}`
          : `${seats} ${seats === 1 ? "seat" : "seats"} open on ${
              project.title
            }.`
      }
    >
      {!open ? null : person ? (
        <InviteForm
          project={project}
          person={person}
          onBack={() => setPerson(null)}
          onDone={() => setPerson(null)}
        />
      ) : (
        <Picker project={project} onPick={setPerson} />
      )}
    </Dialog>
  );
}
