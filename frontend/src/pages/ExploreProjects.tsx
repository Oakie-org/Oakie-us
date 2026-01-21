import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FunnelPlusIcon, Loader2 } from "lucide-react";

import ProjectCard from "@/components/features/ProjectCard";
import { MOCK_PROJECTS } from "@/data/mockProjects";
import {
  listProjectsCursor,
  type ProjectCursorFilters,
  type ProjectsCursorResponse,
} from "@/lib/api";
import type { Project } from "@/types";
import { RippleButton } from "@/components/ui/ripple-button";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import styles from "./ExploreProjects.module.css";

const QUICK_FILTER_TAGS = ["Web", "Mobile", "Finance", "AI", "Startup"];
const PAGE_SIZE = 10;

export const ExploreProjects: React.FC = () => {
  const navigate = useNavigate();

  // Filter state
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Data state
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);

  // Refs for infinite scroll (to avoid stale closures)
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const nextCursorRef = useRef<string | null>(null);
  const hasMoreRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const loadingRef = useRef(true);
  const activeTagRef = useRef<string | null>(null);

  // Keep refs in sync with state
  nextCursorRef.current = nextCursor;
  hasMoreRef.current = hasMore;
  loadingMoreRef.current = loadingMore;
  loadingRef.current = loading;
  activeTagRef.current = activeTag;

  // Fetch projects function
  const fetchProjects = useCallback(async (cursor?: string | null) => {
    const isInitialLoad = !cursor;

    if (isInitialLoad) {
      setLoading(true);
      setProjects([]);
    } else {
      setLoadingMore(true);
    }

    const filters: ProjectCursorFilters = {
      page_size: PAGE_SIZE,
      cursor: cursor ?? undefined,
    };
    if (activeTagRef.current) {
      filters.tag = activeTagRef.current;
    }

    let shouldRecurse = false;

    try {
      const response: ProjectsCursorResponse =
        await listProjectsCursor(filters);

      if (isInitialLoad) {
        setProjects(response.items);
      } else {
        setProjects((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newItems = response.items.filter((p) => !existingIds.has(p.id));
          return [...prev, ...newItems];
        });
      }

      setNextCursor(response.next_cursor);
      setHasMore(response.has_more);
      setUsingMockData(false);

      // If we got 0 items but there are more pages, fetch the next page immediately
      // This handles "sparse" pages caused by filtering
      if (
        response.items.length === 0 &&
        response.has_more &&
        response.next_cursor
      ) {
        shouldRecurse = true;
        fetchProjects(response.next_cursor);
        return;
      }

      console.log(
        "Fetched projects:",
        response.items.length,
        "Total after merge:",
        isInitialLoad
          ? response.items.length
          : projects.length + response.items.length,
      );
    } catch (error) {
      console.warn(
        "Failed to fetch projects from API, using mock data:",
        error,
      );
      // Fallback to mock data (only on initial load)
      if (isInitialLoad) {
        let filtered = MOCK_PROJECTS as Project[];
        const tag = activeTagRef.current;
        if (tag) {
          filtered = filtered.filter((p) =>
            p.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase())),
          );
        }
        setProjects(filtered);
        setHasMore(false);
        setUsingMockData(true);
      }
    } finally {
      if (!shouldRecurse) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Re-fetch when activeTag changes
  useEffect(() => {
    // Skip initial mount (handled above)
    if (loading && projects.length === 0 && !nextCursor) return;
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTag]);

  // Load more function for infinite scroll
  const loadMore = useCallback(() => {
    if (hasMoreRef.current && !loadingMoreRef.current && !loadingRef.current) {
      fetchProjects(nextCursorRef.current);
    }
  }, [fetchProjects]);

  // Infinite scroll: observe the sentinel element
  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  // Handle quick filter click
  const handleTagClick = (tag: string) => {
    setActiveTag(activeTag === tag ? null : tag);
  };

  return (
    <div className={styles.container}>
      {/* Filter Row */}
      <div className={styles.filterRow}>
        {/* Advanced Filter Popover - Coming Soon */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="rounded-full h-9 gap-2">
              <FunnelPlusIcon className="size-4" />
              <span>Advanced</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
              <div className="rounded-full bg-muted p-3">
                <FunnelPlusIcon className="size-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Advanced Filters</p>
                <p className="text-xs text-muted-foreground">Coming Soon</p>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Quick Filter Buttons */}
        {QUICK_FILTER_TAGS.map((tag) => (
          <RippleButton
            key={tag}
            onClick={() => handleTagClick(tag)}
            variant={activeTag === tag ? "default" : "outline"}
            className="rounded-full h-9"
          >
            {tag}
          </RippleButton>
        ))}
      </div>

      {/* Initial Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Projects Grid */}
      {!loading && (
        <div className={styles.projectGrid}>
          {projects.map((project) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <ProjectCard
                project={project}
                onClick={() => navigate(`/projects/${project.id}`)}
                className={styles.modernCard}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Load More Sentinel or End Message */}
      <div ref={loadMoreRef} className="flex justify-center py-8 w-full">
        {/* Only show loadingMore spinner when NOT in initial loading state */}
        {!loading && loadingMore && (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Loading more...
            </span>
          </div>
        )}
        {/* Show "Create Project" CTA when finished loading and no more pages */}
        {!loading && !loadingMore && !hasMore && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="space-y-1">
              <p className="text-muted-foreground font-medium">
                Not finding what you're looking for?
              </p>
              <p className="text-sm text-muted-foreground/80 max-w-md mx-auto">
                "Be the first to turn your idea into reality — people who share
                your vision are waiting for you."
              </p>
            </div>
            <Button onClick={() => navigate("/create")} variant="default">
              Create a Project
            </Button>
          </div>
        )}
      </div>

      {/* Mock Data Indicator (for development) */}
      {usingMockData && !loading && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-1.5 rounded-full text-xs font-medium shadow-lg">
          Using mock data (API unavailable)
        </div>
      )}
    </div>
  );
};

export default ExploreProjects;
