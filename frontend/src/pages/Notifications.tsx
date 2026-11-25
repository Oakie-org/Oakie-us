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

const KIND: Record<string, { icon: LucideIcon; tone: string }> = {
  "application.received": { icon: UserPlus, tone: "bg-block-sky" },
  "application.approved": { icon: UserCheck, tone: "bg-block-mint" },
  "application.rejected": { icon: UserX, tone: "bg-block-sand" },
  "user.followed": { icon: UserPlus, tone: "bg-block-pink" },
  "project.followed": { icon: UserPlus, tone: "bg-block-lilac" },
  "project.update": { icon: Megaphone, tone: "bg-block-sun" },
  "task.assigned": { icon: ClipboardList, tone: "bg-block-aqua" },
  "member.removed": { icon: UserX, tone: "bg-block-sand" },
};

function NotificationRow({
  notification,
  onOpen,
}: {
  notification: Notification;
  onOpen: () => void;
}) {
  const { icon: Icon, tone } = KIND[notification.kind] ?? {
    icon: Bell,
    tone: "bg-block-sand",
  };
  return (
    <li>
      <Link
        to={notification.link || "/notifications"}
        onClick={onOpen}
        className={cn(
          "flex items-start gap-4 rounded-card border-2 p-4 transition-colors hover:border-ink",
          notification.read
            ? "border-transparent bg-transparent"
            : "border-transparent bg-surface",
        )}
      >
        <span className="relative shrink-0">
          {notification.actor ? (
            <Avatar user={notification.actor} />
          ) : (
            <span
              className={cn(
                "flex size-11 items-center justify-center rounded-full text-block-ink",
                tone,
              )}
            >
              <Icon className="size-5" aria-hidden />
            </span>
          )}
          {notification.actor && (
            <span
              className={cn(
                "absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full text-block-ink ring-2 ring-paper",
                tone,
              )}
            >
              <Icon className="size-3" aria-hidden />
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn("block", !notification.read && "font-semibold")}>
            {notification.title}
          </span>
          {notification.body && (
            <span className="mt-0.5 line-clamp-2 block text-sm text-ink-soft">
              {notification.body}
            </span>
          )}
          <span className="mt-1 block text-sm text-ink-soft">
            {timeAgo(notification.created_at)}
          </span>
        </span>
        {!notification.read && (
          <span className="mt-2 size-2.5 shrink-0 rounded-full bg-accent">
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
    <div className="mx-auto max-w-2xl">
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
        <EmptyState icon={Bell} title="Nothing yet" tone="bg-block-sun">
          Applications, new followers and team updates will show up here.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
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
