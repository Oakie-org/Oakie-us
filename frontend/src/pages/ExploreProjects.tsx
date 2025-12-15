import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Card } from "@/components/ui/card";
import { ProjectTag } from "@/components/common/ProjectTag";
import { MOCK_PROJECTS } from "@/data/mockProjects";
import type { Project } from "@/types";
import { listProjects } from "@/lib/api";

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

  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    listProjects()
      .then((items) => {
        if (cancelled) return;
        setProjects(items);
      })
      .catch(() => {
        if (cancelled) return;
        setProjects(MOCK_PROJECTS);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProjects = useMemo(() => projects ?? MOCK_PROJECTS, [projects]);

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
              <Card
                className={styles.modernCard}
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div
                  className={styles.cardHero}
                  style={{ background: project.image }}
                >
                  <div className={styles.cardHeroOverlay}>
                    <div className={styles.topBadges}>
                      <span className={styles.statusBadge}>
                        {project.status}
                      </span>
                      <span className={styles.scoreBadge}>
                        <Star size={12} fill="white" stroke="none" />{" "}
                        {project.likes}
                      </span>
                    </div>
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <h3 className={styles.heroTitle}>{project.title}</h3>
                  <p className={styles.heroDesc}>
                    {project.subtitle || project.description}
                  </p>

                  <div className={styles.tagsRow}>
                    {project.tags.slice(0, 3).map((tag) => (
                      <ProjectTag key={tag} label={tag} />
                    ))}
                  </div>

                  <div className={styles.metaRow}>
                    <span className={styles.metaItem}>
                      <MapPin size={16} /> {project.city}
                    </span>
                  </div>

                  <div className={styles.cardFooter}>
                    <div className={styles.avatarStack}>
                      {(project.membersAvatars || [])
                        .slice(0, 4)
                        .map((initials, index) => (
                          <div
                            key={index}
                            className={styles.stackAvatar}
                            style={{ zIndex: 10 - index }}
                            title="Member"
                          >
                            {initials}
                          </div>
                        ))}
                      {(project.membersAvatars || []).length > 4 && (
                        <div
                          className={`${styles.stackAvatar} ${styles.moreCount}`}
                        >
                          +{(project.membersAvatars || []).length - 4}
                        </div>
                      )}
                    </div>

                    <div className={styles.progressInfo}>
                      <span className={styles.progressLabel}>Team</span>
                      <span className={styles.progressText}>
                        {project.currentMembers}/{project.maxMembers}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
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
