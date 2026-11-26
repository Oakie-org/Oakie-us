import { Link } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  ClipboardList,
  Megaphone,
  UserCheck,
  UserPlus,
  UserX,
  type LucideIcon,
} from "lucide-react";

import { useMarkNotificationsRead, useNotifications } from "@/lib/queries";
import type { Notification } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/feedback";
import { PageHeader, useTitle } from "@/components/page";

const KIND: Record<string, LucideIcon> = {
  "application.received": UserPlus,
  "application.approved": UserCheck,
  "application.rejected": UserX,
  "user.followed": UserPlus,
  "project.followed": UserPlus,
  "project.update": Megaphone,
  "task.assigned": ClipboardList,
  "member.removed": UserX,
};

function NotificationRow({
  notification,
  onOpen,
}: {
  notification: Notification;
  onOpen: () => void;
}) {
  const Icon = KIND[notification.kind] ?? Bell;
  return (
    <li>
      <Link
        to={notification.link || "/notifications"}
        onClick={onOpen}
        className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-sunken sm:px-5"
      >
        <span className="relative shrink-0">
          {notification.actor ? (
            <Avatar user={notification.actor} />
          ) : (
            <span className="flex size-11 items-center justify-center rounded-full border border-line bg-sunken text-ink-soft">
              <Icon className="size-5" aria-hidden />
            </span>
          )}
          {notification.actor && (
            <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border border-line bg-surface text-ink-soft">
              <Icon className="size-3" aria-hidden />
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block",
              notification.read ? "text-ink-soft" : "font-medium",
            )}
          >
            {notification.title}
          </span>
          {notification.body && (
            <span className="mt-0.5 line-clamp-2 block text-sm text-ink-soft">
              {notification.body}
            </span>
          )}
          <span className="mt-1 block text-[0.8125rem] text-ink-mute">
            {timeAgo(notification.created_at)}
          </span>
        </span>
        {!notification.read && (
          <span className="mt-2 size-2 shrink-0 rounded-full bg-accent">
            <span className="sr-only">Unread</span>
          </span>
        )}
      </Link>
    </li>
  );
}

export default function Notifications() {
  useTitle("Notifications");
  const query = useNotifications();
  const markRead = useMarkNotificationsRead();
  const unread = query.data?.unread_count ?? 0;

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Notifications"
        lead={unread > 0 ? `${unread} unread` : "You're all caught up."}
        action={
          unread > 0 && (
            <Button
              variant="outline"
              size="sm"
              loading={markRead.isPending}
              onClick={() => markRead.mutate(undefined)}
            >
              <CheckCheck aria-hidden /> Mark all read
            </Button>
          )
        }
      />
      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : query.isPending ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-20 rounded-card" />
          ))}
        </div>
      ) : query.data.items.length === 0 ? (
        <EmptyState title="Nothing yet">
          Applications, new followers and team updates will show up here.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
          {query.data.items.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onOpen={() =>
                !notification.read && markRead.mutate([notification.id])
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}
