import type { ReactNode } from "react";

import type { Project } from "@/lib/types";
import {
  ProjectCard,
  ProjectCardSkeleton,
  estimateProjectCard,
} from "@/components/cards";
import { Masonry } from "@/components/Masonry";

const SKELETONS = Array.from({ length: 6 }, (_, index) => index);

interface ProjectFeedProps<P extends Project> {
  projects: P[];
  onPreview?: (id: string) => void;
  /** Extra line under a card, e.g. the viewer's role on that team. */
  footer?: (project: P) => ReactNode;
  /** Fewer columns where the feed shares the page with a side column. */
  maxColumns?: number;
  className?: string;
}

/** Projects as a feed of posts: cards keep their own height. */
export function ProjectFeed<P extends Project>({
  projects,
  onPreview,
  footer,
  maxColumns,
  className,
}: ProjectFeedProps<P>) {
  return (
    <Masonry
      items={projects}
      getKey={(project) => project.id}
      estimate={estimateProjectCard}
      maxColumns={maxColumns}
      className={className}
    >
      {(project) => (
        <ProjectCard
          project={project}
          onPreview={onPreview}
          footer={footer?.(project)}
        />
      )}
    </Masonry>
  );
}

export function ProjectFeedSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div aria-busy>
      <Masonry
        items={SKELETONS.slice(0, count)}
        getKey={String}
        estimate={(index) => (index % 3 === 1 ? 20 : 12)}
        maxColumns={Math.min(3, count)}
      >
        {(index) => <ProjectCardSkeleton index={index} />}
      </Masonry>
    </div>
  );
}
