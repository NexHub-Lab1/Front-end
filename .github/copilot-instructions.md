# NexHub Frontend Guidelines

## Build and Test

- `npm run dev`: Start Vite dev server (port 5173, proxies `/api/*` to `http://localhost:8080`)
- `npm run build`: Type-check and build to `dist/`
- `npm run lint`: ESLint check
- No testing framework configured yet

## Architecture

- **React 19 + React Router v7**: Client-side routing with auth guards
- **Single auth state**: `currentUser` in App.tsx, persisted in localStorage (`'nexhub-auth-user'`)
- **Protected routes**: Auto-redirect to `/auth/login` if not authenticated
- **Component structure**: `ui/` (primitives), `app/` (compositions), `pages/` (full screens)
- **Styling**: Tailwind CSS + CVA variants, HeroUI base

## Code Style

- **Naming**: PascalCase components, kebab-case files
- **Types**: Centralized in `src/types/app.ts`, export alongside components
- **Utilities**: `cn()` from `lib/utils.ts` for Tailwind merging
- **Auth headers**: Always include `Authorization: Bearer {token}` in API requests

## Conventions

- **File organization**: Components in own files, pages in `pages/`, helpers in `lib/`
- **Async data**: `useEffect` + `useState`, cast responses to `ApiResponse<T>`
- **Forms**: Local state, manual validation objects
- **Event handlers**: Prefixed with `on` (e.g., `onSignOut`)

## Common Pitfalls

- Missing auth guards on protected routes
- Forgetting Authorization headers in API calls
- Date strings from API need `new Date()` conversion
- Backend must run on port 8080 for dev proxy
- Dark mode requires `dark` class on `<html>`

See [docs/NEXHUB_FRONTEND_WORKSPACE.md](docs/NEXHUB_FRONTEND_WORKSPACE.md) for detailed documentation.</content>
<parameter name="filePath">c:\Users\bauti\projects\NexHub\frontend\.github\copilot-instructions.md