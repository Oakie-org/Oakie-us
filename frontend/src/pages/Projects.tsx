import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/common/Card';
import { Star, MapPin, X, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProjectTag } from '../components/common/ProjectTag';
import type { Project } from '../types';
import styles from './Projects.module.css';

import { MOCK_PROJECTS } from '../data/mockProjects';

const CATEGORIES = ['All', 'Web Development', 'Mobile Apps', 'AI/ML', 'Data Science', 'Design', 'Finance', 'Hardware/IoT'];
const CITIES = ['All', 'Remote', 'New York, NY', 'San Francisco, CA', 'Durham, NC', 'Shanghai, CN', 'London, UK'];
const UNIVERSITIES = ['All', 'Duke University', 'Stanford University', 'CMU', 'MIT', 'NYU', 'Columbia University'];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};


export const Projects: React.FC = () => {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedCity, setSelectedCity] = useState('All');
    const [selectedUni, setSelectedUni] = useState('All');

    const [showFilter, setShowFilter] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    // Smart Sticky Logic
    useEffect(() => {
        const handleScroll = (e: Event) => {
            const container = e.target as HTMLElement;
            const currentScrollY = container.scrollTop;

            // Show if scrolling UP or at the very top (buffer of 100px)
            if (currentScrollY < lastScrollY || currentScrollY < 100) {
                setShowFilter(true);
            } else if (currentScrollY > 100 && currentScrollY > lastScrollY) {
                // Hide if scrolling DOWN and not at top
                setShowFilter(false);
            }
            setLastScrollY(currentScrollY);
        };

        const scrollableDiv = document.querySelector('div[class*="contentWrapper"]');
        if (scrollableDiv) {
            scrollableDiv.addEventListener('scroll', handleScroll);
        }
        return () => {
            if (scrollableDiv) {
                scrollableDiv.removeEventListener('scroll', handleScroll);
            }
        };
    }, [lastScrollY]);

    // Filter Logic
    const filteredProjects = MOCK_PROJECTS.filter(project => {
        const matchesCategory = selectedCategory === 'All' || project.category === selectedCategory;
        const matchesCity = selectedCity === 'All' || project.city === selectedCity;
        const matchesUni = selectedUni === 'All' || project.uni === selectedUni;
        return matchesCategory && matchesCity && matchesUni;
    });

    return (
        <div className={styles.container}>
            <h1 className={styles.pageTitle}>Explore Projects</h1>

            {/* Filter Bar - Smart Sticky */}
            <div className={`${styles.filterRow} ${showFilter ? styles.visible : styles.hidden}`}>
                <div className={styles.filterLabel}>
                    <Filter size={16} /> Filters
                </div>

                {/* Filter Pills */}
                <div className={styles.filterGroup}>
                    <select
                        className={styles.pillsSelect}
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="All">All Categories</option>
                        {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select
                        className={styles.pillsSelect}
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                    >
                        <option value="All">All Cities</option>
                        {CITIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    <select
                        className={styles.pillsSelect}
                        value={selectedUni}
                        onChange={(e) => setSelectedUni(e.target.value)}
                    >
                        <option value="All">All Universities</option>
                        {UNIVERSITIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                {(selectedCategory !== 'All' || selectedCity !== 'All' || selectedUni !== 'All') && (
                    <button
                        className={styles.clearBtn}
                        onClick={() => {
                            setSelectedCategory('All');
                            setSelectedCity('All');
                            setSelectedUni('All');
                        }}
                    >
                        <X size={14} /> Clear
                    </button>
                )}
            </div>

            {/* Modern Card Grid with Motion */}
            <motion.div
                className={styles.projectGrid}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <AnimatePresence>
                    {filteredProjects.map(project => (
                        <motion.div
                            key={project.id}
                            variants={itemVariants}
                            layout
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            <Card
                                className={styles.modernCard}
                                onClick={() => navigate(`/projects/${project.id}`)}
                            >
                                {/* Image Background Header */}
                                <div
                                    className={styles.cardHero}
                                    style={{ background: project.image }}
                                >
                                    <div className={styles.cardHeroOverlay}>
                                        <div className={styles.topBadges}>
                                            <span className={styles.statusBadge}>{project.status}</span>
                                            <span className={styles.scoreBadge}><Star size={12} fill="white" stroke="none" /> {project.likes}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content Body */}
                                <div className={styles.cardBody}>
                                    <h3 className={styles.heroTitle}>{project.title}</h3>
                                    <p className={styles.heroDesc}>{project.subtitle || project.description}</p>

                                    <div className={styles.tagsRow}>
                                        {project.tags.slice(0, 3).map(tag => (
                                            <ProjectTag key={tag} label={tag} />
                                        ))}
                                    </div>

                                    <div className={styles.metaRow}>
                                        <span className={styles.metaItem}><MapPin size={16} /> {project.city}</span>
                                    </div>

                                    {/* Footer: Avatar Stack + Progress */}
                                    <div className={styles.cardFooter}>
                                        <div className={styles.avatarStack}>
                                            {(project.membersAvatars || []).slice(0, 4).map((initials, index) => (
                                                <div
                                                    key={index}
                                                    className={styles.stackAvatar}
                                                    style={{ zIndex: 10 - index }} // Stack order
                                                    title="Member"
                                                >
                                                    {initials}
                                                </div>
                                            ))}
                                            {(project.membersAvatars || []).length > 4 && (
                                                <div className={`${styles.stackAvatar} ${styles.moreCount}`}>
                                                    +{(project.membersAvatars || []).length - 4}
                                                </div>
                                            )}
                                        </div>

                                        <div className={styles.progressInfo}>
                                            <span className={styles.progressLabel}>Team</span>
                                            <span className={styles.progressText}>
                                                {project.currentMembers}/{project.maxMembers}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>
            {filteredProjects.length === 0 && (
                <div className={styles.emptyState}>No projects match your filters.</div>
            )}
        </div>
    );
};
