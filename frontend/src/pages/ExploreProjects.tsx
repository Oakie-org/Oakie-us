import React, { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FunnelPlusIcon } from "lucide-react";

import ProjectCard from "@/components/features/ProjectCard";
import { MOCK_PROJECTS } from "@/data/mockProjects";
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

const MOCK_QUICK_FILTERS = ["Web", "Mobile", "Finance", "TikTok", "Startup"];

export const ExploreProjects: React.FC = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = React.useState<string | null>(null);

  // TODO: Re-enable real API projects when ready
  // const [projects, setProjects] = useState<Project[] | null>(null);
  // useEffect(() => {
  //   let cancelled = false;
  //   listProjects()
  //     .then((items) => {
  //       if (cancelled) return;
  //       setProjects(items);
  //     })
  //     .catch(() => {
  //       if (cancelled) return;
  //       setProjects(MOCK_PROJECTS);
  //     });
  //   return () => {
  //     cancelled = true;
  //   };
  // }, []);

  const filteredProjects = useMemo(() => MOCK_PROJECTS, []);

  return (
    <div className={styles.container}>
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
        {MOCK_QUICK_FILTERS.map((filter) => (
          <RippleButton
            key={filter}
            onClick={() =>
              setActiveFilter(activeFilter === filter ? null : filter)
            }
            variant={activeFilter === filter ? "default" : "outline"}
            className="rounded-full h-9"
          >
            {filter}
          </RippleButton>
        ))}
      </div>

      <motion.div
        className={styles.projectGrid}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence>
          {filteredProjects.map((project) => (
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

      {filteredProjects.length === 0 && (
        <div className={styles.emptyState}>No projects match your filters.</div>
      )}
    </div>
  );
};

export default ExploreProjects;
