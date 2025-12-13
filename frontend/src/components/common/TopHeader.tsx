import React from "react";
import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import styles from "./TopHeader.module.css";

export const TopHeader: React.FC = () => {
  return (
    <header className={styles.header}>
      <div className={styles.actions}>
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} size={18} />
          <Input
            type="text"
            placeholder="Search..."
            className={styles.searchInput}
          />
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
