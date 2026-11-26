import { useState } from "react";
import {
  Flag,
  Megaphone,
  MoreHorizontal,
  Pencil,
  Plus,
  Rocket,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import { useAuth } from "@/auth/AuthProvider";
import { useDeletePost, useSavePost, useTimeline } from "@/lib/queries";
import type { ProjectDetail, TimelineKind, TimelinePost } from "@/lib/types";
import { formatDate, timeAgo } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  FormError,
  Skeleton,
} from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import {
  Dialog,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";
import { LoadMore } from "@/components/page";

const KIND: Record<TimelineKind, { label: string; icon: LucideIcon }> = {
  update: { label: "Update", icon: Megaphone },
  milestone: { label: "Milestone", icon: Flag },
  release: { label: "Release", icon: Rocket },
};

function PostDialog({
  projectId,
  post,
  open,
  onClose,
}: {
  projectId: string;
  post: TimelinePost | null;
  open: boolean;
  onClose: () => void;
}) {
  const save = useSavePost(projectId);
  const toast = useToast();
  const [title, setTitle] = useState(post?.title ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [kind, setKind] = useState<TimelineKind>(post?.kind ?? "update");
  const valid = title.trim() && content.trim();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={post ? "Edit update" : "Post an update"}
      description="Followers are notified when you post."
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!valid) return;
          save.mutate(
            {
              id: post?.id,
              title: title.trim(),
              content: content.trim(),
              kind,
              media_urls: post?.media_urls ?? [],
            },
            {
              onSuccess: () => {
                toast.success(post ? "Update saved" : "Update posted");
                onClose();
              },
            },
          );
        }}
      >
        <div className="grid gap-4 sm:grid-cols-[1fr_11rem]">
          <Field label="Headline" required>
            {(control) => (
              <Input
                {...control}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={120}
                autoFocus
              />
            )}
          </Field>
          <Field label="Type">
            {(control) => (
              <Select
                {...control}
                value={kind}
                onChange={(event) =>
                  setKind(event.target.value as TimelineKind)
                }
              >
                {Object.entries(KIND).map(([value, { label }]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        <Field label="What happened" required>
          {(control) => (
            <Textarea
              {...control}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength={4000}
              rows={6}
            />
          )}
        </Field>
        <FormError error={save.error} />
        <Button type="submit" loading={save.isPending} disabled={!valid}>
          {post ? "Save" : "Post update"}
        </Button>
      </form>
    </Dialog>
  );
}

export function UpdatesTab({ project }: { project: ProjectDetail }) {
  const { me } = useAuth();
  const timeline = useTimeline(project.id);
  const remove = useDeletePost(project.id);
  const toast = useToast();
  const [editing, setEditing] = useState<TimelinePost | "new" | null>(null);

  const isMember = project.viewer.role !== null;
  const canManage =
    project.viewer.role === "owner" || project.viewer.role === "admin";
  const posts = timeline.data?.pages.flatMap((page) => page.items) ?? [];
  const hidden = project.visibility !== "public" && !isMember;

  return (
    <div className="max-w-3xl">
      {isMember && (
        <div className="mb-6 flex justify-end">
          <Button onClick={() => setEditing("new")}>
            <Plus aria-hidden /> Post an update
          </Button>
        </div>
      )}

      {timeline.isError ? (
        <ErrorState
          error={timeline.error}
          onRetry={() => void timeline.refetch()}
        />
      ) : timeline.isPending ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-36 rounded-card" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          title={hidden ? "Updates are for the team" : "No updates yet"}
        >
          {hidden
            ? "This project shares its progress with members only."
            : isMember
              ? "Share a milestone, a release or what you learned this week."
              : "Follow the project to hear when the team posts."}
        </EmptyState>
      ) : (
        <ol className="relative flex flex-col gap-4 before:absolute before:bottom-6 before:left-[1.35rem] before:top-6 before:w-px before:bg-line">
          {posts.map((post) => {
            const { label, icon: Icon } = KIND[post.kind] ?? KIND.update;
            const mine = post.author?.id === me?.id;
            return (
              <li key={post.id} className="relative flex gap-4">
                <span className="z-10 flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink-soft ring-4 ring-paper">
                  <Icon className="size-5" aria-hidden />
                </span>
                <article className="min-w-0 flex-1 rounded-card border border-line bg-surface p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[0.8125rem] text-ink-mute">
                        {label} ·{" "}
                        <time
                          dateTime={post.created_at}
                          title={formatDate(post.created_at)}
                        >
                          {timeAgo(post.created_at)}
                        </time>
                      </p>
                      <h3 className="mt-1 font-serif text-[1.375rem] leading-[1.2]">
                        {post.title}
                      </h3>
                    </div>
                    {(mine || canManage) && (
                      <Menu>
                        <MenuTrigger
                          aria-label={`Actions for ${post.title}`}
                          className="-mr-2 -mt-2 flex size-11 shrink-0 items-center justify-center rounded-field text-ink-soft hover:bg-sunken"
                        >
                          <MoreHorizontal className="size-5" aria-hidden />
                        </MenuTrigger>
                        <MenuContent>
                          <MenuItem onSelect={() => setEditing(post)}>
                            <Pencil aria-hidden /> Edit
                          </MenuItem>
                          <MenuItem
                            danger
                            onSelect={() =>
                              remove.mutate(post.id, {
                                onSuccess: () =>
                                  toast.success("Update deleted"),
                                onError: (error) => toast.error(error),
                              })
                            }
                          >
                            <Trash2 aria-hidden /> Delete
                          </MenuItem>
                        </MenuContent>
                      </Menu>
                    )}
                  </div>
                  <p className="prose-plain mt-3">{post.content}</p>
                  {post.media_urls.length > 0 && (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {post.media_urls.map((url) => (
                        <img
                          key={url}
                          src={url}
                          alt=""
                          loading="lazy"
                          className="aspect-video w-full rounded-lg bg-sunken object-cover"
                        />
                      ))}
                    </div>
                  )}
                  {post.author && (
                    <p className="mt-4 flex items-center gap-2 text-sm text-ink-soft">
                      <Avatar user={post.author} size="xs" /> {post.author.name}
                    </p>
                  )}
                </article>
              </li>
            );
          })}
        </ol>
      )}
      <LoadMore
        hasMore={Boolean(timeline.hasNextPage)}
        loading={timeline.isFetchingNextPage}
        onLoadMore={() => void timeline.fetchNextPage()}
      />

      {editing && (
        <PostDialog
          key={editing === "new" ? "new" : editing.id}
          projectId={project.id}
          post={editing === "new" ? null : editing}
          open
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
