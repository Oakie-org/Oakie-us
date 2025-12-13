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

- **`frontend/src/components/ui/*`**: Local shadcn-style primitives (Button, Input, Card, Select, Avatar, etc.).
  - _Style_: Components are Tailwind-styled but should use the existing design tokens (`--color-*`, `--shadow-*`, `--radius-*`) so the UI stays consistent.
- **`Login.tsx`**: Gradient background, glass card login.

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

## 5. Context for AI

- **Primitives**: Prefer `shadcn/ui` primitives in `frontend/src/components/ui/*` for shared UI building blocks.
- **Styling**: Use **CSS Modules** for page/layout composition (`[Name].module.css`), and keep visuals aligned with existing design tokens.
- **Icons**: Use `lucide-react`.
- **State**: Use React Hooks (`useState`, `useEffect`).
- **Convention**: Keep components small, detached, and visually distinct.
