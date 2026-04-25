# LaunchLocal Dashboard

Internal web app that automates prospecting, site generation, sales, and client management for local businesses. Single SPA; team logs in and sees role-appropriate views.

## Rules for Claude
1. Read this file first, then state which files are affected and why
2. Read only files that are needed — do not read unaffected files
3. Prefer targeted edits; use full rewrites only for new files or intentional full rewrites — state which
4. No build tools — CDN only (Firebase v10 compat, Leaflet 1.9.4)
5. Apply all changes in one pass without re-reading mid-edit
6. On finish: confirm complete or provide a ready-to-paste handoff prompt
7. Update this file if architecture, modules, or file structure changes

## Tech Stack
- **Frontend:** Vanilla HTML / CSS / JS — no frameworks, no build tools
- **Backend:** Firebase (Firestore, Auth, Storage) — compat SDK v10 via CDN
- **Hosting:** Netlify (`Launch Local/` repo root). Firebase Hosting *not* used — Netlify publishes `Pipeline/` and runs `netlify/functions/` as the API + preview proxy layer.
- **Repo:** `J0hnb0n/LaunchLocal-Dashboard`
- **Maps:** Leaflet + OpenStreetMap (scouting), Nominatim geocoding
- **APIs:** Google Places v1 + PageSpeed Insights — both proxied through Netlify Functions (`/api/places`, `/api/pagespeed`). The API key lives in `GOOGLE_API_KEY` Netlify env var, never in the client bundle.
- **Site gen + sync:** Manual Claude Code CLI builds at `Client-Sites/{slug}/`. A Claude Code Stop hook (`.claude/settings.json` → `tools/site-upload-hook.sh`) auto-uploads recently-modified slug folders to Firebase Storage at `sites/{slug}/`. The dashboard previews them via `/preview/{slug}/...` (auth-gated Netlify Function over Storage). No per-PC sharing or git rules to learn — partner just installs the hook once.
- **Auth on previews:** Firebase ID token → server-side session cookie (`__llSession`) minted by `/api/session`. The preview iframe carries the cookie; bearer tokens not needed.
- **Stripe:** Field stubs only (`stripeInvoiceId`), no live API yet
- **Project Root:** `C:\Users\Woodl\Documents\AI_Projects\Launch Local`
- **Client Folder Naming:** Every new site auto-slugs from `businessName` → Title-Case-Hyphen (e.g. "Lam's Restaurant" → `Lams-Restaurant`). Logic in `Pipeline/js/utils/slug.js`. Slug is stable once generated (regen preserves it). Stored on both the `sites` doc and in `formData.clientSlug`.

## Architecture
SPA with hash routing. `Pipeline/index.html` = login only; successful auth redirects to `Pipeline/dashboard.html`, which renders modules into a content area. Firebase Auth handles session persistence.

## File Structure
```
Launch Local/                   (Netlify publishes from here; repo root)
├── .claude/settings.json       Project-level Stop hook → tools/site-upload-hook.sh
├── .gitignore, CLAUDE.md
├── netlify.toml                Hosting + redirects + functions config
├── netlify/functions/
│   ├── package.json            (firebase-admin)
│   ├── _shared/                admin.js (SDK init), auth.js (cookie/bearer validation)
│   ├── auth-session.js         POST /api/session → mint __llSession cookie
│   ├── auth-clear.js           POST /api/session/clear
│   ├── places.js               POST /api/places (Google Places proxy)
│   ├── pagespeed.js            GET  /api/pagespeed
│   └── preview.js              GET  /preview/{slug}/{...path} → Storage proxy
├── tools/                      Per-PC operator pipeline (NOT deployed by Netlify)
│   ├── README.md, setup-windows.bat, package.json
│   ├── site-upload-hook.sh     Stop hook bash wrapper
│   └── site-upload.js          firebase-admin uploader
├── Client-Sites/               (gitignored — auto-uploaded to Firebase Storage by hook)
│   └── {ClientSlug}/           Claude Code output (index.html, style.css, script.js, README.md, assets/)
└── Pipeline/                   Dashboard SPA (Netlify publish dir)
    ├── index.html, dashboard.html, firebase.json, .firebaserc
    ├── docs/                   DEPLOY.md (production checklist), backfill-clientSlug.md
    ├── css/                    theme.css, motion.css, main.css, components.css, modules.css
    ├── js/
    │   ├── app.js, auth.js, db.js, router.js
    │   ├── modules/            dashboard, scouting, prospects, sites, sales, projects, billing, expenses (.js)
    │   └── utils/              api.js, scoring.js, prompt-generator.js, slug.js, sampledata.js
    ├── templates/site-generation/   CLAUDE.md + restaurant/tradesperson/salon/retail.md
    └── firebase/firestore.rules, storage.rules
```

`firebase deploy --only firestore:rules,storage:rules` runs from inside `Pipeline/`. Everything else (Netlify deploys, Functions, hook setup) runs from the repo root.

## Local development

```bash
# from Launch Local/
netlify dev
```

Starts the static publish + Functions emulator at <http://localhost:8888>. `/api/*` and `/preview/*` work locally this way. Set `GOOGLE_API_KEY` and `FIREBASE_SERVICE_ACCOUNT` once via `netlify env:set` (or in a gitignored `.env`).

`python -m http.server` still works for dashboard-only UI tweaks but `/api/*` and `/preview/*` 404 unless you use `netlify dev`.

