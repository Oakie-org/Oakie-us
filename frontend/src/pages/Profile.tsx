import { useState, type ReactNode } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  Award,
  Building2,
  CalendarDays,
  Camera,
  Check,
  Clock,
  Code2,
  Copy,
  FolderOpen,
  ImagePlus,
  Link as LinkIcon,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  Share2,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";

import { useAuth } from "@/auth/AuthProvider";
import { ApiError } from "@/lib/api";
import { toneNamed } from "@/lib/categories";
import {
  isProfileSection,
  nextProfileLink,
  profileStrength,
  safeUrl,
  type ProfileSection,
} from "@/lib/profile";
import {
  useContributions,
  useFollowList,
  useFollowUser,
  useStartConversation,
  useUser,
  useUserProjects,
} from "@/lib/queries";
import type { ProjectMembership, UserProfile } from "@/lib/types";
import { cn, compact, formatDate } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Chip, VerifiedMark } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { AddPrompt, EditButton } from "@/components/ui/edit";
import {
  EmptyState,
  ErrorState,
  FormError,
  PageSpinner,
  Skeleton,
} from "@/components/ui/feedback";
import { Field, Textarea } from "@/components/ui/field";
import { Dialog } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { PersonLine } from "@/components/cards";
import { ProjectFeed } from "@/components/ProjectFeed";
import { Section, useTitle } from "@/components/page";
import { ProfileEditor } from "@/components/profile/editors";
import { RecordCard } from "@/components/RecordCard";
import NotFound from "@/pages/NotFound";
import { InviteForm } from "@/pages/project/InviteDialog";

