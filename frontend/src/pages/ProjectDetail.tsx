import React from 'react';
import { Button } from '../components/common/Button';
import styles from './ProjectDetail.module.css';

export const ProjectDetail: React.FC = () => {
    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.badge}>Recruiting</div>
                    <h1 className={styles.title}>EcoTrack</h1>
                    <p className={styles.subtitle}>A mobile app for tracking carbon footprint with social features.</p>
                    <div className={styles.tags}>
                        <span>React Native</span>
                        <span>Node.js</span>
                        <span>Green Tech</span>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <Button variant="primary">Apply to Join</Button>
                    <Button variant="outline">Share</Button>
                </div>
            </header>

            {/* Main Content & Timeline */}
            <div className={styles.layout}>
                <div className={styles.timelineSection}>
                    <h2 className={styles.sectionTitle}>Project Timeline</h2>
                    <div className={styles.timeline}>
                        <div className={`${styles.step} ${styles.completed}`}>
                            <div className={styles.stepIndicator}></div>
                            <div className={styles.stepContent}>
                                <h3>Concept Phase</h3>
                                <p>Defining the core idea and gathering initial team.</p>
                                <span className={styles.date}>Sep 2024</span>
                            </div>
                        </div>
                        <div className={`${styles.step} ${styles.active}`}>
                            <div className={styles.stepIndicator}></div>
                            <div className={styles.stepContent}>
                                <h3>Team Recruitment</h3>
                                <p>Looking for 2 Backend Developers and 1 UI Designer.</p>
                                <span className={styles.date}>Current</span>
                            </div>
                        </div>
                        <div className={styles.step}>
                            <div className={styles.stepIndicator}></div>
                            <div className={styles.stepContent}>
                                <h3>MVP Development</h3>
                                <p>Building the initial prototype for beta testing.</p>
                                <span className={styles.date}>Upcoming</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.detailsSection}>
                    <h2 className={styles.sectionTitle}>About the Project</h2>
                    <p className={styles.description}>
                        EcoTrack aims to gamify the experience of reducing personal carbon footprint.
                        We believe that by making sustainability social and fun, we can drive real change.
                        The app will track daily activities, calculate carbon score, and allow friends to compete.
                    </p>

                    <h3 className={styles.subTitle}>Open Roles</h3>
                    <div className={styles.roleCard}>
                        <h4>Backend Engineer</h4>
                        <p>Experience with Node.js and AWS preferred.</p>
                        <Button variant="secondary" size="sm">View Details</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