## Production setup

See [Pipeline/docs/DEPLOY.md](Pipeline/docs/DEPLOY.md) — top-to-bottom checklist covering secret rotation, Storage init, Auth domain wiring, env vars, first-admin seed, and the smoke test. Work through it once when going live and again whenever a new operator (e.g. partner) joins.

## Modules (all registered in router)
1. **Dashboard** (all roles) — KPI cards, pipeline funnel, real-time activity feed
2. **Scouting** (admin, sales) — Draggable pin + radius circle, category filter, Places nearbySearch, import to prospects (deduped by `googlePlaceId`)
3. **Prospects** (admin, sales) — Pipeline tabs, search, hot-lead toggle, score breakdown, contact log, follow-up dates
4. **Sites** (admin, developer) — Prompt generator, auto-probe for `../Client-Sites/{clientSlug}/index.html` (with legacy `{prospectId}` fallback), QA review workflow
5. **Sales** (admin, sales) — Pitch queue (site-ready), follow-up queue (pitched), cheat sheets, visit logger
6. **Projects** (admin, developer) — Post-sale mgmt, revisions, maintenance tier, comms log, renewal dates
7. **Billing** (admin) — Invoice CRUD, commission tracking, `stripeInvoiceId` stub
8. **Expenses** (admin) — Categorized expense tracking, HST auto-calc (13%), ITC flag

## User Roles
Stored on `users/{uid}`. Enforced by router + Firestore rules.
- **admin:** full access
- **sales:** own prospects + sales/visits + own commissions; no site gen or billing
- **developer:** sites + projects + QA + revisions; no billing or commissions

## Firestore Collections
Schemas live in code (`db.js`, module files). Status/type enums below are the contract — don't introduce new values without updating the pipeline.

- **users** — name, email, role, phone, territory
- **prospects** — statuses: `new` → `reviewed` → `approved` → `site-queued` → `site-ready` → `pitched` → `sold` | `archived`. `nextFollowUp` is `yyyy-mm-dd` in America/Toronto; entries with `nextFollowUp <= today` surface in the "Follow-up Due" tab.
- **sites** — qaStatus: `pending` | `approved` | `revision-needed`
- **projects** — status: `onboarding` | `active` | `maintenance` | `renewal-due` | `renewed` | `churned`
- **invoices** — type: `project` | `maintenance` | `automation` | `other`. status: `draft` | `sent` | `paid` | `overdue` | `void`
- **expenses** — category: `software` | `api` | `advertising` | `domain-hosting` | `equipment` | `contractor` | `travel` | `other`
- **activityLog** — immutable; all authenticated users can read + append, no update/delete

## Scoring Algorithm
Logic in `js/utils/scoring.js`. Score ranges: **0–20 Low, 20–50 Medium, 50–80 High, 80+ Hot** (auto-flags `hotLead`).

## Conventions
- ES6+ vanilla JS; all Firestore ops go through `db.js`; Firebase compat SDK via CDN
- CSS tokens in `main.css :root` — use the vars, don't hardcode colors. Cards 8px radius, inputs/buttons 4px. Sidebar 240px dark `#1E1E2D`. Content max-width 1200px. Hamburger under 768px.
- Every async op: `try/catch` + toast on error + spinner/skeleton while loading
- Log to `activityLog` on every major pipeline action (created, generated, status change, sale, payment)
- Money in cents; dates as Firestore Timestamps, displayed in Eastern Time

## Current Status (2026-04-24)
**Phases 1–5 COMPLETE.** Foundation, prospecting, site generation + QA, sales/projects/billing, expenses, **plus phase 5: cloud sync + online deploy** — auto-upload Stop hook, Firebase Storage as the shared file system, Netlify Functions for Google API proxying + auth-gated previews, server-side session cookies. Multi-PC operator workflow ready.

## Roadmap
_Auto-maintained by the dashboard refresh (daily noon + Claude Code session-end hook). Top 3 open items surface as to-dos in the AI_Projects dashboard. `[ ]` = open, `[x]` = done. Prefer engaging/build-style items over pure cleanup. Keep item text stable so check-off state persists in the dashboard. The loop may mark items done based on recent commits, add inferred new items, and reorder — manual edits always win._

- [x] Firebase Storage — client site files uploaded by Stop hook + previewed in dashboard
- [x] site-upload --all flag + per-slug args — batch or targeted upload from CLI
- [x] Admin-only Roll back to Prospect button — sold clients can be reverted to pitched status without losing history
- [ ] "Push to Netlify" button — promote a finished site to a dedicated Netlify project so we can send the URL to a client
- [ ] Claude API integration — replace manual copy/paste site-gen with the Anthropic SDK
- [ ] Stripe integration — wire `stripeInvoiceId` to live invoice flow + webhook-driven status
- [ ] Email notifications — follow-ups, invoice sent/overdue, QA handoffs
- [ ] Facebook Graph enrichment — scoring references it, no calls wired
- [ ] "Sync All" button in Sites module — trigger site-upload --all from the dashboard with a live upload progress log
- [ ] Client preview share link — generate a time-limited public URL to hand a prospect their demo site without requiring login

## Constraints
- Production tool, not a prototype
- Every view mobile-friendly (sales reps work from tablets in the field)
- Never trust client-side auth alone — Firestore rules are the enforcement boundary
- Status transitions follow the pipeline; don't let the UI skip steps
