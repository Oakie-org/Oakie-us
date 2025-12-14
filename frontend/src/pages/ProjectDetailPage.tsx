import { useParams } from "react-router-dom";

import { ProjectHeader } from "@/components/features/projects/ProjectHeader";
import { ProjectTimeline } from "@/components/features/projects/ProjectTimeline";
import { TeamSection } from "@/components/features/projects/TeamSection";
import { MOCK_PROJECTS } from "@/data/mockProjects";

import styles from "./ProjectDetailPage.module.css";

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const project = MOCK_PROJECTS.find((p) => String(p.id) === id);

  if (!project) {
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
