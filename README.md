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
Apprenticeships, Jobs). Both also show a Form Builder link in the sidebar, and
the super admin's Overview has a Form Builder summary card (see below).

## Form Builder (schema-driven content)

A generic, no-code content system: admins design **content types** (blank form → card → detail
page → listing presentation) and **response forms**; Edeco renders whatever is published.
Nothing about specific content (jobs, courses, …) is hard-coded.

It runs in the **same server and frontend** as the portal, behind the **existing Edeco login**
(the auth flow is unchanged — the module reuses `protect` and only adds Form Builder
permissions on top). It keeps its own boundary: `cms_*` collections, its own models/services,
and Edeco pages read it only through the delivery layer.

| Where | What |
|---|---|
| `backend/cms/` | module: models, services, controllers, routes (`index.js` mounts it) |
| `backend/cms/shared/` | schema engine shared with the frontend: field types, validation, conditional logic, card/page registries |
| `frontend/src/features/cms/studio/` | Form Builder app at **`/form-builder`** (admins + super admin) |
| `frontend/src/features/cms/render/` | Edeco renderers: `DynamicFieldRenderer`, `DynamicCardRenderer`, `DynamicSectionRenderer`, `DynamicDetailPageRenderer` |
| `frontend/src/features/cms/pages/` | public pages: `/explore`, `/explore/:type`, `/explore/:type/:entry`, `/cms-preview` |

`backend/cms/shared` is copied into `frontend/src/features/cms/shared` (the frontend deploys on
its own). After editing it run `cd backend && npm run sync:cms-shared` (`check:cms-shared` for CI).

### Lifecycle

- Content types: form / card / page / presentation are each edited as drafts (autosave,
  undo/redo, conflict detection) and **published independently into immutable versions**.
  Keys of published fields are locked; removed fields keep their data; publish shows an impact report.
- Entries: `draft → review → published → unpublished / archived`. Editing a published entry only
  changes its draft until it is published again; every publish is a restorable version.
- Preview never publishes: it renders saved drafts through the real Edeco renderers via a
  short-lived signed token (`/cms-preview?token=…`, desktop/tablet/mobile, sample or real data).

### APIs

| Prefix | Auth | Purpose |
|---|---|---|
| `/api/cms/admin/*` | Edeco session (admin / super admin) + Form Builder permission | the builder |
| `/api/cms/public/*` | none (published data only) / Edeco session for submissions | portal pages, response forms |
| `/api/cms/v1/*` | API key (`Authorization: Bearer fbk_…`, scoped) | server-to-server, e.g. the main Edeco site |
| `/api/webhooks/form-builder` | HMAC signature | reference webhook receiver |

v1: `GET content-types`, `content-types/:slug`, `content-types/:slug/content?q&page&limit&sort&filters[fieldId]=`,
`content-types/:slug/content/:entrySlug`, `content/:id`, `content/:id/related`, `media/:id`, `forms/:slug`,
`POST forms/:slug/submissions` (`{ data, contentId, user: { id, email, name }, source, context }`),
`POST forms/:slug/uploads?fieldId=`, `GET preview/:token`, `GET stats`.

### Webhooks

Events: `content.created|updated|published|unpublished|archived`, `schema.updated`, `card.updated`,
`page.updated`, `presentation.updated`, `submission.created|updated`. Each POST carries
`X-Edeco-Event`, `X-Edeco-Delivery` (stable across retries — de-duplicate on it) and
`X-Edeco-Signature: t=<unix>,v1=<hex>` where `v1 = HMAC_SHA256(secret, "<t>.<raw body>")`.
Verify against the **raw** body with a constant-time compare and reject timestamps older than
5 minutes (see `backend/cms/routes/webhookReceiverRoutes.js`). Failed deliveries retry with
backoff (1m, 5m, 30m, 2h, 12h); the log and manual retry are under *System settings → Webhooks*.

### Roles & permissions

Identity and roles come from Edeco. The super admin always has full access and alone manages
admins, permissions, system settings, API keys, webhooks and audit logs. Admins get the default
access set (Permissions page; editor preset out of the box) unless configured individually under
*Admins*. Students never reach `/form-builder` or `/api/cms/admin`.

### Environment (backend `.env`, all optional in development)

| Variable | Purpose |
|---|---|
| `CMS_PREVIEW_SECRET` | signs preview links — **required in production** (32+ random chars) |
| `CMS_SITE_URL` | public site origin for absolute preview links (relative when empty) |
| `CMS_PUBLIC_BASE_URL` | base for absolute media URLs in `/api/cms/v1` (defaults to the request host) |
| `CMS_BOOTSTRAP_API_KEY` | optional v1 key from env (24+ chars); prefer keys created in the UI |
| `CMS_BOOTSTRAP_WEBHOOK_URL` / `CMS_BOOTSTRAP_WEBHOOK_SECRET` | optional endpoint registered on first boot |
| `CMS_WEBHOOK_SECRET` | secret the reference receiver verifies incoming webhooks with |
| `CMS_UPLOAD_DIR` / `CMS_PRIVATE_UPLOAD_DIR` | media dirs (default `uploads/cms`, `uploads-private/cms`) |
| `CMS_MAX_UPLOAD_MB`, `CMS_PREVIEW_TTL_MINUTES`, `CMS_CACHE_TTL_SECONDS` | limits / TTLs |

Uploads are type-checked by content (magic bytes), SVG is rejected, library media is served from
`/uploads/cms`, and response attachments are stored privately and only streamed to admins.
Published reads are cached (Redis when `REDIS_URL` is set) and invalidated on every publish.
