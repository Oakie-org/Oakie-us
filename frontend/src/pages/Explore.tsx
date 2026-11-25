import { useSearchParams } from "react-router-dom";
import { Plus, Search, SearchX } from "lucide-react";

import { useDebouncedParam, useSetParam } from "@/lib/hooks";
import {
  useProjectFacets,
  useProjects,
  type ProjectFilters,
} from "@/lib/queries";
import { cn, pluralize } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/feedback";
import { Input } from "@/components/ui/field";
import { ProjectCard, ProjectCardSkeleton } from "@/components/cards";
import {
  AppliedFilters,
  FacetMenu,
  FilterToggle,
  type AppliedFilter,
} from "@/components/filters";
import { LoadMore, useTitle } from "@/components/page";
import { ProjectPreview } from "@/components/ProjectPreview";

const POSTED = [
  { value: "7", label: "This week" },
  { value: "30", label: "This month" },
  { value: "90", label: "Last 3 months" },
];

export default function Explore() {
  useTitle("Explore projects");
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useDebouncedParam("q", 250);
  const setParam = useSetParam();
  const get = (key: string) => params.get(key) ?? "";

  const filters: ProjectFilters = {
    q: get("q") || undefined,
    category: get("category") || undefined,
    status: get("status") || undefined,
    skill: get("skill") || undefined,
    uni: get("uni") || undefined,
    city: get("city") || undefined,
    remote: get("remote") === "1" ? true : undefined,
    open_only: get("open") === "1" ? true : undefined,
    within_days: Number(get("posted")) || undefined,
  };
  const query = useProjects(filters);
  const facets = useProjectFacets(filters);
  const projects = query.data?.pages.flatMap((page) => page.items) ?? [];
  const total = facets.data?.total;

  const applied: AppliedFilter[] = [
    ["q", filters.q && `“${filters.q}”`],
    ["category", filters.category],
    ["status", filters.status],
    ["skill", filters.skill && `Needs ${filters.skill}`],
    ["uni", filters.uni],
    ["city", filters.city],
    ["open", filters.open_only && "Open seats"],
    ["remote", filters.remote && "Remote friendly"],
    [
      "posted",
      filters.within_days &&
        POSTED.find((option) => option.value === get("posted"))?.label,
    ],
  ]
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([key, label]) => ({ key, label, onRemove: () => setParam(key, "") }));

  // Filters reset; an open preview is unrelated and survives.
  const clear = () =>
    setParams(
      params.get("preview") ? { preview: params.get("preview")! } : {},
      { replace: true },
    );
  const preview = (id: string | null) =>
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (id) next.set("preview", id);
      else next.delete("preview");
      return next;
    });

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl">Explore projects</h1>
          <p className="mt-1.5 text-ink-soft">
            Find a team that needs what you're good at.
          </p>
        </div>
        <ButtonLink to="/projects/new" variant="outline">
          <Plus aria-hidden /> Start a project
        </ButtonLink>
      </header>

      <div className="sticky top-16 z-30 -mx-4 mt-6 flex flex-col gap-3 border-b border-line bg-paper px-4 py-3 sm:-mx-6 sm:px-6">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-soft"
            aria-hidden
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title, role, skill, school or city"
            aria-label="Search projects"
            className="h-12 pl-12"
            maxLength={80}
          />
        </div>
        <div
          role="group"
          aria-label="Filters"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
        >
          <FacetMenu
            label="Discipline"
            value={filters.category ?? ""}
            options={facets.data?.category ?? []}
            onChange={(value) => setParam("category", value)}
          />
          <FacetMenu
            label="Skill needed"
            value={filters.skill ?? ""}
            options={facets.data?.skill ?? []}
            onChange={(value) => setParam("skill", value)}
          />
          <FacetMenu
            label="Stage"
            value={filters.status ?? ""}
            options={facets.data?.status ?? []}
            onChange={(value) => setParam("status", value)}
          />
          <FacetMenu
            label="School"
            value={filters.uni ?? ""}
            options={facets.data?.uni ?? []}
            onChange={(value) => setParam("uni", value)}
          />
          <FacetMenu
            label="City"
            value={filters.city ?? ""}
            options={facets.data?.city ?? []}
            onChange={(value) => setParam("city", value)}
          />
          <FilterToggle
            active={Boolean(filters.open_only)}
            onChange={(on) => setParam("open", on ? "1" : "")}
          >
            Open seats
          </FilterToggle>
          <FilterToggle
            active={Boolean(filters.remote)}
            onChange={(on) => setParam("remote", on ? "1" : "")}
          >
            Remote friendly
          </FilterToggle>
          <label className="relative shrink-0">
            <span className="sr-only">Posted</span>
            <select
              value={get("posted")}
              onChange={(event) => setParam("posted", event.target.value)}
              className={cn(
                "h-10 appearance-none rounded-full border px-3.5 text-sm font-medium transition-colors",
                get("posted")
                  ? "border-ink bg-ink text-paper"
                  : "border-line bg-surface text-ink hover:border-ink-soft",
              )}
            >
              <option value="">Posted any time</option>
              {POSTED.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mb-4 mt-5 flex min-h-8 flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-sm font-medium text-ink" aria-live="polite">
          {total === undefined
            ? "Finding projects…"
            : pluralize(total, "project")}
        </p>
        <AppliedFilters filters={applied} onClear={clear} />
      </div>

      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : query.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy>
          {Array.from({ length: 6 }, (_, index) => (
            <ProjectCardSkeleton key={index} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={
            applied.length ? "Nothing matches those filters" : "No projects yet"
          }
          action={
            <div className="flex flex-wrap justify-center gap-3">
              {applied.length > 0 && (
                <ButtonLink to="/explore" variant="outline" replace>
                  Clear filters
                </ButtonLink>
              )}
              <ButtonLink to="/projects/new">
                Start this project yourself
              </ButtonLink>
            </div>
          }
        >
          {applied.length
            ? "Remove a filter to widen the search. Or maybe this is the project you should start."
            : "Be the first to put an idea on the island."}
        </EmptyState>
      ) : (
        <>
          {/* Dims while a new filter is loading, so the list never flashes empty. */}
          <div
            className={cn(
              "grid gap-4 transition-opacity duration-200 sm:grid-cols-2 lg:grid-cols-3",
              query.isPlaceholderData && "opacity-50",
            )}
          >
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onPreview={preview}
              />
            ))}
          </div>
          <LoadMore
            hasMore={Boolean(query.hasNextPage)}
            loading={query.isFetchingNextPage}
            onLoadMore={() => void query.fetchNextPage()}
          />
        </>
      )}

      <ProjectPreview
        id={params.get("preview")}
        onClose={() => preview(null)}
      />
    </>
  );
}
