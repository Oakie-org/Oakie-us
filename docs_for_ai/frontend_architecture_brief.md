# Frontend Architecture Brief (Oakie)

## 1. Project Overview
**Oakie** (formerly Dada Island) is a modern web platform for project collaboration.
- **Stack**: React (Vite), TypeScript, CSS Modules (Vanilla), Lucide React (Icons).
- **Core Design**: Premium Minimalist, Glassmorphism, "Floating Island" UI.

## 2. Key Components

### Core Layout
- **`AppLayout.tsx`**: Main wrapper with Sidebar and Global Search.
- **`Sidebar.tsx`**: Collapsible navigation.

### Pages
- **`Projects.tsx` (Explore)**:
    -   **Feature**: Smart Sticky Floating Filter.
    -   **Logic**: Hides on scroll down, shows on scroll up (`useEffect` hook).
    -   **UI**: Rounded "Pill Row", detached from edges, glassmorphism.
-   **`ProjectDetail.tsx`**: Detailed view of a project.
-   **`Profile.tsx`**: User profile with charts and tabs.

### UI Components
- **`Card.tsx`**: Base component for Project Cards.
    -   *Premium Style*: 24px Radius, Soft Shadow, Hover "Bloom".
-   **`Login.tsx`**: Gradient background, glass card login.
-   **`ProjectHeader.tsx`**: Split view, Hero Image, Premium Typography.
-   **`TeamSection.tsx`**: Skill tags and member list with detailed roles.
-   **`ProjectTimeline.tsx`**: Interactive horizontal scrolling timeline with milestone cards.

### Shared Logic
-   **`src/types/index.ts`**: Centralized interfaces for `User`, `Project`, `Member`, `TimelinePost`.

## 3. Design Tokens (`index.css`)
- **Colors**:
    -   `--color-primary`: `#4F46E5` (Indigo)
    -   `--color-background`: `#F9FAFB` (Light Gray)
-   **Spacing**: `var(--spacing-xs)` to `var(--spacing-3xl)`.
-   **Radius**: `var(--radius-lg)` (16px), `var(--radius-xl)` (24px).

## 4. Progress Log (2025-12-11)
1.  **Rebrand**: Renamed to "Oakie".
2.  **Premium Cards**: Redesigned Project Cards (Avatar Stack with +N badge, Team Progress text).
3.  **Smart Filter**: Implemented "Hide-on-Scroll-Down / Show-on-Scroll-Up" floating filter bar.
4.  **Project Detail (Premium)**: Implemented Header, Team, and Timeline sections interactively.
5.  **Refactor**: Standardized `Button` component and introduced shared TypeScript definitions.
6.  **Create Project Flow**: Implemented `CreateProjectModal` (Selection -> Form). Integrated with Sidebar.
7.  **Tags Refactor**: Separated Project `tags` (Content+Tech) from User `skills`. Implemented generic comma-separated input. Redesigned Tag UI (Pill + `#` prefix).
8.  **Schema Update**: Added `subtitle` (One-sentence intro) to `Project` interface for Explore cards.
9.  **Mock Data Centralization**: Extracted all project data to `src/data/mockProjects.ts`. Enabled dynamic lookup in `ProjectDetail.tsx` (ID-based routing).
10. **UI Refactor**: Enlarged `CreateProjectModal` (1000x800) and removed legacy search bar. Unified Tags UI with reusable `ProjectTag` component across Explore and Detail pages.

## 5. Context for AI
-   **Styling**: Use **CSS Modules** for all new components (`[Name].module.css`).
-   **Icons**: Use `lucide-react`.
-   **State**: Use React Hooks (`useState`, `useEffect`).
-   **Convention**: Keep components small, detached, and visually distinct.
