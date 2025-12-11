import React from 'react';
import { Search, Bell } from 'lucide-react';
import styles from './TopHeader.module.css';

export const TopHeader: React.FC = () => {
    return (
        <header className={styles.header}>
            <div className={styles.spacer}></div>
            <div className={styles.actions}>
                <div className={styles.searchContainer}>
                    <Search className={styles.searchIcon} size={18} />
                    <input
                        type="text"
                        placeholder="Search..."
                        className={styles.searchInput}
                    />
                </div>
                <button className={styles.iconBtn}>
                    <Bell size={20} />
                </button>
            </div>
        </header>
    );
};
