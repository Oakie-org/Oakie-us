import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import styles from './AppLayout.module.css';

export const AppLayout: React.FC = () => {
    return (
        <div className={styles.container}>
            <Sidebar />
            <main className={styles.main}>
                <div className={styles.contentWrapper}>
                    <TopHeader />
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

