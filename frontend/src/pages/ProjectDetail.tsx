import React from 'react';
import { ProjectHeader } from '../components/features/projects/ProjectHeader';
import { TeamSection } from '../components/features/projects/TeamSection';
import { ProjectTimeline } from '../components/features/projects/ProjectTimeline';
import type { Project, TimelinePost } from '../types';
import styles from './ProjectDetail.module.css';

// Dummy Data
const PROJECT_DATA: Project & { timelinePosts: TimelinePost[] } = {
    id: "1",
    title: "EcoTrack",
    description: "A mobile application gamifying carbon footprint tracking. We believe that by making sustainability social and fun, we can drive real change. The app will track daily activities, calculate carbon scores, and allow friends to compete in weekly eco-challenges.",
    imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=2613",
    tags: ["React Native", "Node.js", "Green Tech", "Social"],
    status: 'Recruiting',
    currentMembers: 3,
    maxMembers: 5,
    likes: 45,
    category: 'Mobile Apps',
    uni: 'Duke University',
    city: 'Durham, NC',
    image: '', // unused in detail view but required by type
    requiredSkills: ["React Native", "AWS", "UI/UX Design", "Node.js"],
    members: [
        {
            id: "1",
            name: "Sarah Chen",
            role: "Project Lead & Frontend",
            avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256",
        },
        {
            id: "2",
            name: "Marcus Rodriguez",
            role: "Backend Architect",
            avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256",
        },
    ],
    timelinePosts: [
        {
            id: "1",
            title: "Project Kickoff",
            date: "Sep 15, 2024",
            type: "milestone",
            author: { id: "1", name: "Sarah Chen", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256" },
            preview: "Officially started the project. Defined core requirements and set up the repository structure.",
        },
        {
            id: "2",
            title: "Design System V1",
            date: "Oct 02, 2024",
            type: "update",
            author: { id: "1", name: "Sarah Chen", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256" },
            preview: "Completed the initial design system including color palette, typography and core component library.",
        },
        {
            id: "3",
            title: "Alpha Release 0.1",
            date: "Nov 20, 2024",
            type: "release",
            author: { id: "2", name: "Marcus Rodriguez", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256" },
            preview: "Deployed the first alpha version to internal testers. Basic auth and tracking features are working.",
        },
        {
            id: "4",
            title: "User Feedback Loop",
            date: "Dec 10, 2024",
            type: "update",
            author: { id: "1", name: "Sarah Chen", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256" },
            preview: "Gathered feedback from 20 alpha testers. Main request is for better social integration features.",
        },
    ]
};

export const ProjectDetail: React.FC = () => {
    return (
        <div className={styles.pageContainer}>
            <div className={styles.mainContent}>
                <ProjectHeader
                    title={PROJECT_DATA.title}
                    description={PROJECT_DATA.description}
                    imageUrl={PROJECT_DATA.imageUrl || ""}
                    tags={PROJECT_DATA.tags}
                />

                <TeamSection
                    requiredSkills={PROJECT_DATA.requiredSkills || []}
                    members={PROJECT_DATA.members || []}
                />

                <ProjectTimeline
                    posts={PROJECT_DATA.timelinePosts}
                />
            </div>
        </div>
    );
};
