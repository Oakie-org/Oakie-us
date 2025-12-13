import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Compass,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  PlusCircle,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import styles from "./Sidebar.module.css";

interface SidebarProps {
  onCreateClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCreateClick }) => {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === "/projects") return location.pathname.startsWith("/projects");
    if (href === "/users/1") return location.pathname.startsWith("/users/");
    return location.pathname === href;
  };

  const navButtonClass = (href: string) =>
    cn(
      styles.navItem,
      "h-auto w-full justify-start px-[var(--spacing-md)] py-[var(--spacing-sm)]",
      isActive(href) && styles.active,
    );

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoContainer}>
        <div className={styles.logoIcon}>O</div>
        <span className={styles.logoText}>Oakie</span>
      </div>

      <nav className={styles.nav}>
        <div className={styles.sectionLabel}>Discover</div>
        <Button asChild variant="ghost" className={navButtonClass("/projects")}>
          <Link to="/projects">
            <Compass size={20} />
            <span>Explore</span>
          </Link>
        </Button>
        <Button
          asChild
          variant="ghost"
          className={navButtonClass("/community")}
        >
          <Link to="/community">
            <Users size={20} />
            <span>Community</span>
          </Link>
        </Button>

        <div className={styles.sectionLabel}>Workspace</div>
        <Button
          asChild
          variant="ghost"
          className={navButtonClass("/dashboard")}
        >
          <Link to="/dashboard">
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
        </Button>
        <Button asChild variant="ghost" className={navButtonClass("/messages")}>
          <Link to="/messages">
            <MessageSquare size={20} />
            <span>Messages</span>
          </Link>
        </Button>
      </nav>

      <div className={styles.ctaContainer}>
        <Button
          variant="default"
          className={styles.createBtn}
          onClick={onCreateClick}
        >
          <PlusCircle size={18} />
          <span>New Project</span>
        </Button>
      </div>

      <div className={styles.footer}>
        <Button asChild variant="ghost" className={styles.userProfile}>
          <Link to="/users/1">
            <Avatar className={styles.avatar}>
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className={styles.UserInfo}>
              <span className={styles.userName}>John Doe</span>
              <span className={styles.userRole}>Creator</span>
            </div>
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(styles.logoutBtn, "h-auto w-auto")}
          aria-label="Log out"
        >
          <LogOut size={18} />
        </Button>
      </div>
    </aside>
  );
};
