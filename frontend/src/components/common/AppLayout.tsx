import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import { CreateProjectModal } from '../features/projects/CreateProjectModal';
import styles from './AppLayout.module.css';

export const AppLayout: React.FC = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    return (
        <div className={styles.container}>
            <div className={styles.ambientGlow} />
            <div className={styles.ambientGlowSecondary} />
            <Sidebar onCreateClick={() => setIsCreateModalOpen(true)} />
            <main className={styles.main}>
                <div className={styles.contentWrapper}>
                    <TopHeader />
                    <Outlet />
                </div>
            </main>
            <CreateProjectModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
};

