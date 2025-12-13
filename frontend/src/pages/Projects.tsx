import React, { useState, useEffect } from "react";
import { Card } from "../components/common/Card";
import { Star, MapPin, X, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import styles from "./Projects.module.css";

// Mock Data with Images, Members, and Capacity
const projects = [
  {
    id: 1,
    title: "EcoTrack",
    description:
      "A mobile app for tracking carbon footprint with social features.",
    tags: ["React Native", "Node.js", "Green Tech"],
    status: "Recruiting",
    currentMembers: 3,
    maxMembers: 5,
    likes: 45,
    category: "Mobile Apps",
    uni: "Duke University",
    city: "Durham, NC",
    image: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
    membersAvatars: ["JD", "AL", "CK"], // JD is creator
  },
  {
    id: 2,
    title: "StudyBuddy AI",
    description: "AI-powered study planner for university students.",
    tags: ["Python", "AI/ML", "Education"],
    status: "In Progress",
    currentMembers: 5,
    maxMembers: 5,
    likes: 120,
    category: "AI/ML",
    uni: "Stanford University",
    city: "Palo Alto, CA",
    image: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
    membersAvatars: ["BS", "AL", "DK", "PM", "TS"],
  },
  {
    id: 3,
    title: "LocalEat",
    description: "Discover local home-cooked meals in your neighborhood.",
    tags: ["Vue", "Firebase", "Food"],
    status: "Idea",
    currentMembers: 1,
    maxMembers: 4,
    likes: 23,
    category: "Web Development",
    uni: "NYU",
    city: "New York, NY",
    image: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
    membersAvatars: ["LE"],
  },
  {
    id: 4,
    title: "DevCollab",
    description: "Real-time code collaboration tool for remote teams.",
    tags: ["React", "WebRTC", "SaaS"],
    status: "Recruiting",
    currentMembers: 2,
    maxMembers: 6,
    likes: 89,
    category: "Web Development",
    uni: "Remote",
    city: "Remote",
    image: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
    membersAvatars: ["DC", "AB"],
  },
  {
    id: 5,
    title: "QuantTrader",
    description: "High-frequency trading strategy text backtester.",
    tags: ["Python", "Finance", "Pandas"],
    status: "Recruiting",
    currentMembers: 4,
    maxMembers: 4,
    likes: 67,
    category: "Finance",
    uni: "Columbia University",
    city: "New York, NY",
    image: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
    membersAvatars: ["QT", "ZA", "WS", "ED"],
  },
  {
    id: 6,
    title: "ArtGallery VR",
    description: "Virtual reality art exhibition platform.",
    tags: ["Unity", "C#", "Design"],
    status: "Idea",
    currentMembers: 2,
    maxMembers: 3,
    likes: 34,
    category: "Design",
    uni: "RISD",
    city: "Providence, RI",
    image: "linear-gradient(135deg, #EC4899 0%, #DB2777 100%)",
    membersAvatars: ["AV", "CC"],
  },
];

const CATEGORIES = [
  "All",
  "Web Development",
  "Mobile Apps",
  "AI/ML",
  "Data Science",
  "Design",
  "Finance",
  "Hardware/IoT",
];
const CITIES = [
  "All",
  "Remote",
  "New York, NY",
  "San Francisco, CA",
  "Durham, NC",
  "Shanghai, CN",
  "London, UK",
];
const UNIVERSITIES = [
  "All",
  "Duke University",
  "Stanford University",
  "CMU",
  "MIT",
  "NYU",
  "Columbia University",
];

export const Projects: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCity, setSelectedCity] = useState("All");
  const [selectedUni, setSelectedUni] = useState("All");

  const [showFilter, setShowFilter] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Smart Sticky Logic
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const container = e.target as HTMLElement;
      const currentScrollY = container.scrollTop;

      // Show if scrolling UP or at the very top (buffer of 100px)
      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setShowFilter(true);
      } else if (currentScrollY > 100 && currentScrollY > lastScrollY) {
        // Hide if scrolling DOWN and not at top
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

  // Filter Logic
  const filteredProjects = projects.filter((project) => {
    const matchesCategory =
      selectedCategory === "All" || project.category === selectedCategory;
    const matchesCity = selectedCity === "All" || project.city === selectedCity;
    const matchesUni = selectedUni === "All" || project.uni === selectedUni;
    return matchesCategory && matchesCity && matchesUni;
  });

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Explore Projects</h1>

      {/* Filter Bar - Smart Sticky */}
      <div
        className={`${styles.filterRow} ${
          showFilter ? styles.visible : styles.hidden
        }`}
      >
        <div className={styles.filterLabel}>
          <Filter size={16} /> Filters
        </div>

        {/* Filter Pills */}
        <div className={styles.filterGroup}>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className={styles.pillsTrigger}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={styles.pillsContent}>
              <SelectItem value="All">All Categories</SelectItem>
              {CATEGORIES.filter((c) => c !== "All").map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className={styles.pillsTrigger}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={styles.pillsContent}>
              <SelectItem value="All">All Cities</SelectItem>
              {CITIES.filter((c) => c !== "All").map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedUni} onValueChange={setSelectedUni}>
            <SelectTrigger className={styles.pillsTrigger}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={styles.pillsContent}>
              <SelectItem value="All">All Universities</SelectItem>
              {UNIVERSITIES.filter((c) => c !== "All").map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
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

      {/* Modern Card Grid */}
      <div className={styles.projectGrid}>
        {filteredProjects.map((project) => (
          <Card key={project.id} className={styles.modernCard}>
            {/* Image Background Header */}
            <div
              className={styles.cardHero}
              style={{ background: project.image }}
            >
              <div className={styles.cardHeroOverlay}>
                <div className={styles.topBadges}>
                  <span className={styles.statusBadge}>{project.status}</span>
                  <span className={styles.scoreBadge}>
                    <Star size={12} fill="white" stroke="none" />{" "}
                    {project.likes}
                  </span>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className={styles.cardBody}>
              <h3 className={styles.heroTitle}>{project.title}</h3>
              <p className={styles.heroDesc}>{project.description}</p>

              <div className={styles.tagsRow}>
                {project.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className={styles.miniTag}>
                    {tag}
                  </span>
                ))}
              </div>

              <div className={styles.metaRow}>
                <span className={styles.metaItem}>
                  <MapPin size={16} /> {project.city}
                </span>
              </div>

              {/* Footer: Avatar Stack + Progress */}
              <div className={styles.cardFooter}>
                <div className={styles.avatarStack}>
                  {project.membersAvatars.slice(0, 4).map((initials, index) => (
                    <div
                      key={index}
                      className={styles.stackAvatar}
                      style={{ zIndex: 10 - index }} // Stack order
                      title="Member"
                    >
                      {initials}
                    </div>
                  ))}
                  {project.membersAvatars.length > 4 && (
                    <div
                      className={`${styles.stackAvatar} ${styles.moreCount}`}
                    >
                      +{project.membersAvatars.length - 4}
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
        ))}
      </div>
      {filteredProjects.length === 0 && (
        <div className={styles.emptyState}>No projects match your filters.</div>
      )}
    </div>
  );
};
