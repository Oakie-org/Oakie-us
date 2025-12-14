import {
  ArrowLeft,
  MoreHorizontal,
  Share2,
  Star,
  UserPlus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { ProjectTag } from "@/components/common/ProjectTag";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={styles.iconButton}
          aria-label="Back"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} />
        </Button>
        <div className={styles.actions}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={styles.iconButton}
            aria-label="Share"
          >
            <Share2 size={20} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={styles.iconButton}
            aria-label="More"
          >
            <MoreHorizontal size={20} />
          </Button>
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

          <div className={styles.statsRow}>
            <div className={styles.statItem}>
              <Star
                size={18}
                className="text-yellow-500"
                fill="#EAB308"
                color="#EAB308"
              />
              <span>{likes} Stars</span>
            </div>
            <div className={styles.statItem}>
              <UserPlus size={18} className="text-primary" />
              <span>{follows} Followers</span>
            </div>
          </div>

          <div className={styles.tagsRow}>
            {tags.map((tag) => (
              <ProjectTag key={tag} label={tag} />
            ))}
          </div>

          <div className={styles.actionButtons}>
            <Button type="button" className={cn(styles.btn, styles.btnPrimary)}>
              Request to Join
            </Button>
            <Button
              type="button"
              variant="outline"
              className={cn(styles.btn, styles.btnSecondary)}
            >
              Follow
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
