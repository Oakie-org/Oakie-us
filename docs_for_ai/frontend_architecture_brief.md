# Frontend Architecture Brief (Oakie)

## 1. Stack

- React (Vite) + TypeScript
- TailwindCSS v4 + shadcn/ui
- CSS Modules
- lucide-react icons

## 2. Application Shell

**Entry**: `src/pages/ApplicationShell.tsx`

- Uses shadcn-studio `application-shell-08` template
- SidebarProvider + floating Sidebar + main content with Outlet
- Header with search, share, language, activity, notifications, profile dropdowns

**Routing** (`src/App.tsx`):

```
/ → ApplicationShell
  ├─ /explore → ExploreProjects
  ├─ /create → CreateProjectPage
  ├─ /projects/:id → ProjectDetailPage
  └─ /profile → ProfilePage
```

## 3. Pages

| Page             | Path          | File                              |
| ---------------- | ------------- | --------------------------------- |
| Explore Projects | /explore      | `src/pages/ExploreProjects.tsx`   |
| Create Project   | /create       | `src/pages/CreateProjectPage.tsx` |
| Project Detail   | /projects/:id | `src/pages/ProjectDetailPage.tsx` |
| User Profile     | /profile      | `src/pages/ProfilePage.tsx`       |

## 4. Sidebar Navigation

**Core Pages**:

- Explore → /explore
- Create Project → /create
- Future Feature (×3) → placeholder

**Visualization**:

- View Profile → /profile
- Data Export → #
- Integrations → submenu

## 5. Components

### UI (`src/components/ui/`)

shadcn primitives: Button, Input, Card, Avatar, Sidebar, Separator, Label, Textarea, Select, etc.

### shadcn-studio blocks (`src/components/shadcn-studio/blocks/`)

- dropdown-profile.tsx (has View Profile → /profile navigation)
- dropdown-share.tsx
- dropdown-language.tsx
- dropdown-notification.tsx
- dialog-search.tsx
- dialog-activity.tsx

### Feature Components (`src/components/features/projects/`)

- ProjectHeader.tsx
- TeamSection.tsx
- ProjectTimeline.tsx

### Common (`src/components/common/`)

- ProjectTag.tsx

## 6. Type Definitions

`src/types/index.ts`:

```ts
interface User { id, name, role, avatar, skills[], location?, website? }
interface Member { id, name, role, avatar }
interface TimelinePost { id, author: Member, content, timestamp, likes, comments }
interface Project { id, title, subtitle, description, thumbnail, tags[], members: Member[], timeline: TimelinePost[], status }
```

## 7. Mock Data

`src/data/mockProjects.ts`: Array of Project objects for ExploreProjects and ProjectDetailPage

## 8. Assets

- Logo: `src/assets/oakie-logo.jpg` (used in sidebar header, h-34)
- SVGs: `src/assets/svg/`

## 9. Tailwind v4 Syntax

**CSS Variables**: Use `w-(--var)` not `w-[--var]`

```tsx
// ✅ Correct
className = "w-(--sidebar-width)";
// ❌ Wrong
className = "w-[--sidebar-width]";
```

## 10. Key Patterns

- Pages use CSS Modules (`.module.css`)
- Colors use `hsl(var(--primary))` shadcn tokens
- Routes via react-router-dom with nested Outlet
- Profile dropdown uses `useNavigate()` for View Profile
