import React from "react";
import { useParams } from "react-router-dom";

import { ProjectHeader } from "@/components/features/projects/ProjectHeader";
import { ProjectTimeline } from "@/components/features/projects/ProjectTimeline";
import { TeamSection } from "@/components/features/projects/TeamSection";
import { MOCK_PROJECTS } from "@/data/mockProjects";

import styles from "./ProjectDetail.module.css";

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const project = MOCK_PROJECTS.find((p) => String(p.id) === id);

  if (!project) {
    return (
      <div className={styles.pageContainer}>
        <div
          className={styles.mainContent}
          style={{ padding: "40px", textAlign: "center" }}
        >
          <h2>Project not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.mainContent}>
        <ProjectHeader
          title={project.title}
          description={project.description}
          imageUrl={project.imageUrl || project.image || ""}
          tags={project.tags}
          likes={project.likes}
          follows={project.follows}
        />

        <TeamSection
          requiredSkills={project.requiredSkills || []}
          members={project.members || []}
        />

        <ProjectTimeline posts={project.timelinePosts || []} />
      </div>
    </div>
  );
};
