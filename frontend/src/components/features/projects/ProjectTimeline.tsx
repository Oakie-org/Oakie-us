import React, { useRef } from "react";
import { Calendar, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import styles from "./ProjectTimeline.module.css";

interface TimelinePost {
  id: string;
  title: string;
  date: string;
  author: {
    name: string;
    avatarUrl: string;
  };
  type: "milestone" | "update" | "release";
  preview: string;
}

interface ProjectTimelineProps {
  posts: TimelinePost[];
}

export const ProjectTimeline: React.FC<ProjectTimelineProps> = ({ posts }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Project Timeline</h3>
        <div className={styles.controls}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={styles.controlBtn}
            aria-label="Scroll left"
            onClick={() => scroll("left")}
          >
            <ChevronLeft size={20} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={styles.controlBtn}
            aria-label="Scroll right"
            onClick={() => scroll("right")}
          >
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>

      <div className={styles.timelineWrapper} ref={scrollContainerRef}>
        <div className={styles.timelineTrack}>
          {/* The horizontal line */}
          <div className={styles.line} />

          {posts.map((post) => (
            <div key={post.id} className={styles.timelineItem}>
              {/* Date Marker */}
              <div className={styles.dateMarker}>
                <div className={styles.node} />
                <span className={styles.date}>{post.date}</span>
              </div>

              {/* Post Card */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <img
                    src={post.author.avatarUrl}
                    alt={post.author.name}
                    className={styles.authorAvatar}
                  />
                  <div className={styles.meta}>
                    <span className={styles.authorName}>
                      {post.author.name}
                    </span>
                    <span className={`${styles.typeTag} ${styles[post.type]}`}>
                      {post.type}
                    </span>
                  </div>
                </div>
                <h4 className={styles.postTitle}>{post.title}</h4>
                <p className={styles.postPreview}>{post.preview}</p>
              </div>
            </div>
          ))}

          {/* Add Post Button at end of timeline */}
          <div className={styles.timelineItem}>
            <div className={styles.dateMarker}>
              <div className={styles.node} />
              <span className={styles.date}>Next</span>
            </div>
            <Button type="button" variant="ghost" className={styles.addPostBtn}>
              <Calendar size={24} />
              <span>Add Update</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
