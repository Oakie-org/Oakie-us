import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Link, NavLink, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, SendHorizontal } from "lucide-react";

import { useAuth } from "@/auth/AuthProvider";
import { ApiError } from "@/lib/api";
import {
  keys,
  useConversations,
  useSendMessage,
  useThread,
} from "@/lib/queries";
import type { Conversation, Message } from "@/lib/types";
import { cn, formatDate, formatTime, timeAgo } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  Skeleton,
  Spinner,
} from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { useTitle } from "@/components/page";

function ConversationList({
  conversations,
  myId,
}: {
  conversations: Conversation[];
  myId: string | undefined;
}) {
  return (
    <ul className="flex flex-col gap-1">
      {conversations.map((conversation) => (
        <li key={conversation.id}>
          <NavLink
            to={`/messages/${conversation.id}`}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-field p-3 transition-colors",
                isActive ? "bg-sunken" : "hover:bg-sunken",
              )
            }
          >
            {({ isActive }) => (
              <>
                <Avatar user={conversation.peer} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-medium">
                      {conversation.peer.name}
                    </span>
                    <span className="shrink-0 text-xs text-ink-mute">
                      {timeAgo(conversation.last_at)}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "block truncate text-sm",
                      conversation.unread
                        ? "font-medium text-ink"
                        : "text-ink-soft",
                    )}
                  >
                    {conversation.last_sender_id === myId && "You: "}
                    {conversation.last_message}
                  </span>
                </span>
                {conversation.unread > 0 && !isActive && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[0.6875rem] font-medium text-on-accent">
                    {conversation.unread}
                    <span className="sr-only"> unread</span>
                  </span>
                )}
              </>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

function Bubble({ message, mine }: { message: Message; mine: boolean }) {
  return (
    <li className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
      <p
        className={cn(
          "prose-plain max-w-[min(34rem,85%)] rounded-card px-4 py-2.5",
          mine
            ? "rounded-br-lg bg-primary text-on-primary"
            : "rounded-bl-lg bg-sunken",
        )}
      >
        {message.body}
      </p>
      <time
        dateTime={message.created_at}
        className="mt-1 px-2 text-xs text-ink-soft"
      >
        {formatTime(message.created_at)}
      </time>
    </li>
  );
}

const dayOf = (message: Message) =>
  formatDate(message.created_at, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

function Thread({ id }: { id: string }) {
  const { me } = useAuth();
  const thread = useThread(id);
  const send = useSendMessage(id);
  const toast = useToast();
  const [draft, setDraft] = useState("");
  const list = useRef<HTMLOListElement>(null);
  const client = useQueryClient();
  const count = thread.data?.messages.length ?? 0;
  const loaded = thread.isSuccess;

  // Keep the newest message in view without scrolling the page itself.
  useEffect(() => {
    if (list.current) list.current.scrollTop = list.current.scrollHeight;
  }, [count, id]);

  // Opening a thread marks it read on the server; refresh the unread badges.
  useEffect(() => {
    if (!loaded) return;
    void client.invalidateQueries({ queryKey: keys.inbox });
    void client.invalidateQueries({ queryKey: keys.conversations });
  }, [loaded, id, client]);

  function submit() {
    const body = draft.trim();
    if (!body || send.isPending) return;
    setDraft("");
    send.mutate(body, {
      onError: (error) => {
        setDraft(body);
        toast.error(error);
      },
    });
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      submit();
    }
  }

  if (thread.isPending)
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="size-7" />
      </div>
    );
  if (thread.isError) {
    const missing =
      thread.error instanceof ApiError && thread.error.status === 404;
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        {missing ? (
          <p className="text-ink-soft">This conversation doesn't exist.</p>
        ) : (
          <ErrorState
            error={thread.error}
            onRetry={() => void thread.refetch()}
          />
        )}
        <ButtonLink to="/messages" variant="outline">
          All messages
        </ButtonLink>
      </div>
    );
  }

  const { conversation, messages } = thread.data;
  return (
    <>
      <header className="flex items-center gap-3 border-b border-line p-3 sm:p-4">
        <Link
          to="/messages"
          aria-label="All messages"
          className="flex size-11 items-center justify-center rounded-field hover:bg-sunken md:hidden"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <Link
          to={`/u/${conversation.peer.id}`}
          className="group flex min-w-0 items-center gap-3"
        >
          <Avatar user={conversation.peer} />
          <span className="min-w-0">
            <span className="block truncate font-medium group-hover:underline">
              {conversation.peer.name}
            </span>
            <span className="block truncate text-sm text-ink-soft">
              {conversation.peer.headline}
            </span>
          </span>
        </Link>
      </header>

      <ol
        ref={list}
        className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 sm:p-6"
        aria-label={`Conversation with ${conversation.peer.name}`}
      >
        {messages.flatMap((message, index) => {
          const day = dayOf(message);
          const divider = index === 0 || dayOf(messages[index - 1]) !== day;
          return [
            divider && (
              <li
                key={`day-${message.id}`}
                className="my-2 text-center text-[0.8125rem] text-ink-mute"
              >
                {day}
              </li>
            ),
            <Bubble
              key={message.id}
              message={message}
              mine={message.sender_id === me?.id}
            />,
          ];
        })}
      </ol>

      <form
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          submit();
        }}
        className="flex items-end gap-2 border-t border-line p-3 sm:p-4"
      >
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          maxLength={4000}
          placeholder={`Message ${conversation.peer.name.split(" ")[0]}`}
          aria-label="Message"
          className="max-h-40 min-h-12 flex-1 resize-none rounded-card border border-line bg-surface px-4 py-2.5 text-base outline-none transition-colors [field-sizing:content] placeholder:text-ink-soft/70 focus:border-primary"
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Send"
          className="size-12"
          disabled={!draft.trim()}
        >
          <SendHorizontal aria-hidden />
        </Button>
      </form>
    </>
  );
}

export default function Messages() {
  useTitle("Messages");
  const { id } = useParams();
  const { me } = useAuth();
  const conversations = useConversations();

  return (
    <div className="-mx-4 -mt-8 flex h-[calc(100dvh-4rem-5rem)] sm:mx-0 sm:mt-0 md:h-[calc(100dvh-10rem)] md:min-h-[28rem] md:gap-5">
      <aside
        className={cn(
          "w-full flex-col overflow-y-auto bg-paper p-4 md:flex md:w-80 md:shrink-0 md:rounded-card border border-line md:bg-surface",
          id ? "hidden" : "flex",
        )}
      >
        <h1 className="mb-4 px-1 text-3xl leading-tight">Messages</h1>
        {conversations.isPending ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-16 rounded-field" />
            ))}
          </div>
        ) : conversations.isError ? (
          <ErrorState
            error={conversations.error}
            onRetry={() => void conversations.refetch()}
          />
        ) : conversations.data.length === 0 ? (
          <EmptyState
            title="No conversations yet"
            action={<ButtonLink to="/talent">Find people</ButtonLink>}
          >
            Open someone's profile and say hello.
          </EmptyState>
        ) : (
          <ConversationList conversations={conversations.data} myId={me?.id} />
        )}
      </aside>

      <section
        className={cn(
          "min-w-0 flex-1 flex-col overflow-hidden bg-surface md:flex md:rounded-card border border-line",
          id ? "flex" : "hidden",
        )}
      >
        {id ? (
          <Thread key={id} id={id} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <p className="font-medium">Pick a conversation</p>
            <p className="mt-1 text-ink-soft">
              Or start one from anyone's profile
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
