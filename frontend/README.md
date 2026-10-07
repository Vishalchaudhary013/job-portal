# Career Services portal — frontend

Vite + React app for the Career Services section and its admin dashboards.
Talks to this portal's own backend (`../backend`, port 3001). See `../README.md`.

## Run

```bash
cp .env.example .env   # VITE_API_CAREER_SERVICES = backend URL, VITE_EDECO_URL = main Edeco site
npm install
npm run dev            # http://localhost:5175
npm run build          # -> dist/
```

Stack: Vite 8.2.2 (same as main Edeco frontend), Tailwind CSS 4.3.x.

## Routes

- Public: `/` (career landing), `/internship`, `/job`, `/apprenticeship` (+ `/:id`),
  `/login`, `/signup`, `/choose-signup`, `/forget-password`. `/career-services` → `/`.
- Dashboards: `/admin-dashboard`, `/super-admin-dashboard` (+ `create-internship`,
  `edit-opportunity/:id`, `build-form/:id`).
- Anything else is forwarded to `VITE_EDECO_URL` + same path.

## How it's built

- Everything under `src/` except the files below is a verbatim copy of the
  matching file in Edeco `frontend/src` (same paths, no import edits).
- Portal-specific: `src/app/{main,App}.jsx`, `src/app/routes/AppRoutes.jsx`,
  `src/pages/NotFound.jsx`.
- Edited copies: `components/layout/NavBar.jsx` (`/` uses the career header),
  `features/admin/components/AdminSidebar.jsx` (tabs: Overview, Admins, Users,
  Internships, Apprenticeships, Jobs).
- Login is per-origin (token in localStorage) — same accounts as Edeco.
