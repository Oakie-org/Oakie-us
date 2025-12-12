export interface User {
    id: string;
    name: string;
    avatarUrl: string;
    email?: string;
}

export interface Member extends User {
    role: string;
    initials?: string; // For existing mock data support
}

export interface Project {
    id: number | string;
    title: string;
    description: string;
    tags: string[];
    status: 'Recruiting' | 'In Progress' | 'Idea' | 'Completed';
    currentMembers: number;
    maxMembers: number;
    likes: number;
    category: string;
    uni: string;
    city: string;
    image: string;
    imageUrl?: string; // For detail view hero image
    membersAvatars?: string[]; // Legacy support for Explore page
    members?: Member[]; // Full member support for Detail page
    requiredSkills?: string[];
}

export interface TimelinePost {
    id: string;
    title: string;
    date: string;
    author: User;
    type: 'milestone' | 'update' | 'release';
    preview: string;
}
