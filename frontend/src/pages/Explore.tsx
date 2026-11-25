import { useSearchParams } from "react-router-dom";
import { Plus, Search, SearchX, X } from "lucide-react";

import { useDebouncedParam, useSetParam } from "@/lib/hooks";
import { useCatalog, useProjects, type ProjectFilters } from "@/lib/queries";
import { pluralize } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/field";
import { ProjectCard, ProjectCardSkeleton } from "@/components/cards";
import { FilterPills, LoadMore, PageHeader, useTitle } from "@/components/page";

export default function Explore() {
  useTitle("Explore projects");
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useDebouncedParam("q");
  const setFilter = useSetParam();
  const { data: catalog } = useCatalog();

  const filters: ProjectFilters = {
    q: params.get("q") ?? undefined,
    category: params.get("category") ?? undefined,
    status: params.get("status") ?? undefined,
  };
  const active = Object.values(filters).filter(Boolean).length;
  const query = useProjects(filters);
  const projects = query.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <>
      <PageHeader
        title="Explore projects"
        lead="Software, quant funds, film crews, zines, community events. Find a team that needs exactly what you're good at."
        action={
          <ButtonLink to="/projects/new">
            <Plus aria-hidden /> Start a project
          </ButtonLink>
        }
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-soft"
              aria-hidden
            />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title, skill, school or city"
              aria-label="Search projects"
              className="pl-12"
              maxLength={80}
            />
          </div>
          <div className="sm:w-52">
            <Select
              aria-label="Stage"
              value={filters.status ?? ""}
              onChange={(event) => setFilter("status", event.target.value)}
            >
              <option value="">Any stage</option>
              {catalog?.statuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </Select>
          </div>
        </div>
        <FilterPills
          label="Discipline"
          allLabel="All disciplines"
          options={catalog?.categories ?? []}
          value={filters.category ?? ""}
          onChange={(value) => setFilter("category", value)}
        />
      </div>

      <div
        className="mb-4 mt-8 flex min-h-9 items-center justify-between gap-3"
        aria-live="polite"
      >
        <p className="text-sm text-ink-soft">
          {query.isPending
            ? "Finding projects…"
            : `${pluralize(projects.length, "project")}${
                query.hasNextPage ? " so far" : ""
              }${active ? " matching your filters" : ""}`}
        </p>
        {active > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setParams({}, { replace: true })}
          >
            <X aria-hidden /> Clear filters
          </Button>
        )}
      </div>

      {query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : query.isPending ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy>
          {Array.from({ length: 6 }, (_, index) => (
            <ProjectCardSkeleton key={index} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={active ? "Nothing matches those filters" : "No projects yet"}
          tone="bg-block-sky"
          action={<ButtonLink to="/projects/new">Start a project</ButtonLink>}
        >
          {active
            ? "Try a broader search, or be the first to start this kind of project."
            : "Be the first to put an idea on the island."}
        </EmptyState>
      ) : (
        <>
          <div className="stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
          <LoadMore
            hasMore={Boolean(query.hasNextPage)}
            loading={query.isFetchingNextPage}
            onLoadMore={() => void query.fetchNextPage()}
          />
        </>
      )}
    </>
  );
}
