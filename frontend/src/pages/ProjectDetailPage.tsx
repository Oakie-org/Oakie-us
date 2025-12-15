import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { ProjectHeader } from "@/components/features/projects/ProjectHeader";
import { ProjectTimeline } from "@/components/features/projects/ProjectTimeline";
import { TeamSection } from "@/components/features/projects/TeamSection";
import { MOCK_PROJECTS } from "@/data/mockProjects";
import { getProject } from "@/lib/api";
import type { Project } from "@/types";

import styles from "./ProjectDetailPage.module.css";

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    getProject(id)
      .then((item) => {
        if (cancelled) return;
        setProject(item);
      })
      .catch(() => {
        if (cancelled) return;
        const fallback = MOCK_PROJECTS.find((p) => String(p.id) === id) ?? null;
        setProject(fallback);
        setNotFound(!fallback);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (notFound) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h2>Project not found</h2>
          <p>
            The project you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  if (!project) {
    return <div className={styles.container} />;
  }

  return (
    <div className={styles.container}>
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
  );
};

export default ProjectDetailPage;
