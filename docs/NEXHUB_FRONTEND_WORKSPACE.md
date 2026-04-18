# NexHub Frontend - Workspace Instructions

## Project Overview
React 19 + TypeScript + Vite + Tailwind CSS + HeroUI frontend for a project collaboration platform. Client-side authentication with JWT tokens stored in localStorage. Communicates with backend API at `/api/`.

---

## Build & Development Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server on port 5173 with HMR |
| `npm run build` | Type-check with TSC, then build with Vite → `dist/` |
| `npm run lint` | Run ESLint on all `.ts` and `.tsx` files |
| `npm run preview` | Preview production build locally |

**API Proxy Setup**: Dev server automatically proxies `/api/*` to `http://localhost:8080` (configured in vite.config.ts)

---

## Architecture

### Routing (React Router v7)
- **Root**: `/` → LandingPage
- **Auth**: `/auth/login`, `/auth/signup` → AuthPage (mode prop changes behavior)
- **User-Only Routes** (auto-redirect to login if not authenticated):
  - `/profile` → ProfilePage
  - `/projects` → ProjectsPage  
  - `/project/:id` → ProjectDetailPage
- **Guard Pattern**: App.tsx manages auth state and conditionally renders routes

### State Management
- **Single source of truth**: `currentUser` state in App.tsx (User type from types/app.ts)
- **No global state library** (Redux/Zustand not used)
- **Prop drilling**: Auth callbacks passed through component tree
- **localStorage**: Auth data stored via `readStoredAuthUser()` / `persistUser()`

### Authentication Flow
1. `AuthPage` handles login/signup → calls backend `/api/auth/signup` or `/api/auth/login`
2. Success returns `AuthUser` (user object + JWT token)
3. `persistUser()` saves to localStorage under key `'nexhub-auth-user'`
4. `readStoredUser()` hydrates state on app load
5. All API requests include `Authorization: Bearer {token}` header

---

## Component Organization

### Folder Structure
```
src/components/
├── app/          # App-level compositions (AppHeader, SideMenu, StatLine, etc.)
├── ui/           # Reusable primitive UI components (Button, Card, Input, Modal, Badge, Tabs)
└── custom/       # (empty) Reserved for custom domain-specific components
```

### Component Patterns

**UI Components** (in `ui/`):
- Built with `class-variance-authority` (CVA) for variant styles
- Use `forwardRef` and export types alongside component
- CVA example: Button has `variant` (default|primary|outline|secondary|ghost) + `size` (default|sm|lg|icon)
- Card pattern: Card + CardHeader/CardTitle/CardDescription/CardBody subcomponents
- Import `cn()` from `lib/utils` for merging Tailwind classes

**App Components** (in `app/`):
- BrandMark: Logo/brand identity
- AppHeader: Top navigation with user menu
- SideMenu: Responsive side navigation
- StatLine: Display metric/statistic

**Page Components** (in `pages/`):
- Called "pages" but are full-screen compositions
- ProfilePage → contains ProfileTabs (profile.tsx, projects.tsx sub-routes)
- Receive callbacks for auth actions (onSignOut, onUserUpdate, onOpenMenu)
- Manage their own local form state

### Naming Conventions
- PascalCase for React components: `AppHeader`, `ProfilePage`, `ProjectsTab`
- kebab-case for file names: `app-header.tsx`, `project-detail-page.tsx`
- Props interfaces: `ComponentProps` (e.g., `ButtonProps extends React.ButtonHTMLAttributes<...>`)
- Exported components + types explicitly: `export { Button, ButtonProps, buttonVariants }`

---

## Key Libraries & Dependencies

| Library | Version | Usage |
|---------|---------|-------|
| React | 19.2.4 | UI framework + hooks |
| React Router | 7.13.2 | Client-side routing |
| TypeScript | ~5.9.3 | Type safety |
| Vite | 8.0.1 | Build tool + dev server |
| Tailwind CSS | 4.2.2 | Utility-first styling |
| HeroUI | 2.8.10 | Component library base |
| Framer Motion | 12.38.0 | Animation library |
| Lucide React | 0.577.0 | Icon library |
| class-variance-authority | 0.7.1 | Component variant system |
| @radix-ui | Slots/Tabs | Accessible component primitives |
| React Compiler | ^1.0.0 | **Enabled** by default (Babel plugin) |

**React Compiler Note**: Adds compilation overhead. Performance impact observable in dev. See README for how to disable if needed.

---

## Type System & Data Models

**Key Types** (in `src/types/app.ts`):
```
AuthMode: 'login' | 'signup'
AuthUser: { user: User, token: string }
User: { id, username, email }
ProjectResponse: Full project data from backend
ProjectForm: Form data for creating projects
ProjectUpdateForm: Form data for updating projects
ApiResponse<T>: { status, message, data, timestamp }
AppRoute: Union of all app routes for type-safe navigation
```

**Storage Keys**:
- `'nexhub-auth-user'` → localStorage key for AuthUser

**API Endpoints**:
- `/api/auth/signup`, `/api/auth/login`, `/api/auth/updateaccount`, `/api/auth/deleteaccount`, `/api/auth/signout`
- `/api/projects` → Get all projects (with auth header)
- `/api/projects/owner/{userId}` → Get user's projects
- `/api/projects/{id}` → Get project by ID

---

## Styling & CSS

### Tailwind Configuration
```
tailwind.config.js: No theme extensions (uses defaults)
Dark mode: class-based (not system-based)
Content: scans ./index.html and src/**/*.{js,ts,jsx,tsx}
```

### CSS Files
- `index.css` → Global styles & `@tailwind` directives
- `App.css` → App-level component styles (minimal)
- Component styles → Inline Tailwind classes + CVA

