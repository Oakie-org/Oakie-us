import { StarIcon, UsersIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { cn } from "@/lib/utils";
import type { Project, Member } from "@/types";

interface ProjectCardProps {
  project: Project;
  className?: string;
  onClick?: () => void;
}

/**
 * Get initials from a name (e.g., "Alex Liu" -> "AL")
 */
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Status badge component - compact version for card display
 */
function StatusBadge({ status }: { status: Project["status"] }) {
  const baseClasses = "border-none text-xs py-1 px-2 gap-1.5";

  switch (status) {
    case "In Progress":
      return (
        <Badge
          className={`${baseClasses} bg-amber-600/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400`}
        >
          <span
            className="size-1 rounded-full bg-amber-600 dark:bg-amber-400"
            aria-hidden="true"
          />
          Active
        </Badge>
      );
    case "Completed":
      return (
        <Badge
          className={`${baseClasses} bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400`}
        >
          <span
            className="size-1 rounded-full bg-green-600 dark:bg-green-400"
            aria-hidden="true"
          />
          Done
        </Badge>
      );
    case "Recruiting":
      return (
        <Badge
          className={`${baseClasses} bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400`}
        >
          <span
            className="size-1 rounded-full bg-blue-600 dark:bg-blue-400"
            aria-hidden="true"
          />
          Hiring
        </Badge>
      );
    case "Idea":
    default:
      return (
        <Badge
          className={`${baseClasses} bg-purple-600/10 text-purple-600 dark:bg-purple-400/10 dark:text-purple-400`}
        >
          <span
            className="size-1 rounded-full bg-purple-600 dark:bg-purple-400"
            aria-hidden="true"
          />
          Idea
        </Badge>
      );
  }
}

const ProjectCard = ({ project, className, onClick }: ProjectCardProps) => {
  // Get owner (first member) and team members
  const owner = project.members?.[0];
  const teamMembers = project.members?.slice(0, 4) ?? [];

  return (
    <Card
      className={cn(
        "justify-between cursor-pointer transition-all hover:shadow-lg relative",
        className,
      )}
      onClick={onClick}
    >
      {/* Status badge positioned absolutely in top-right corner */}
      <div className="absolute top-3 right-3 z-10">
        <StatusBadge status={project.status} />
      </div>

      <CardHeader className="flex justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="size-10.5 rounded-full">
            <AvatarImage
              src={owner?.avatarUrl}
              alt={owner?.name ?? "Project Owner"}
              className="rounded-full"
            />
            <AvatarFallback className="text-xs">
              {owner ? getInitials(owner.name) : "OA"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <span className="text-lg font-medium">{project.title}</span>
            <span className="text-muted-foreground text-sm">
              {project.uni} • {project.city}
            </span>
          </div>
        </div>
      </CardHeader>

      <div className="flex flex-col gap-9">
        <div className="relative">
          <div
            className="h-48 w-full rounded-md"
            style={{
              background: project.imageUrl
                ? `url(${project.imageUrl}) center/cover`
                : project.image?.includes("var(--")
                  ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                  : project.image,
            }}
          />
        </div>

        <CardContent className="space-y-2">
          <p className="line-clamp-2">
            {project.subtitle || project.description}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {project.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                className="bg-primary/10 text-primary rounded-sm"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </div>

      <CardFooter className="flex items-center justify-between">
        {/* Team avatars on the left */}
        <div className="flex -space-x-3 hover:space-x-0.5">
          {teamMembers.map((member: Member, index: number) => (
            <Tooltip key={`${project.id}-member-${index}-${member.name}`}>
              <TooltipTrigger asChild>
                <Avatar className="ring-background size-9 ring-2 transition-all duration-300 ease-in-out">
                  <AvatarImage src={member.avatarUrl} alt={member.name} />
                  <AvatarFallback className="text-xs">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>{member.name}</TooltipContent>
            </Tooltip>
          ))}
          {(project.members?.length ?? 0) > 4 && (
            <Avatar className="ring-background size-9 ring-2">
              <AvatarFallback className="text-xs bg-muted">
                +{(project.members?.length ?? 0) - 4}
              </AvatarFallback>
            </Avatar>
          )}
        </div>

        {/* Star & Follow on the right */}
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="flex items-center gap-1">
            <StarIcon className="size-4" />
            <span className="text-sm">{project.likes}</span>
          </div>
          <div className="flex items-center gap-1">
            <UsersIcon className="size-4" />
            <span className="text-sm">{project.follows}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;
