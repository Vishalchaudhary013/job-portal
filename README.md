# Edeco Career Services portal

Separate frontend + backend for Career Services (jobs, internships,
apprenticeships) with the Edeco admin / super-admin dashboard.
The section also stays in the main Edeco app — nothing was removed there.

| App | Folder | Port |
|---|---|---|
| Frontend (Vite + React) | `frontend/` | 5175 |
| Backend (Express) | `backend/` | 3001 |

## Run

```bash
# 1) backend
cd backend
cp .env.example .env        # fill in values (same as Edeco backend/.env, PORT=3001)
# Google Sheets: put the service-account key at backend/config/google-service-account.json
npm install
npm run dev                 # http://localhost:3001  (GET /health)

# 2) frontend
cd ../frontend
cp .env.example .env        # VITE_API_CAREER_SERVICES=https://career-services-85ue.onrender.com
npm install
npm run dev                 # http://localhost:5175
```

## Backend

- Trimmed copy of Edeco `backend/`: controllers, models, middleware, services and
  utils are verbatim copies. Only `server.js` is new.
- **Same MongoDB as Edeco** (`MONGO_URI`) and same `JWT_SECRET`, so admins,
  users, jobs, internships and applications are shared with the main site.
- Mounted APIs: `/api/auth` (login/signup, directory, view admin password,
  open admin account, change password, approve admin, stakeholder Excel +
  Google Sheet export, export-sheet link), `/api/internships` (internships, jobs,
  apprenticeships), `/api/global-programs`, `/api/applications`, `/api/forms`,
  `/api/templates`, `/api/submissions`, `/api/custom-categories`,
  `/api/student-profile` (+ `/academic-records`).
- Not started (the main Edeco backend already runs them on the shared DB):
  cron jobs / notifiers, WhatsApp provider boot, default template seeding.
- Uploads go to `backend/uploads`; existing files are also served from Edeco's
  `backend/uploads` (override with `EDECO_UPLOADS_DIR`).

## Dashboard

`/super-admin-dashboard` and `/admin-dashboard` — same UI and behaviour as Edeco
(view admin password, open an admin's account and return, change password,
approve access, delete account, Excel export + Google Sheet sync), with tabs:
Overview · Stakeholders (Admins, Users) · Career Drive (Internships,
Apprenticeships, Jobs).
