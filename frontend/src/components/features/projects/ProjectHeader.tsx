import React from "react";
import {
  ArrowLeft,
  Share2,
  MoreHorizontal,
  Star,
  UserPlus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ProjectTag } from "../../common/ProjectTag";
import styles from "./ProjectHeader.module.css";

interface ProjectHeaderProps {
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
  likes: number;
  follows: number;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  title,
  description,
  imageUrl,
  tags,
  likes,
  follows,
}) => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      {/* Navigation & Actions */}
      <div className={styles.topBar}>
        <button className={styles.iconButton} onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <div className={styles.actions}>
          <button className={styles.iconButton}>
            <Share2 size={20} />
          </button>
          <button className={styles.iconButton}>
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      <div className={styles.contentWrapper}>
        {/* Left: Hero Image */}
        <div className={styles.imageSection}>
          <img src={imageUrl} alt={title} className={styles.heroImage} />
        </div>

        {/* Right: Project Info */}
        <div className={styles.infoSection}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.description}>{description}</p>

          <div
            className={styles.statsRow}
            style={{
              display: "flex",
              gap: "20px",
              marginBottom: "20px",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "#4B5563",
                fontWeight: 500,
              }}
            >
              <Star
                size={18}
                className="text-yellow-500"
                fill="#EAB308"
                color="#EAB308"
              />
              <span>{likes} Stars</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "#4B5563",
                fontWeight: 500,
              }}
            >
              <UserPlus size={18} color="#4F46E5" />
              <span>{follows} Followers</span>
            </div>
          </div>

          <div className={styles.tagsRow}>
            {tags.map((tag) => (
              <ProjectTag key={tag} label={tag} />
            ))}
          </div>

          <div className={styles.actionButtons}>
            <Button variant="default" size="lg" className={styles.actionBtn}>
              Request to Join
            </Button>
            <Button variant="outline" size="lg" className={styles.actionBtn}>
              Follow
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
