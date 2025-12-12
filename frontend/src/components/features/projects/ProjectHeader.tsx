import React from 'react';
import { ArrowLeft, Share2, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './ProjectHeader.module.css';

interface ProjectHeaderProps {
    title: string;
    description: string;
    imageUrl: string;
    tags: string[];
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
    title,
    description,
    imageUrl,
    tags,
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

                    <div className={styles.tagsRow}>
                        {tags.map((tag) => (
                            <span key={tag} className={styles.tag}>
                                {tag}
                            </span>
                        ))}
                    </div>

                    <div className={styles.actionButtons}>
                        <button className={`${styles.btn} ${styles.btnPrimary}`}>
                            Join Project
                        </button>
                        <button className={`${styles.btn} ${styles.btnSecondary}`}>
                            Follow
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
