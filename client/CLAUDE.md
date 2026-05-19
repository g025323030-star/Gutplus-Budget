# Gutplus Budget — Client CLAUDE.md

See root `CLAUDE.md` for monorepo structure and shared types.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v3
- Framer Motion (animations)
- lucide-react (icons)
- recharts (charts)
- axios (HTTP, `withCredentials: true` set globally in `main.tsx`)
- react-router-dom v7

## Design System

### Color Tokens (tailwind.config.js)

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#163351` | Headings, primary text, secondary buttons |
| `accent` | `#358383` | Primary buttons, active states, key icons |
| `background` | `#F1F5F9` | App background |
| `surface` | `#FFFFFF` | Cards, inputs, nav |

Status colors use standard Tailwind: `green-500` (income/positive), `red-500` (over-budget), `yellow-500` (expense day).

### Typography Classes (index.css)

Use these utility classes — do not hardcode font sizes:
- `.heading-1` `.heading-2` `.heading-3` — navy bold headings
- `.body-text` `.body-text-sm` — slate-600 body
- `.label-text` — slate-700 form labels

### UI Rules

- White space: minimum `p-6` or `p-8` for page containers
- Cards: `rounded-xl` or `rounded-2xl`, `shadow-sm` at rest, `shadow-md` on hover
- Transitions: `transition-all duration-300` on interactive elements
- Icons: `lucide-react` exclusively, always `strokeWidth={1.5}`
- Tables/lists: zebra rows or `border-slate-100` separators for financial data
- Inline styles: never — use Tailwind classes only

### RTL

The app is RTL-first. `index.html` has `dir="rtl"`. All layouts, flex directions, and paddings must work correctly in RTL. Test every new component in RTL.

### Responsive

Breakpoints from tailwind.config.js: `sm:640px`, `md:768px`, `lg:1024px`.
All screens must be usable on mobile. Desktop-first is fine, but mobile must not break.

## File Structure

```
src/
├── pages/          — one file per route (e.g. SnapshotPage.tsx)
├── components/     — shared and feature components (group by feature in subfolders)
├── services/       — axios calls, one file per resource (e.g. transactions.service.ts)
├── context/        — React context + hooks (AuthContext.tsx → useAuth())
├── hooks/          — standalone hooks (e.g. useIdleTimer.ts)
├── styles/         — index.css (global styles + typography utilities)
└── utils/          — pure utility functions
```

## React Patterns

- Functional components with hooks only — no class components
- Import types from `@gutplus/shared`, never redefine locally
- Form state: `useState` per field (no form library currently installed)
- Data fetching: axios in `services/`, called from components or hooks — no direct axios in JSX
- Every data-loading section needs three states: **Loading** (skeleton with pulse), **Empty**, **Error**
- All interactive elements need ARIA labels and visible focus states

## Auth

- `useAuth()` from `AuthContext` provides: `isAuthenticated`, `isLoading`, `checkAuth()`, `logout()`
- `checkAuth()` calls `GET /users/me` — returns false on failure
- `logout()` calls `POST /users/logout` — clears cookie server-side
- Protected routes: wrap with `<ProtectedRoute>` in `App.tsx` (Outlet pattern)
- Idle timeout: 5 minutes, handled in `ProtectedRoute` via `useIdleTimer.ts`, shows `IdleWarningModal`

## Services Convention

Follow the pattern in `src/services/user.service.ts`:
- Named exports (not default)
- Each function is `async`, returns typed data from `@gutplus/shared` contracts
- Errors propagate — don't swallow them in the service

## Routing

All auth-gated routes go inside the `<ProtectedRoute>` Outlet in `App.tsx`.
After login, the user lands on `/snapshot` (or `/dashboard` which redirects there).
