import React from 'react';
import { Button } from '../components/common/Button';
import styles from './Home.module.css';

export const Home: React.FC = () => {
    return (
        <div className={styles.container}>
            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>
                        Build your next <span className={styles.highlight}>big idea</span> together.
                    </h1>
                    <p className={styles.heroSubtitle}>
                        Oakie connects creators, developers, and designers to build amazing projects. No more solo grinding.
                    </p>
                    <div className={styles.heroActions}>
                        <Button variant="primary" size="lg">Start Explore</Button>
                        <Button variant="secondary" size="lg">Create Project</Button>
                    </div>
                </div>
                <div className={styles.heroVisual}>
                    <div className={styles.blob}></div>
                </div>
            </section>

            {/* Features/Stats Section */}
            <section className={styles.stats}>
                <div className={styles.statCard}>
                    <h3 className={styles.statNumber}>500+</h3>
                    <p className={styles.statLabel}>Active Projects</p>
                </div>
                <div className={styles.statCard}>
                    <h3 className={styles.statNumber}>1.2k</h3>
                    <p className={styles.statLabel}>Creators Joined</p>
                </div>
                <div className={styles.statCard}>
                    <h3 className={styles.statNumber}>100%</h3>
                    <p className={styles.statLabel}>Free to Join</p>
                </div>
            </section>
        </div>
    );
};
