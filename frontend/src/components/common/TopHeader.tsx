import React from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import styles from "./TopHeader.module.css";

export const TopHeader: React.FC = () => {
  return (
    <header className={styles.header}>
      <div className={styles.actions}>
        <div className={styles.searchContainer} style={{ display: "none" }}>
          {/* Search moved to page level */}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={styles.iconBtn}
          aria-label="Notifications"
        >
          <Bell size={20} />
        </Button>
      </div>
    </header>
  );
};
