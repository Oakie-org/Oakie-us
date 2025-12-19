import React from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Link as LinkIcon, LayoutGrid } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./ProfilePage.module.css";
import { useAuth } from "@/contexts/AuthContext";
import { MOCK_PROJECTS } from "@/data/mockProjects";
import ProjectCard from "@/components/features/ProjectCard";
import { useNavigate } from "react-router-dom";

export const ProfilePage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  // Determine if viewing own profile or another user's
  // If no userId param is present, assume "My Profile" (Edit Mode)
  // If userId param matches logged-in user, also "My Profile"
  const isOwnProfile = !userId || (user && user.userId === userId);

  // Mock Data for "View Mode" (other user)
  const viewUser = {
    name: "Alex Liu",
    email: "alex@columbia.edu",
    initials: "AL",
  };

  // Determine display data
  const displayName = isOwnProfile ? user?.name || "Guest" : viewUser.name;
  const displayEmail = isOwnProfile
    ? user?.email || "Not logged in"
    : viewUser.email;
  const displayInitials = isOwnProfile
    ? user?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?"
    : viewUser.initials;

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Get Projects (Mock Logic)
  // In a real app, we would fetch projects where ownerId === userId
  // For now, we just show all MOCK_PROJECTS sorted by ID as a proxy for recency
  const displayProjects = [...MOCK_PROJECTS].sort((a, b) => {
    if (typeof a.id === "number" && typeof b.id === "number") {
      return b.id - a.id;
    }
    return String(b.id).localeCompare(String(a.id));
  });

  // Animation Variants
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

  return (
    <div className={styles.container}>
      {/* Full Width Header */}
      <div className={styles.profileHeader}>
        <div className={styles.banner}></div>
        <div className={styles.headerContent}>
          <div className={styles.headerTop}>
            <div className={styles.avatarWrapper}>
              <div className={styles.avatar}>{displayInitials}</div>
            </div>
            <div className={styles.actions}>
              {isOwnProfile && <Button variant="outline">Edit Profile</Button>}
            </div>
          </div>

          <div className={styles.infoSection}>
            <div>
              <h1 className={styles.name}>{displayName}</h1>
              <p className={styles.headline}>
                Creative Developer & UI Designer. Building the future of social
                apps.
              </p>
              <div className={styles.metaInfo}>
                <span className={styles.location}>
                  <MapPin size={16} /> San Francisco, CA
                </span>
                <span className={styles.website}>
                  <LinkIcon size={16} /> {displayEmail}
                </span>
              </div>
            </div>

            <div className={styles.stats}>
              <div className={styles.statItem}>
                <span className={styles.statVal}>{displayProjects.length}</span>
                <span className={styles.statLabel}>Projects</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statVal}>128</span>
                <span className={styles.statLabel}>Followers</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statVal}>42</span>
                <span className={styles.statLabel}>Following</span>
              </div>
            </div>
          </div>

          <div className={styles.skillsSection}>
            <div className={styles.skills}>
              <span className={styles.skill}>React</span>
              <span className={styles.skill}>TypeScript</span>
              <span className={styles.skill}>Node.js</span>
              <span className={styles.skill}>UI/UX Design</span>
              <span className={styles.skill}>AWS Serverless</span>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid (No Sidebar, No Tabs) */}
      <div className={styles.contentSection}>
        <div className={styles.sectionTitle}>
          <LayoutGrid className="size-6" />
          Projects
        </div>

        <motion.div
          className={styles.projectList}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            {displayProjects.length > 0 ? (
              displayProjects.map((project) => (
                <motion.div
                  key={project.id}
                  variants={itemVariants}
                  layout
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <ProjectCard
                    project={project}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className={styles.modernCard}
                  />
                </motion.div>
              ))
            ) : (
              <div className={styles.emptyState}>No projects started yet.</div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
