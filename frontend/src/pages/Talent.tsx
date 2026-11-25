import { useSearchParams } from "react-router-dom";
import { Search, UserSearch, X } from "lucide-react";

import { useDebouncedParam, useSetParam } from "@/lib/hooks";
import { useCatalog, useTalent, type TalentFilters } from "@/lib/queries";
import { pluralize } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/field";
import { PersonCard, PersonCardSkeleton } from "@/components/cards";
import { FilterPills, LoadMore, PageHeader, useTitle } from "@/components/page";

export default function Talent() {
  useTitle("People");
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useDebouncedParam("q");
  const setFilter = useSetParam();
  const { data: catalog } = useCatalog();

  const filters: TalentFilters = {
    q: params.get("q") ?? undefined,
    skill: params.get("skill") ?? undefined,
    open_to: params.get("open_to") ?? undefined,
  };
  const active = Object.values(filters).filter(Boolean).length;
  const query = useTalent(filters);
  const people = query.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <>
      <PageHeader
        title="Find your people"
        lead="The engineer for your strategy, the editor for your script, the co-founder for your idea. Filter by what they do and what they're open to."
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
              placeholder="Search by name, school, city or skill"
              aria-label="Search people"
              className="pl-12"
              maxLength={80}
            />
          </div>
          <div className="sm:w-52">
            <Select
              aria-label="Open to"
              value={filters.open_to ?? ""}
              onChange={(event) => setFilter("open_to", event.target.value)}
            >
              <option value="">Open to anything</option>
              {catalog?.open_to.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </Select>
          </div>
        </div>
        <FilterPills
          label="Skill"
          allLabel="All skills"
          options={catalog?.skills ?? []}
          value={filters.skill ?? ""}
          onChange={(value) => setFilter("skill", value)}
        />
      </div>

      <div
        className="mb-4 mt-8 flex min-h-9 items-center justify-between gap-3"
        aria-live="polite"
      >
        <p className="text-sm text-ink-soft">
          {query.isPending
            ? "Finding people…"
            : `${pluralize(people.length, "person", "people")}${
                query.hasNextPage ? " so far" : ""
              }`}
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
            <PersonCardSkeleton key={index} />
          ))}
        </div>
      ) : people.length === 0 ? (
        <EmptyState
          icon={UserSearch}
          title="No one matches yet"
          tone="bg-block-lilac"
        >
          Try removing a filter. New members join every week.
        </EmptyState>
      ) : (
        <>
          <div className="stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {people.map((person) => (
              <PersonCard key={person.id} person={person} />
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
