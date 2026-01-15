import React, { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FunnelPlusIcon, Loader2 } from "lucide-react";

import ProjectCard from "@/components/features/ProjectCard";
import { MOCK_PROJECTS } from "@/data/mockProjects";
import { listProjects, type ProjectFilters } from "@/lib/api";
import type { Project } from "@/types";
import { RippleButton } from "@/components/ui/ripple-button";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import styles from "./ExploreProjects.module.css";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const QUICK_FILTER_TAGS = ["Web", "Mobile", "Finance", "AI", "Startup"];

export const ExploreProjects: React.FC = () => {
  const navigate = useNavigate();

  // Filter state
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Data state
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);

  // Fetch projects when filters change
  const fetchProjects = useCallback(async () => {
    setLoading(true);

    // Build filters object
    const filters: ProjectFilters = {};
    if (activeTag) {
      filters.tag = activeTag;
    }

    try {
      const data = await listProjects(filters);
      setProjects(data);
      setUsingMockData(false);
    } catch (error) {
      console.warn(
        "Failed to fetch projects from API, using mock data:",
        error,
      );
      // Fallback to mock data, applying local filters
      let filtered = MOCK_PROJECTS as Project[];
      if (activeTag) {
        filtered = filtered.filter((p) =>
          p.tags.some((t) => t.toLowerCase().includes(activeTag.toLowerCase())),
        );
      }
      setProjects(filtered);
      setUsingMockData(true);
    } finally {
      setLoading(false);
    }
  }, [activeTag]);

  // Trigger fetch on mount and when filters change
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

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

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Projects Grid */}
      {!loading && (
        <motion.div
          className={styles.projectGrid}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            {projects.map((project) => (
              <motion.div
                key={project.id}
                variants={itemVariants}
                layout
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <ProjectCard
                  project={project}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className={styles.modernCard}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && projects.length === 0 && (
        <div className={styles.emptyState}>No projects match your filters.</div>
      )}

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
