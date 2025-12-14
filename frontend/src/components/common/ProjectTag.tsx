import styles from "./ProjectTag.module.css";

interface ProjectTagProps {
  label: string;
  className?: string;
}

export const ProjectTag: React.FC<ProjectTagProps> = ({
  label,
  className = "",
}) => {
  return <span className={`${styles.tag} ${className}`}>{label}</span>;
};
