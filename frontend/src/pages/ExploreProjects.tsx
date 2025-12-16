import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import ProjectCard from "@/components/features/ProjectCard";
import { MOCK_PROJECTS } from "@/data/mockProjects";

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

export const ExploreProjects: React.FC = () => {
  const navigate = useNavigate();

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
      <h1 className={styles.pageTitle}>Explore Projects</h1>

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
