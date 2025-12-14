import React from "react";
import styles from "./ProjectTag.module.css";

interface ProjectTagProps {
  label: string;
  className?: string; // Allow custom overrides if absolutely necessary
}

export const ProjectTag: React.FC<ProjectTagProps> = ({
  label,
  className = "",
}) => {
  return <span className={`${styles.tag} ${className}`}>{label}</span>;
};
