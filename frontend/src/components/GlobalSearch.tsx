import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ArrowRight,
  Clock,
  CornerDownLeft,
  FileText,
  Search,
  Sparkles,
} from "lucide-react";

import { useSuggestions } from "@/lib/queries";
import { cn, readStored, writeStored } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { StatusDot } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/feedback";
import type { ProjectStatus } from "@/lib/types";

const RECENT_KEY = "oakie:recent-searches";

interface Row {
  key: string;
  to: string;
  node: ReactNode;
}

interface Group {
  title: string;
  rows: Row[];
}

function useDebounced<T>(value: T, delay: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return settled;
}

function Line({
  icon,
  title,
  detail,
  trailing,
}: {
  icon: ReactNode;
  title: ReactNode;
  detail?: string;
  trailing?: ReactNode;
}) {
  return (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sunken text-ink-soft">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="truncate">{title}</span>
        </span>
        {detail && (
          <span className="block truncate text-sm text-ink-soft">{detail}</span>
        )}
      </span>
      {trailing}
    </>
  );
}

function Palette({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [cursor, setCursor] = useState(0);
  const [recent, setRecent] = useState(() =>
    readStored<string[]>(RECENT_KEY, []),
  );
  const list = useRef<HTMLDivElement>(null);
  const term = useDebounced(text, 200).trim();
  const typed = text.trim();
  const suggestions = useSuggestions(term);
  const data =
    term.length >= 2 && typed.length >= 2 ? suggestions.data : undefined;
  const waiting =
    typed.length >= 2 && (term !== typed || suggestions.isFetching);

  const groups: Group[] = [];
  if (typed.length < 2) {
    if (recent.length) {
      groups.push({
        title: "Recent",
        rows: recent.map((query) => ({
          key: `recent-${query}`,
          to: `/explore?q=${encodeURIComponent(query)}`,
          node: (
            <Line
              icon={<Clock className="size-4" aria-hidden />}
              title={query}
            />
          ),
        })),
      });
    }
    groups.push({
      title: "Jump to",
      rows: [
        {
          key: "open",
          to: "/explore?open=1",
          node: (
            <Line
              icon={<Sparkles className="size-4" aria-hidden />}
              title="Teams with open seats"
            />
          ),
        },
        {
          key: "new",
          to: "/explore?posted=7",
          node: (
            <Line
              icon={<Sparkles className="size-4" aria-hidden />}
              title="Posted this week"
            />
          ),
        },
        {
          key: "cofounder",
          to: "/talent?open_to=Co-founder",
          node: (
            <Line
              icon={<Sparkles className="size-4" aria-hidden />}
              title="People open to co-founding"
            />
          ),
        },
      ],
    });
  } else if (data) {
    if (data.projects.length) {
      groups.push({
        title: "Projects",
        rows: data.projects.map((project) => ({
          key: `project-${project.id}`,
          to: `/projects/${project.id}`,
          node: (
            <Line
              icon={<FileText className="size-4" aria-hidden />}
              title={project.title}
              detail={project.subtitle || project.category}
              trailing={
                <StatusDot
                  status={project.status as ProjectStatus}
                  className="hidden sm:inline-flex"
                />
              }
            />
          ),
        })),
      });
    }
    if (data.people.length) {
      groups.push({
        title: "People",
        rows: data.people.map((person) => ({
          key: `person-${person.id}`,
          to: `/u/${person.id}`,
          node: (
            <>
              <Avatar user={person} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="truncate">{person.name}</span>
                </span>
                <span className="block truncate text-sm text-ink-soft">
                  {person.headline || person.city}
                </span>
              </span>
            </>
          ),
        })),
      });
    }
    if (data.skills.length) {
      groups.push({
        title: "Skills",
        rows: data.skills.flatMap((skill) => [
          {
            key: `skill-projects-${skill}`,
            to: `/explore?skill=${encodeURIComponent(skill)}`,
            node: (
              <Line
                icon={<Search className="size-4" aria-hidden />}
                title={`Projects that need ${skill}`}
              />
            ),
          },
          {
            key: `skill-people-${skill}`,
            to: `/talent?skill=${encodeURIComponent(skill)}`,
            node: (
              <Line
                icon={<Search className="size-4" aria-hidden />}
                title={`People who do ${skill}`}
              />
            ),
          },
        ]),
      });
    }
  }
  if (typed.length >= 2) {
    groups.push({
      title: "Search",
      rows: [
        {
          key: "all-projects",
          to: `/explore?q=${encodeURIComponent(typed)}`,
          node: (
            <Line
              icon={<ArrowRight className="size-4" aria-hidden />}
              title={<>All projects matching “{typed}”</>}
            />
          ),
        },
        {
          key: "all-people",
          to: `/talent?q=${encodeURIComponent(typed)}`,
          node: (
            <Line
              icon={<ArrowRight className="size-4" aria-hidden />}
              title={<>All people matching “{typed}”</>}
            />
          ),
        },
      ],
    });
  }
  const rows = groups.flatMap((group) => group.rows);
  const active = Math.min(cursor, Math.max(0, rows.length - 1));

  function go(to: string) {
    if (typed.length >= 2) {
      const next = [
        typed,
        ...recent.filter(
          (query) => query.toLowerCase() !== typed.toLowerCase(),
        ),
      ].slice(0, 5);
      setRecent(next);
      writeStored(RECENT_KEY, next);
    }
    onClose();
    navigate(to);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const next =
        (active + (event.key === "ArrowDown" ? 1 : -1) + rows.length) %
        Math.max(1, rows.length);
      setCursor(next);
      list.current
        ?.querySelector(`[data-index="${next}"]`)
        ?.scrollIntoView({ block: "nearest" });
    } else if (event.key === "Enter") {
      event.preventDefault();
      // Enter with nothing highlighted by the user means "search for what I typed".
      const target =
        cursor === 0 && typed.length >= 2 && !data
          ? `/explore?q=${encodeURIComponent(typed)}`
          : rows[active]?.to;
      if (target) go(target);
    }
  }

  let index = -1;
  return (
    <>
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Search className="size-5 shrink-0 text-ink-soft" aria-hidden />
        <input
          autoFocus
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setCursor(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search projects, people and skills"
          aria-label="Search Oakie"
          role="combobox"
          aria-expanded
          aria-controls="global-search-results"
          aria-activedescendant={
            rows[active] ? `gs-${rows[active].key}` : undefined
          }
          maxLength={80}
          className="h-14 min-w-0 flex-1 bg-transparent text-lg outline-none placeholder:text-ink-soft/70"
        />
        {waiting ? (
          <Spinner className="size-5 text-ink-soft" />
        ) : (
          <kbd className="hidden rounded-md border border-line px-1.5 py-0.5 text-xs text-ink-soft sm:block">
            esc
          </kbd>
        )}
      </div>

      <div
        ref={list}
        id="global-search-results"
        role="listbox"
        className="max-h-[min(26rem,60dvh)] overflow-y-auto p-2"
      >
        {groups.map((group) => (
          <div
            key={group.title}
            role="group"
            aria-label={group.title}
            className="pb-1"
          >
            <p className="px-3 pb-1 pt-2 text-[0.8125rem] text-ink-mute">
              {group.title}
            </p>
            {group.rows.map((row) => {
              index += 1;
              const position = index;
              return (
                <button
                  key={row.key}
                  id={`gs-${row.key}`}
                  type="button"
                  role="option"
                  aria-selected={position === active}
                  data-index={position}
                  onMouseMove={() => position !== active && setCursor(position)}
                  onClick={() => go(row.to)}
                  className={cn(
                    "flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-1.5 text-left",
                    position === active && "bg-sunken",
                  )}
                >
                  {row.node}
                  {position === active && (
                    <CornerDownLeft
                      className="size-4 shrink-0 text-ink-soft"
                      aria-hidden
                    />
                  )}
                </button>
              );
            })}
          </div>
        ))}
        {typed.length >= 2 &&
          data &&
          data.projects.length + data.people.length + data.skills.length ===
            0 && (
            <p className="px-3 pb-3 text-sm text-ink-soft">
              No quick matches. Press Enter to search everything.
            </p>
          )}
      </div>
    </>
  );
}

/**
 * Search from anywhere: a field in the top bar that opens a palette with
 * instant, grouped suggestions. Opens with ⌘K, Ctrl+K or "/".
 */
export function GlobalSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target?.closest(
        "input, textarea, select, [contenteditable=true]",
      );
      if (
        (event.key === "k" && (event.metaKey || event.ctrlKey)) ||
        (event.key === "/" && !typing)
      ) {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger
        aria-label="Search"
        className="flex size-11 items-center justify-center rounded-field text-ink transition-colors hover:bg-sunken lg:h-10 lg:w-64 lg:justify-start lg:gap-2 lg:border lg:border-line lg:bg-surface lg:px-3.5 lg:text-ink-soft lg:hover:border-ink-soft lg:hover:bg-surface"
      >
        <Search className="size-5 lg:size-4" aria-hidden />
        <span className="hidden flex-1 text-left text-sm lg:block">
          Search Oakie
        </span>
        <kbd className="hidden rounded-md border border-line px-1.5 text-xs lg:block">
          ⌘K
        </kbd>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 animate-fade bg-black/40" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-x-3 top-3 z-50 animate-pop overflow-hidden rounded-card border border-line bg-surface shadow-float outline-none sm:inset-x-auto sm:left-1/2 sm:top-[12vh] sm:w-[min(38rem,calc(100vw-2rem))] sm:-translate-x-1/2"
        >
          <DialogPrimitive.Title className="sr-only">
            Search Oakie
          </DialogPrimitive.Title>
          {/* Mounted per opening so every search starts clean. */}
          <Palette onClose={() => setOpen(false)} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
