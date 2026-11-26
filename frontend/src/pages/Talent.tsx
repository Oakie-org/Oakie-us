import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";

import { useDebouncedParam, useSetParam } from "@/lib/hooks";
import { useCatalog, useTalent, type TalentFilters } from "@/lib/queries";
import { pluralize } from "@/lib/utils";
import { EmptyState, ErrorState } from "@/components/ui/feedback";
import { Input } from "@/components/ui/field";
import { PersonCard, PersonCardSkeleton } from "@/components/cards";
import {
  AppliedFilters,
  FacetMenu,
  type AppliedFilter,
} from "@/components/filters";
import { LoadMore, useTitle } from "@/components/page";

export default function Talent() {
  useTitle("People");
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useDebouncedParam("q");
  const setFilter = useSetParam();
  const { data: catalog } = useCatalog();

  const [uni, setUni] = useDebouncedParam("uni", 250);
  const [city, setCity] = useDebouncedParam("city", 250);
  const filters: TalentFilters = {
    q: params.get("q") || undefined,
    skill: params.get("skill") || undefined,
    open_to: params.get("open_to") || undefined,
    uni: params.get("uni") || undefined,
    city: params.get("city") || undefined,
  };
  const applied: AppliedFilter[] = [
    ["q", filters.q && `“${filters.q}”`],
    ["skill", filters.skill],
    ["open_to", filters.open_to && `Open to ${filters.open_to}`],
    ["uni", filters.uni && `Community: ${filters.uni}`],
    ["city", filters.city && `City: ${filters.city}`],
  ]
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([key, label]) => ({
      key,
      label,
      onRemove: () => setFilter(key, ""),
    }));
  const options = (values: string[] | undefined) =>
    (values ?? []).map((value) => ({ value, count: 0 }));
  const query = useTalent(filters);
  const people = query.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <>
      <header>
        <h1 className="text-3xl leading-tight sm:text-4xl">People</h1>
        <p className="mt-1.5 text-ink-soft">
          Filter by what they do, where they are and what they're open to.
        </p>
      </header>

      <div className="sticky top-14 z-30 -mx-4 mt-6 flex flex-col gap-3 border-b border-line bg-paper px-4 py-3 sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-[1.125rem] -translate-y-1/2 text-ink-mute"
              aria-hidden
            />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, skill or city"
              aria-label="Search people"
              className="pl-11"
              maxLength={80}
            />
          </div>
          <div
            role="group"
            aria-label="Filters"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
          >
            <FacetMenu
              label="Skill"
              value={filters.skill ?? ""}
              options={options(catalog?.skills)}
              onChange={(value) => setFilter("skill", value)}
              hideCounts
            />
            <FacetMenu
              label="Open to"
              value={filters.open_to ?? ""}
              options={options(catalog?.open_to)}
              onChange={(value) => setFilter("open_to", value)}
              hideCounts
            />
            <input
              value={uni}
              onChange={(event) => setUni(event.target.value)}
              placeholder="Community"
              aria-label="Community: a school, company or club"
              maxLength={80}
              className="h-10 w-36 shrink-0 rounded-field border border-line bg-surface px-3.5 text-sm font-medium placeholder:font-normal placeholder:text-ink-soft hover:border-ink-soft focus:border-primary focus:outline-none"
            />
            <input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="City"
              aria-label="City"
              maxLength={80}
              className="h-10 w-36 shrink-0 rounded-field border border-line bg-surface px-3.5 text-sm font-medium placeholder:font-normal placeholder:text-ink-soft hover:border-ink-soft focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="mb-4 mt-5 flex min-h-8 flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-sm font-medium" aria-live="polite">
          {query.isPending
            ? "Finding people…"
            : `${pluralize(people.length, "person", "people")}${
                query.hasNextPage ? "+" : ""
              }`}
        </p>
        <AppliedFilters
          filters={applied}
          onClear={() => setParams({}, { replace: true })}
        />
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
        <EmptyState title="No one matches yet">
          Try removing a filter. New members join every week.
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