### Utility Functions
- `cn()` from `lib/utils.ts` → Combines clsx + tailwind-merge (for safe Tailwind class merging)

---

## Conventions & Best Practices

### File Organization
1. Each component in its own file matching its name (kebab-case)
2. Pages grouped in `pages/` folder with sub-routes in subfolders
3. Reusable UI primitives in `ui/`, app-specific UI in `app/`
4. All types centralized in `types/app.ts`
5. Utilities/helpers in `lib/` (auth, navigation, storage, utils)

### Async Data Fetching
- **Pattern**: `useEffect` + `useState` for loading/fetching
- **No React Query**: Direct fetch calls with headers
- **Error Handling**: Returned as null on failure (see `getAllProjects()`)
- **Type-safe responses**: Cast to `ApiResponse<T>` then extract `.data`

### Form Handling
- **Local state**: `setState` for form fields
- **Validation**: Manual validation objects (see ProjectsTab)
- **Error display**: `setCreateErrors` object tracks field-specific errors
- **Submission feedback**: `feedback` state tracks success/error messages

### Event Naming
- Handler functions prefixed with `on`: `onAuthSuccess`, `onSignOut`, `onOpenMenu`
- Consistent callback prop names across components for easy composition

---

## Potential Pitfalls & Gotchas

### ❌ Common Mistakes

1. **Missing auth guard on protected routes**
   - Always check `currentUser` before rendering auth-required pages
   - Example: ProfilePage wrapped in `currentUser ? <Component /> : <Navigate to="/auth/login" />`

2. **Forgetting Authorization header**
   - All API requests to `/api/projects` and user endpoints require `Authorization: Bearer {token}`
   - Helper functions in `user-storage.ts` handle this (use them!)

3. **localStorage parsing errors**
   - `readStoredAuthUser()` catches JSON.parse errors and clears bad data
   - Always call `readStoredUser()` not direct localStorage access

4. **Type mismatches on ProjectResponse**
   - `updatedAt`, `createdAt`, `lastActiveAt` are dates but come from API as strings
   - Must convert: `.map(p => ({ ...p, updatedAt: new Date(p.updatedAt), ... }))`

5. **React 19 + useActionState gotchas**
   - Project uses React 19 hooks; check docs if using newer hook patterns
   - Compiler impact: if dev performance is bad, disable React Compiler in vite.config.ts

6. **Dark mode class not applied**
   - Tailwind dark mode uses `class` strategy; add `dark` class to `<html>` to enable
   - Default is light mode

7. **Vite dev server HMR issues**
   - Proxy config in vite.config.ts only affects `/api/` routes
   - Backend must be running on `http://localhost:8080` for dev to work

### ⚠️ Architectural Constraints

- **Single User Auth**: Only one user per session (no multi-account switching)
- **No offline support**: All data fetching requires backend connectivity
- **No caching layer**: Repeated fetches hit backend each time
- **No error boundaries**: Component errors will crash the app (consider adding)
- **No i18n**: No multi-language support built in

---

## Documentation Inventory

- **README.md**: Template docs (standard Vite React setup guide)
- **This file**: Workspace instructions
- **In-code**: Minimal inline comments (self-documenting TSX/TS)

**Missing Documentation**:
- No API specification document
- No component storybook/showcase
- No testing guide (no tests configured)
- No deployment guide (only Dockerfile provided)

---

## Testing Setup

**Current Status**: ❌ No testing framework installed
- No Jest, Vitest, or Cypress
- No unit, integration, or e2e tests
- Consider adding: Vitest (lightweight, Vite-native) + React Testing Library

---

## Deployment

### Docker Setup
```dockerfile
# Multi-stage build
Stage 1: Node:20-alpine → npm build → outputs to /app/dist
Stage 2: Nginx:alpine → serves /app/dist over port 80

# Nginx config: SPA routing (try_files $uri / /index.html)
# API proxy: /api/* → http://backend:8080/api/*
```

**Docker Compose**: Needs `frontend` service + link to `backend` service (instructions in Dockerfile comments)

---

## Quick Start Checklist

- [ ] `npm install` – Install dependencies
- [ ] Backend running on `http://localhost:8080` – For API calls to work
- [ ] `npm run dev` – Start Vite dev server (http://localhost:5173)
- [ ] Open http://localhost:5173 in browser
- [ ] Test auth flow: sign up, log in, navigate to protected routes
- [ ] Run `npm run lint` to check code style
- [ ] Run `npm run build` to verify production build

---

## Notable Files & Directories

| Path | Purpose |
|------|---------|
| `src/App.tsx` | Root router + auth state manager |
| `src/lib/auth-storage.ts` | Auth persistence helpers |
| `src/lib/user-storage.ts` | Projects API fetching |
| `src/types/app.ts` | All shared TypeScript types |
| `src/components/ui/button.tsx` | Base button variant system (reference for CVA pattern) |
| `src/pages/*/profile-tabs/*.tsx` | Example of sub-routed tab components |
| `vite.config.ts` | Dev server config + React Compiler + API proxy |
| `tailwind.config.js` | Minimal config (defaults used) |
| `eslint.config.js` | Flat config format (ESLint 9+) |

---

## Summary

**This is a modern React SPA** with:
- ✅ Strong TypeScript typing
- ✅ Component composition over global state
- ✅ Tailwind + CVA for scalable styling
- ✅ Minimal dependencies (focused scope)
- ⚠️ No testing framework
- ⚠️ Basic error handling
- ⚠️ Single-user auth per session
- 🐳 Containerized for deployment

**Best Practices to Maintain**:
1. Keep component files small & focused
2. Use `cn()` for Tailwind merging
3. Always include Authorization headers in API calls
4. Guard protected routes with auth state checks
5. Validate form inputs before submission
6. Use forwardRef for reusable UI components
7. Export component types alongside components