import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Award,
  FolderOpen,
  GraduationCap,
  Link as LinkIcon,
  MapPin,
  MessageCircle,
  Pencil,
  UserCheck,
  UserPlus,
} from "lucide-react";

import { useAuth } from "@/auth/AuthProvider";
import { ApiError } from "@/lib/api";
import {
  useContributions,
  useFollowUser,
  useStartConversation,
  useUser,
  useUserProjects,
} from "@/lib/queries";
import type { UserProfile } from "@/lib/types";
import { compact, formatDate } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Chip } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  FormError,
  PageSpinner,
} from "@/components/ui/feedback";
import { Field, Textarea } from "@/components/ui/field";
import { Dialog } from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { ProjectCard } from "@/components/cards";
import { Section, useTitle } from "@/components/page";
import { ProjectCover } from "@/components/ProjectCover";
import { RecordCard } from "@/components/RecordCard";
import NotFound from "@/pages/NotFound";

function safeUrl(website: string): string | null {
  try {
    const url = new URL(
      /^https?:\/\//i.test(website) ? website : `https://${website}`,
    );
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

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

export default function Profile() {
  const { id = "" } = useParams();
  const { me, status } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useUser(id);
  const projects = useUserProjects(id);
  const records = useContributions(id);
  const follow = useFollowUser(id);
  const [messaging, setMessaging] = useState(false);
  useTitle(user.data?.name);

  if (user.isPending) return <PageSpinner />;
  if (user.error instanceof ApiError && user.error.status === 404)
    return <NotFound title="We couldn't find that member" />;
  if (user.isError)
    return (
      <ErrorState error={user.error} onRetry={() => void user.refetch()} />
    );

  const profile = user.data;
  const isMe = me?.id === profile.id;
  const website = profile.website ? safeUrl(profile.website) : null;

  function requireSignIn(action: () => void) {
    if (status === "signedIn") action();
    else navigate("/login", { state: { from: `/u/${id}` } });
  }

  return (
    <>
      <div className="overflow-hidden rounded-card bg-surface">
        <div className="h-36 sm:h-48">
          <ProjectCover
            project={{
              id: profile.id,
              category: "",
              image_url: profile.banner_url,
            }}
          />
        </div>
        <div className="px-5 pb-6 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <Avatar
              user={profile}
              size="xl"
              className="-mt-14 ring-4 ring-surface"
            />
            <div className="flex flex-wrap gap-2 pb-1">
              {isMe ? (
                <ButtonLink to="/settings" variant="outline">
                  <Pencil aria-hidden /> Edit profile
                </ButtonLink>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => requireSignIn(() => setMessaging(true))}
                  >
                    <MessageCircle aria-hidden /> Message
                  </Button>
                  <Button
                    variant={profile.is_following ? "outline" : "primary"}
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
            </div>
          </div>

          <h1 className="mt-4 text-3xl sm:text-4xl">{profile.name}</h1>
          {profile.headline && (
            <p className="mt-1 text-lg text-ink-soft">{profile.headline}</p>
          )}

          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[0.95rem] text-ink-soft">
            {profile.uni && (
              <li className="flex items-center gap-1.5">
                <GraduationCap className="size-4" aria-hidden />
                {profile.uni}
              </li>
            )}
            {profile.city && (
              <li className="flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden />
                {profile.city}
              </li>
            )}
            {website && (
              <li>
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="flex items-center gap-1.5 font-medium text-primary hover:underline"
                >
                  <LinkIcon className="size-4" aria-hidden />
                  {new URL(website).hostname}
                </a>
              </li>
            )}
          </ul>

          <dl className="mt-5 flex gap-8">
            {[
              ["Projects", profile.num_projects],
              ["Followers", profile.num_followers],
              ["Following", profile.num_following],
            ].map(([label, value]) => (
              <div key={label}>
                <dd className="font-display text-2xl font-semibold">
                  {compact.format(value as number)}
                </dd>
                <dt className="text-sm text-ink-soft">{label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section className="rounded-card bg-surface p-6 sm:p-8">
          <h2 className="text-xl">About</h2>
          {profile.bio ? (
            <p className="prose-plain mt-3">{profile.bio}</p>
          ) : (
            <p className="mt-3 text-ink-soft">
              {isMe
                ? "Tell people what you make and what you're looking for."
                : `${profile.name.split(" ")[0]} hasn't written a bio yet.`}
            </p>
          )}
          <p className="mt-5 text-sm text-ink-soft">
            On Oakie since{" "}
            {formatDate(profile.created_at, { month: "long", year: "numeric" })}
          </p>
        </section>
        <aside className="flex flex-col gap-6">
          <section className="rounded-card bg-surface p-6">
            <h2 className="text-lg">Skills</h2>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profile.skills.length ? (
                profile.skills.map((skill) => (
                  <Chip key={skill} tone="primary">
                    {skill}
                  </Chip>
                ))
              ) : (
                <p className="text-ink-soft">None listed yet.</p>
              )}
            </div>
          </section>
          {profile.open_to.length > 0 && (
            <section className="rounded-card bg-block-mint p-6 text-block-ink">
              <h2 className="text-lg">Open to</h2>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {profile.open_to.map((option) => (
                  <li
                    key={option}
                    className="flex h-7 items-center rounded-full bg-block-ink px-3 text-[0.8125rem] font-medium text-[#f6f5ef]"
                  >
                    {option}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>

      <Section title="Projects">
        {!projects.data?.length ? (
          <EmptyState
            icon={FolderOpen}
            title="No projects yet"
            action={
              isMe ? (
                <ButtonLink to="/projects/new">Start a project</ButtonLink>
              ) : undefined
            }
          >
            {isMe
              ? "Projects you start or join appear here."
              : "Nothing public to show yet."}
          </EmptyState>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.data.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </Section>

      <Section title="Contribution records">
        {!records.data?.length ? (
          <EmptyState icon={Award} title="No records yet" tone="bg-block-coral">
            A verifiable record is issued for every project a member joins.
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
        open={messaging}
        onOpenChange={setMessaging}
      />
    </>
  );
}
