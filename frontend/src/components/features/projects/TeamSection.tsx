import React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import styles from "./TeamSection.module.css";

interface Member {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
}

interface TeamSectionProps {
  requiredSkills: string[];
  members: Member[];
}

export const TeamSection: React.FC<TeamSectionProps> = ({
  requiredSkills,
  members,
}) => {
  return (
    <div className={styles.container}>
      {/* Required Skills Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Required Skills</h3>
        <div className={styles.skillsGrid}>
          {requiredSkills.map((skill) => (
            <div key={skill} className={styles.skillCard}>
              <div className={styles.skillDot} />
              <span className={styles.skillName}>{skill}</span>
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            className={cn(styles.addSkillBtn, "h-auto")}
          >
            <Plus size={16} />
            <span>Add</span>
          </Button>
        </div>
      </div>

      {/* Team Members Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Team & Roles</h3>
        <div className={styles.membersGrid}>
          {members.map((member) => (
            <div key={member.id} className={styles.memberCard}>
              <img
                src={member.avatarUrl}
                alt={member.name}
                className={styles.avatar}
              />
              <div className={styles.memberInfo}>
                <span className={styles.memberName}>{member.name}</span>
                <span className={styles.memberRole}>{member.role}</span>
              </div>
            </div>
          ))}

          {/* Add Member Placeholder */}
          <Button
            type="button"
            variant="ghost"
            className={cn(styles.addMemberBtn, "h-auto justify-start")}
          >
            <div className={styles.addAvatar}>
              <Plus size={24} />
            </div>
            <div className={styles.memberInfo}>
              <span className={styles.memberName}>Invite</span>
              <span className={styles.memberRole}>New Member</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};
