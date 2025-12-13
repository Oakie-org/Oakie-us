# Frontend Architecture Brief (Oakie)

## 1. Project Overview

**Oakie** (formerly Dada Island) is a modern web platform for project collaboration.

- **Stack**: React (Vite), TypeScript, TailwindCSS + `shadcn/ui` primitives, CSS Modules, Lucide React (Icons).
- **Core Design**: Premium Minimalist, Glassmorphism, "Floating Island" UI.

## 2. Key Components

### Core Layout

- **`AppLayout.tsx`**: Main wrapper with Sidebar and Global Search.
- **`Sidebar.tsx`**: Sidebar navigation (composed from shadcn primitives + CSS Modules layout).
- **`TopHeader.tsx`**: Search + actions (composed from shadcn primitives + CSS Modules layout).

### Pages

- **`Projects.tsx` (Explore)**:
  - **Feature**: Smart Sticky Floating Filter.
  - **Logic**: Hides on scroll down, shows on scroll up (`useEffect` hook).
  - **UI**: Rounded "Pill Row", detached from edges, glassmorphism.
- **`ProjectDetail.tsx`**: Detailed view of a project.
- **`Profile.tsx`**: User profile with charts and tabs.

### UI Components

- **`frontend/src/components/ui/*`**: Local shadcn-style primitives (Button, Input, Card, Select, Avatar, Separator, etc.).
  - _Style_: Components are Tailwind-styled but should use the existing design tokens (`--color-*`, `--shadow-*`, `--radius-*`, `--spacing-*`) so the UI stays consistent.
- **`frontend/src/components/common/ProjectTag.tsx`**: Reusable tag pill used across Explore/Detail.
- **`frontend/src/components/features/projects/*`**: Project detail blocks (`ProjectHeader`, `TeamSection`, `ProjectTimeline`) and `CreateProjectModal`.

### Shared Logic

- **`frontend/src/types/index.ts`**: Centralized interfaces for `User`, `Project`, `Member`, `TimelinePost`.
- **`frontend/src/data/mockProjects.ts`**: Centralized mock data for Explore + Detail pages.

## 3. Design Tokens (`index.css`)

- **Colors**:
  - `--color-primary`: `#2563EB` (Blue)
  - `--color-background`: `#FFFFFF`
- **Spacing**: `var(--spacing-xs)` to `var(--spacing-3xl)`.
- **Radius**: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-full`.
- **shadcn tokens**: also defines `--background/--foreground/--primary/...` (used by Tailwind classes in `frontend/src/components/ui/*`).

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

- **Primitives**: Prefer `shadcn/ui` primitives in `frontend/src/components/ui/*` for shared UI building blocks.
- **Styling**: Use **CSS Modules** for page/layout composition (`[Name].module.css`), and keep visuals aligned with existing design tokens.
- **Icons**: Use `lucide-react`.
- **State**: Use React Hooks (`useState`, `useEffect`).
- **Convention**: Keep components small, detached, and visually distinct.
