import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Filter, MapPin, Star, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProjectTag } from "@/components/common/ProjectTag";
import { MOCK_PROJECTS } from "@/data/mockProjects";

import styles from "./Projects.module.css";

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

export const Projects: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCity, setSelectedCity] = useState("All");
  const [selectedUni, setSelectedUni] = useState("All");

  const [showFilter, setShowFilter] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const categories = useMemo(() => {
    return [
      "All",
      ...Array.from(new Set(MOCK_PROJECTS.map((p) => p.category))).sort(),
    ];
  }, []);

  const cities = useMemo(() => {
    return [
      "All",
      ...Array.from(new Set(MOCK_PROJECTS.map((p) => p.city))).sort(),
    ];
  }, []);

  const universities = useMemo(() => {
    return [
      "All",
      ...Array.from(new Set(MOCK_PROJECTS.map((p) => p.uni))).sort(),
    ];
  }, []);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const container = e.target as HTMLElement;
      const currentScrollY = container.scrollTop;

      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setShowFilter(true);
      } else if (currentScrollY > 100 && currentScrollY > lastScrollY) {
        setShowFilter(false);
      }
      setLastScrollY(currentScrollY);
    };

    const scrollableDiv = document.querySelector(
      'div[class*="contentWrapper"]',
    );
    if (scrollableDiv) {
      scrollableDiv.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (scrollableDiv) {
        scrollableDiv.removeEventListener("scroll", handleScroll);
      }
    };
  }, [lastScrollY]);

  const filteredProjects = MOCK_PROJECTS.filter((project) => {
    const matchesCategory =
      selectedCategory === "All" || project.category === selectedCategory;
    const matchesCity = selectedCity === "All" || project.city === selectedCity;
    const matchesUni = selectedUni === "All" || project.uni === selectedUni;
    return matchesCategory && matchesCity && matchesUni;
  });

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Explore Projects</h1>

      <div
        className={`${styles.filterRow} ${
          showFilter ? styles.visible : styles.hidden
        }`}
      >
        <div className={styles.filterLabel}>
          <Filter size={16} /> Filters
        </div>

        <div className={styles.filterGroup}>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className={styles.pillsTrigger}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={styles.pillsContent}>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c === "All" ? "All Categories" : c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className={styles.pillsTrigger}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={styles.pillsContent}>
              {cities.map((c) => (
                <SelectItem key={c} value={c}>
                  {c === "All" ? "All Cities" : c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedUni} onValueChange={setSelectedUni}>
            <SelectTrigger className={styles.pillsTrigger}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={styles.pillsContent}>
              {universities.map((u) => (
                <SelectItem key={u} value={u}>
                  {u === "All" ? "All Universities" : u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(selectedCategory !== "All" ||
          selectedCity !== "All" ||
          selectedUni !== "All") && (
          <button
            className={styles.clearBtn}
            onClick={() => {
              setSelectedCategory("All");
              setSelectedCity("All");
              setSelectedUni("All");
            }}
          >
            <X size={14} /> Clear
          </button>
        )}
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
