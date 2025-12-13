import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Compass,
    MessageSquare,
    Users,
    LogOut,
    PlusCircle
} from 'lucide-react';
import { Button } from './Button';
import styles from './Sidebar.module.css';

interface SidebarProps {
    onCreateClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCreateClick }) => {
    return (
        <aside className={styles.sidebar}>
            {/* Logo Area */}
            <div className={styles.logoContainer}>
                <div className={styles.logoIcon}>O</div>
                <span className={styles.logoText}>Oakie</span>
            </div>

            {/* Navigation */}
            <nav className={styles.nav}>
                <div className={styles.sectionLabel}>Discover</div>
                <NavLink to="/projects" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                    <Compass size={20} />
                    <span>Explore</span>
                </NavLink>
                <NavLink to="/community" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                    <Users size={20} />
                    <span>Community</span>
                </NavLink>

                <div className={styles.sectionLabel}>Workspace</div>
                <NavLink to="/dashboard" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                </NavLink>
                <NavLink to="/messages" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                    <MessageSquare size={20} />
                    <span>Messages</span>
                </NavLink>
            </nav>

            {/* CTA */}
            <div className={styles.ctaContainer}>
                <Button variant="primary" className={styles.createBtn} onClick={onCreateClick}>
                    <PlusCircle size={18} />
                    <span>New Project</span>
                </Button>
            </div>

            {/* Footer / User */}
            <div className={styles.footer}>
                <NavLink to="/users/1" className={styles.userProfile}>
                    <div className={styles.avatar}>JD</div>
                    <div className={styles.UserInfo}>
                        <span className={styles.userName}>John Doe</span>
                        <span className={styles.userRole}>Creator</span>
                    </div>
                </NavLink>
                <button className={styles.logoutBtn}>
                    <LogOut size={18} />
                </button>
            </div>
        </aside>
    );
};
