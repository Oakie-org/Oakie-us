# Frontend Developer Guide

## 1. Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation
```bash
cd frontend
npm install
```

### Running Locally
```bash
npm run dev
# Server running at http://localhost:5173
```

## 2. Architecture Overview

### Folder Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── common/       # Reusable UI (Card, Button, Input)
│   │   ├── layout/       # Sidebar, Header, AppLayout
│   ├── pages/            # View Components (Projects, Profile, Home)
│   ├── assets/           # Static files
│   ├── App.tsx           # Main Router
│   └── main.tsx          # Entry Point
```

## 3. Key Features & Implementation

### Explore Projects (`Projects.tsx`)
-   **Smart Sticky Filter**: The filter bar is a floating element that reacts to scroll direction.
    -   *Logic*: `scrollY` delta tracking in `useEffect`.
    -   *Style*: `Projects.module.css` -> `.filterRow` (Fixed `top: 24px`, glassmorphism).
-   **Premium Cards**:
    -   *Avatar Stack*: Displays up to 4 members + count.
    -   *Progress*: Text-based `Current/Max` indicator.

### Styling Strategy
-   **CSS Modules**: We use `*.module.css` to scope styles to components.
-   **Variables**: Global tokens in `index.css` (Colors, Spacing, Shadows).
-   **Design Philosophy**: "Premium & Airy". Use ample whitespace (`gap: 40px`), large border-radius (`24px`), and soft shadows.

## 4. Future Roadmap
-   [ ] **Project Detail**: Enhance the detail view to match the new card aesthetics.
-   [ ] **Animations**: Add Framer Motion for page transitions.
-   [ ] **Backend Integration**: Replace mock data in `Projects.tsx` with API calls.