function MessageDialog({
  user,
  open,
  onOpenChange,
}: {
  user: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [body, setBody] = useState("");
  const start = useStartConversation();
  const navigate = useNavigate();
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Message ${user.name.split(" ")[0]}`}
      description="Say what you're working on and why you're reaching out."
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          start.mutate(
            { recipient_id: user.id, body: body.trim() },
            {
              onSuccess: (conversation) =>
                navigate(`/messages/${conversation.id}`),
            },
          );
        }}
      >
        <Field label="Your message" required>
          {(control) => (
            <Textarea
              {...control}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={4000}
              autoFocus
            />
          )}
        </Field>
        <FormError error={start.error} />
        <Button type="submit" loading={start.isPending} disabled={!body.trim()}>
          Send message
        </Button>
      </form>
    </Dialog>
  );
}

/** Invite this person to one of the viewer's own projects. */
function InviteToProject({
  user,
  myId,
  open,
  onOpenChange,
}: {
  user: UserProfile;
  myId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mine = useUserProjects(open ? myId : undefined);
  const [chosen, setChosen] = useState<ProjectMembership | null>(null);
  const manageable = (mine.data ?? []).filter(
    (project) =>
      project.role !== "member" &&
      project.status !== "Completed" &&
      project.current_members < project.max_members,
  );
  const first = user.name.split(" ")[0];
  const close = (next: boolean) => {
    if (!next) setChosen(null);
    onOpenChange(next);
  };
  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title={`Invite ${first} to a project`}
      description={
        chosen
          ? `To ${chosen.title}`
          : "Pick one of your projects with an open seat."
      }
    >
      {chosen ? (
        <InviteForm
          project={chosen}
          person={user}
          onBack={() => setChosen(null)}
          onDone={() => close(false)}
        />
      ) : mine.isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>
      ) : manageable.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-ink-soft">
            You don't have a project with an open seat yet. Start one and{" "}
            {first} can be your first invitation.
          </p>
          <ButtonLink to="/projects/new">Start a project</ButtonLink>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {manageable.map((project) => (
            <li key={project.id}>
              <button
                type="button"
                onClick={() => setChosen(project)}
                className="flex w-full items-center gap-3 rounded-2xl border-2 border-line p-3 text-left transition-colors hover:border-ink"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display font-semibold">
                    {project.title}
                  </span>
                  <span className="block truncate text-sm text-ink-soft">
                    {project.max_members - project.current_members} open ·{" "}
                    {project.open_roles.map((role) => role.title).join(", ") ||
                      "no named roles"}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}

function CopyRow({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked: the text is selectable, so nothing is lost.
    }
  }
  return (
    <div>
      <p className="font-display text-sm font-semibold">{label}</p>
      <div className="mt-1.5 flex items-start gap-2">
        <code
          className={cn(
            "min-w-0 flex-1 rounded-field bg-sunken px-3 py-2.5 text-[0.8125rem] select-all",
            multiline ? "break-all" : "truncate",
          )}
        >
          {value}
        </code>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void copy()}
          className="shrink-0"
        >
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}{" "}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}

/** Take the profile elsewhere: a link for a résumé, a card for a personal site. */
function ShareDialog({
  user,
  open,
  onOpenChange,
}: {
  user: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const origin = window.location.origin;
  const embed = `${origin}/embed/u/${user.id}`;
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Share this profile"
      description="Put it on a résumé, a portfolio or a personal site."
      className="sm:w-[min(36rem,calc(100vw-2rem))]"
    >
      <div className="flex flex-col gap-5">
        <CopyRow label="Profile link" value={`${origin}/u/${user.id}`} />
        <CopyRow
          label="Embed on your website"
          multiline
          value={`<iframe src="${embed}" title="${user.name} on Oakie" width="380" height="250" style="border:0;max-width:100%" loading="lazy"></iframe>`}
        />
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 font-display text-sm font-semibold">
            <Code2 className="size-4" aria-hidden /> Preview
          </p>
          {open && (
            <iframe
              src={embed}
              title="Embed preview"
              width="380"
              height="250"
              className="max-w-full rounded-card border border-line"
            />
          )}
        </div>
      </div>
    </Dialog>
  );
}

function FollowList({
  user,
  kind,
  onClose,
}: {
  user: UserProfile;
  kind: "followers" | "following" | null;
  onClose: () => void;
}) {
  const list = useFollowList(user.id, kind ?? "followers", kind !== null);
  const first = user.name.split(" ")[0];
  return (
    <Dialog
      open={kind !== null}
      onOpenChange={(open) => !open && onClose()}
      title={kind === "following" ? `${first} follows` : `Following ${first}`}
    >
      {list.isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-12 rounded-xl" />
          ))}
        </div>
      ) : !list.data?.length ? (
        <p className="text-ink-soft">No one yet.</p>
      ) : (
        <ul className="flex flex-col gap-3" onClick={onClose}>
          {list.data.map((person) => (
            <li key={person.id}>
              <PersonLine person={person} />
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}

function Block({
  title,
  edit,
  children,
  className,
}: {
  title: string;
  /** The owner's pencil, when they are the one looking. */
  edit?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-card bg-surface p-6", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg">{title}</h2>
        {edit}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function Profile() {
  const { id = "" } = useParams();
  const { me, status } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const user = useUser(id);
  const projects = useUserProjects(id);
  const records = useContributions(id);
  const follow = useFollowUser(id);
  const [dialog, setDialog] = useState<
    "message" | "invite" | "share" | "followers" | "following" | null
  >(null);
  useTitle(user.data?.name);

  if (user.isPending) return <PageSpinner />;
  if (user.error instanceof ApiError && user.error.status === 404)
    return <NotFound title="We couldn't find that member" />;
  if (user.isError)
    return (
      <ErrorState error={user.error} onRetry={() => void user.refetch()} />
    );

  const isMe = me?.id === user.data.id;
  // The owner sees their own edits the moment they are saved.
  const profile: UserProfile = isMe && me ? me : user.data;

  // Which part is being edited lives in the URL, so Back closes the sheet and
  // "next: add a headline" can link straight to it. Only the owner can open one.
  const requested = params.get("edit");
  const editing = isMe && isProfileSection(requested) ? requested : null;
  const edit = (section: ProfileSection) =>
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.set("edit", section);
      return next;
    });
  const stopEditing = () =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete("edit");
        return next;
      },
      { replace: true },
    );

  const links = [
    ...profile.links.map((link) => ({
      label: link.label,
      href: safeUrl(link.url),
    })),
    ...(profile.website ? [{ label: "", href: safeUrl(profile.website) }] : []),
  ].filter((link): link is { label: string; href: string } =>
    Boolean(link.href),
  );
  const pinned = profile.pinned_project_ids
    .map((pid) => projects.data?.find((project) => project.id === pid))
    .filter((project): project is ProjectMembership => Boolean(project));
  const others = (projects.data ?? []).filter(
    (project) => !pinned.includes(project),
  );
  const strength = isMe && me ? profileStrength(me) : null;
  const nextLink = isMe && me ? nextProfileLink(me) : null;
  // A banner is the member's own picture, or failing that the colour they
  // picked. With neither there is no banner: nothing is drawn to fill the gap.
  const accent = toneNamed(profile.accent);
  const hasBanner = Boolean(profile.banner_url || accent);
  // Visitors only see the parts that say something; the owner also sees where
  // the empty ones would go.
  const showAbout = isMe || Boolean(profile.bio);
  const showSkills = isMe || profile.skills.length > 0;
  const showOpenTo = isMe || profile.open_to.length > 0;
  const showSide = showSkills || showOpenTo;

  function requireSignIn(action: () => void) {
    if (status === "signedIn") action();
    else navigate("/login", { state: { from: `/u/${id}` } });
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-card bg-surface">
        {profile.banner_url ? (
          <img
            src={profile.banner_url}
            alt=""
            className="h-28 w-full bg-sunken object-cover sm:h-40"
          />
        ) : (
          accent && <div className={cn("h-16 sm:h-20", accent.bg)} />
        )}
        {isMe && (
          <Button
            variant={profile.banner_url ? "ink" : "ghost"}
            size="icon"
            className={cn(
              "absolute right-3 top-3",
              !profile.banner_url && "text-ink-soft hover:text-ink",
              accent && !profile.banner_url && "text-block-ink",
            )}
            aria-label={hasBanner ? "Change your cover" : "Add a cover"}
            title={hasBanner ? "Change your cover" : "Add a cover"}
            onClick={() => edit("cover")}
          >
            <ImagePlus aria-hidden />
          </Button>
        )}
        <div className="px-5 pb-6 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            {isMe ? (
              <button
                type="button"
                onClick={() => edit("photo")}
                aria-label={
                  profile.avatar_url ? "Change your photo" : "Add a photo"
                }
                className={cn(
                  "group relative rounded-full",
                  hasBanner ? "-mt-12" : "mt-6",
                )}
              >
                <Avatar
                  user={profile}
                  size="xl"
                  className="ring-4 ring-surface"
                />
                <span className="absolute bottom-0.5 right-0.5 flex size-9 items-center justify-center rounded-full bg-ink text-paper ring-4 ring-surface transition-transform group-hover:scale-110">
                  <Camera className="size-4" aria-hidden />
                </span>
              </button>
            ) : (
              <Avatar
                user={profile}
                size="xl"
                className={cn(
                  "ring-4 ring-surface",
                  hasBanner ? "-mt-12" : "mt-6",
                )}
              />
            )}
            <div className="flex flex-wrap gap-2 pb-1">
              {isMe ? (
                <Button variant="outline" onClick={() => edit("intro")}>
                  <Pencil aria-hidden /> Edit intro
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => requireSignIn(() => setDialog("invite"))}
                  >
                    <Users aria-hidden /> Invite to project
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => requireSignIn(() => setDialog("message"))}
                  >
                    <MessageCircle aria-hidden /> Message
                  </Button>
                  <Button
                    variant="outline"
                    aria-pressed={Boolean(profile.is_following)}
                    onClick={() =>
                      requireSignIn(() =>
                        follow.mutate(!profile.is_following, {
                          onError: (error) => toast.error(error),
                        }),
                      )
                    }
                  >
                    {profile.is_following ? (
                      <UserCheck aria-hidden />
                    ) : (
                      <UserPlus aria-hidden />
                    )}
                    {profile.is_following ? "Following" : "Follow"}
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="icon"
                aria-label="Share or embed this profile"
                onClick={() => setDialog("share")}
              >
                <Share2 aria-hidden />
              </Button>
            </div>
          </div>

          <h1 className="mt-4 text-3xl sm:text-4xl">{profile.name}</h1>
          {profile.headline ? (
            <p className="mt-1 text-lg text-ink-soft">{profile.headline}</p>
          ) : (
            isMe && (
              <button
                type="button"
                onClick={() => edit("intro")}
                className="mt-1 flex min-h-11 items-center gap-1.5 text-lg text-ink-soft underline decoration-dashed underline-offset-4 hover:text-ink"
              >
                <Plus className="size-4" aria-hidden /> Add a headline
              </button>
            )
          )}

          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[0.95rem] text-ink-soft">
            {profile.city && (
              <li className="flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden />
                {profile.city}
              </li>
            )}
            {profile.availability && (
              <li className="flex items-center gap-1.5">
                <Clock className="size-4" aria-hidden />
                {profile.availability}
              </li>
            )}
            {profile.uni && (
              <li className="flex items-center gap-1.5">
                <Building2 className="size-4" aria-hidden />
                {profile.uni}
                {profile.verified_school && <VerifiedMark />}
              </li>
            )}
            <li className="flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden />
              Joined{" "}
              {formatDate(profile.created_at, {
                month: "long",
                year: "numeric",
              })}
            </li>
          </ul>

          {(links.length > 0 || isMe) && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-sm font-medium transition-colors hover:border-ink"
                  >
                    <LinkIcon className="size-3.5 text-ink-soft" aria-hidden />
                    {link.label ||
                      new URL(link.href).hostname.replace(/^www\./, "")}
                  </a>
                </li>
              ))}
              {isMe && (
                <li>
                  <button
                    type="button"
                    onClick={() => edit("links")}
                    className="relative flex h-8 items-center gap-1.5 rounded-full border border-dashed border-ink-soft px-3 text-sm font-medium text-ink-soft transition-colors after:absolute after:-inset-y-1.5 after:inset-x-0 hover:border-solid hover:border-ink hover:text-ink"
                  >
                    {profile.links.length ? (
                      <Pencil className="size-3.5" aria-hidden />
                    ) : (
                      <Plus className="size-3.5" aria-hidden />
                    )}
                    {profile.links.length ? "Edit links" : "Link your work"}
                  </button>
                </li>
              )}
            </ul>
          )}

          <dl className="mt-5 flex gap-2">
            <div className="px-3 py-1">
              <dd className="font-display text-xl font-semibold">
                {compact.format(profile.num_projects)}
              </dd>
              <dt className="text-sm text-ink-soft">Projects</dt>
            </div>
            {(["followers", "following"] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => setDialog(kind)}
                className="rounded-xl px-3 py-1 text-left transition-colors hover:bg-sunken"
              >
                <dd className="font-display text-xl font-semibold">
                  {compact.format(
                    kind === "followers"
                      ? profile.num_followers
                      : profile.num_following,
                  )}
                </dd>
                <dt className="text-sm text-ink-soft capitalize">{kind}</dt>
              </button>
            ))}
          </dl>
        </div>
      </div>

      {strength?.next && nextLink && (
        <Link
          to={nextLink}
          className="group mt-4 flex flex-wrap items-center gap-4 rounded-card border border-dashed border-ink-soft p-4 transition-colors hover:border-solid hover:border-ink"
        >
          <span className="font-display text-2xl font-semibold tabular-nums">
            {strength.percent}%
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display font-semibold">
              Next: {strength.next.label.toLowerCase()}
            </span>
            <span className="block text-sm text-ink-soft">
              {strength.next.why}
            </span>
          </span>
          <span
            className="hidden h-2 w-28 overflow-hidden rounded-full bg-line sm:block"
            aria-hidden
          >
            <span
              className="block h-full rounded-full bg-primary transition-[width] duration-500 ease-out-soft"
              style={{ width: `${strength.percent}%` }}
            />
          </span>
        </Link>
      )}

      {(pinned.length > 0 || (isMe && Boolean(projects.data?.length))) && (
        <Section
          title="Featured"
          className="mt-8"
          action={
            isMe && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => edit("featured")}
              >
                <Pencil aria-hidden /> Choose
              </Button>
            )
          }
        >
          {pinned.length > 0 ? (
            <ProjectFeed projects={pinned} />
          ) : (
            <AddPrompt
              label="Pin your best work"
              why="Up to three projects sit at the top of your profile."
              onClick={() => edit("featured")}
            />
          )}
        </Section>
      )}

      {(showAbout || showSide) && (
        <div
          className={cn(
            "mt-6 grid items-start gap-6",
            showAbout && showSide && "lg:grid-cols-[1fr_20rem]",
          )}
        >
          {showAbout && (
            <Block
              title="About"
              className="sm:p-8"
              edit={
                isMe &&
                profile.bio && (
                  <EditButton
                    label="Edit your bio"
                    onClick={() => edit("about")}
                  />
                )
              }
            >
              {profile.bio ? (
                <p className="prose-plain">{profile.bio}</p>
              ) : (
                <AddPrompt
                  label="Write a short bio"
                  why="Two sentences on what you've made and what you're looking for."
                  onClick={() => edit("about")}
                />
              )}
            </Block>
          )}
          {showSide && (
            <aside
              className={
                showAbout
                  ? "flex flex-col gap-6"
                  : "grid items-start gap-6 sm:grid-cols-2"
              }
            >
              {showOpenTo && (
                <Block
                  title="Open to"
                  edit={
                    isMe &&
                    profile.open_to.length > 0 && (
                      <EditButton
                        label="Edit what you're open to"
                        onClick={() => edit("looking")}
                      />
                    )
                  }
                >
                  {profile.open_to.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.open_to.map((option) => (
                        <Chip key={option} tone="primary">
                          {option}
                        </Chip>
                      ))}
                    </div>
                  ) : (
                    <AddPrompt
                      label="Say what you're open to"
                      why="So the right invitations reach you."
                      onClick={() => edit("looking")}
                    />
                  )}
                </Block>
              )}
              {showSkills && (
                <Block
                  title="Skills"
                  edit={
                    isMe &&
                    profile.skills.length > 0 && (
                      <EditButton
                        label="Edit your skills"
                        onClick={() => edit("skills")}
                      />
                    )
                  }
                >
                  {profile.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {profile.skills.map((skill) => (
                        <Link
                          key={skill}
                          to={`/talent?skill=${encodeURIComponent(skill)}`}
                          className="rounded-full"
                        >
                          <Chip className="transition-colors hover:bg-line">
                            {skill}
                          </Chip>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <AddPrompt
                      label="List your skills"
                      why="Teams filter people by skill."
                      onClick={() => edit("skills")}
                    />
                  )}
                </Block>
              )}
            </aside>
          )}
        </div>
      )}

      <Section title={pinned.length ? "More projects" : "Projects"}>
        {projects.isPending ? (
          <Skeleton className="h-40 rounded-card" />
        ) : others.length === 0 && pinned.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No projects yet"
            action={
              isMe ? (
                <div className="flex flex-wrap justify-center gap-3">
                  <ButtonLink to="/projects/new">Start a project</ButtonLink>
                  <ButtonLink to="/explore?open=1" variant="outline">
                    Find one to join
                  </ButtonLink>
                </div>
              ) : undefined
            }
          >
            {isMe
              ? "Projects you start or join appear here."
              : "Nothing public to show yet."}
          </EmptyState>
        ) : (
          <ProjectFeed projects={others} />
        )}
      </Section>

      <Section title="Verified contributions">
        {!records.data?.length ? (
          <EmptyState icon={Award} title="No records yet">
            A verifiable record is issued for every project a member joins.
            Anyone can check it by its code.
          </EmptyState>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {records.data.map((record) => (
              <RecordCard key={record.code} record={record} />
            ))}
          </div>
        )}
      </Section>

      <MessageDialog
        user={profile}
        open={dialog === "message"}
        onOpenChange={(open) => setDialog(open ? "message" : null)}
      />
      {me && !isMe && (
        <InviteToProject
          user={profile}
          myId={me.id}
          open={dialog === "invite"}
          onOpenChange={(open) => setDialog(open ? "invite" : null)}
        />
      )}
      {isMe && me && (
        <ProfileEditor me={me} section={editing} onClose={stopEditing} />
      )}
      <ShareDialog
        user={profile}
        open={dialog === "share"}
        onOpenChange={(open) => setDialog(open ? "share" : null)}
      />
      <FollowList
        user={profile}
        kind={dialog === "followers" || dialog === "following" ? dialog : null}
        onClose={() => setDialog(null)}
      />
    </>
  );
}
