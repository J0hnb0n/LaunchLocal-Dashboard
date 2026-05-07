# LaunchLocal Dashboard

Internal SPA — prospecting, site generation, sales, client management for local businesses.

## Rules
1. Read this file first; state affected files and why
2. Read only needed files
3. Targeted edits; full rewrites only for new files — state which
4. No build tools — CDN only (Firebase v10 compat, Leaflet 1.9.4)
5. One pass, no re-reading mid-edit
6. On finish: confirm or provide handoff prompt
7. Update this file if architecture changes

## Stack
- **Frontend:** Vanilla HTML/CSS/JS, no frameworks
- **Backend:** Firebase (Firestore, Auth, Storage) compat SDK v10 via CDN
- **Hosting:** Netlify (repo root). `Pipeline/` = publish dir. `netlify/functions/` = API + preview proxy
- **Repo:** `J0hnb0n/LaunchLocal-Dashboard`
- **Maps:** Leaflet + OSM, Nominatim geocoding
- **APIs:** Google Places v1 + PageSpeed — proxied via Netlify Functions (`/api/places`, `/api/pagespeed`). Key in `GOOGLE_API_KEY` env var, never client-side
- **Site gen:** Claude Code CLI builds at `Client-Sites/{slug}/`. All tracked in this repo — one `git pull` syncs every site. Stop hook auto-uploads to Firebase Storage at `sites/{slug}/`. Dashboard previews via `/preview/{slug}/...` (auth-gated). No independent Firebase Hosting per site
- **Auth:** Firebase ID token → `__llSession` httpOnly cookie via `/api/session`
- **Stripe:** Stubs only (`stripeInvoiceId`)
- **Root:** `C:\Users\Woodl\Documents\AI_Projects\Launch Local`
- **Client slugs:** `businessName` → Title-Case-Hyphen. Logic in `Pipeline/js/utils/slug.js`. Commit + push to distribute

## File Structure
```
Launch Local/
├── .claude/settings.json       Stop hook → tools/site-upload-hook.sh
├── netlify.toml
├── netlify/functions/
│   ├── _shared/                admin.js, auth.js
│   ├── auth-session.js         POST /api/session
│   ├── auth-clear.js           POST /api/session/clear
│   ├── places.js               POST /api/places
│   ├── pagespeed.js            GET  /api/pagespeed
│   └── preview.js              GET  /preview/{slug}/{path}
├── tools/
│   ├── sync-all.sh             git pull (all sites included)
│   ├── sync-push.sh            commit + push
│   ├── site-upload-hook.sh     Stop hook wrapper
│   └── site-upload.js          Firebase Storage uploader
├── Client-Sites/{slug}/        Tracked in repo, syncs via git
└── Pipeline/
    ├── index.html, dashboard.html
    ├── css/                    theme, motion, main, components, modules
    ├── js/
    │   ├── app.js, auth.js, db.js, router.js
    │   ├── modules/            dashboard, scouting, prospects, sites, sales, projects, billing, expenses
    │   └── utils/              api, scoring, prompt-generator, slug, sampledata
    ├── templates/site-generation/
    └── firebase/               firestore.rules, storage.rules
```

## Modules
1. **Dashboard** (all) — KPIs, funnel, activity feed
2. **Scouting** (admin, sales) — Map pin + radius, Places search, import to prospects
3. **Roadmap** (admin) — Sprint Gantt + checklist, shared via `roadmap/sprint` doc
4. **Prospects** (admin, sales) — Pipeline tabs, scoring, contact log, follow-ups
5. **Sites** (admin, dev) — Prompt gen, preview probe, QA workflow
6. **Sales** (admin, sales) — Pitch queue, follow-up queue, visit logger
7. **Projects** (admin, dev) — Post-sale mgmt, revisions, maintenance, renewals
8. **Billing** (admin) — Invoices, commissions
9. **Expenses** (admin) — Categorized, HST 13%, ITC flag

## Roles
`users/{uid}`: `admin` (full) | `sales` (own prospects/sales/commissions) | `developer` (sites/projects/QA)

## Firestore
- **prospects** — `new→reviewed→approved→site-queued→site-ready→pitched→sold|archived`. `nextFollowUp`: `yyyy-mm-dd` America/Toronto
- **sites** — qaStatus: `pending|approved|revision-needed`
- **projects** — `onboarding|active|maintenance|renewal-due|renewed|churned`
- **invoices** — type: `project|maintenance|automation|other`. status: `draft|sent|paid|overdue|void`
- **expenses** — category: `software|api|advertising|domain-hosting|equipment|contractor|travel|other`
- **activityLog** — immutable append-only
- **roadmap/sprint** — `checked` map + `days` map. Admin-only

## Scoring
`js/utils/scoring.js`: 0–20 Low, 20–50 Medium, 50–80 High, 80+ Hot (auto `hotLead`)

## Conventions
- All Firestore via `db.js`; CSS vars in `main.css :root`
- Cards 8px radius, inputs 4px. Sidebar 240px `#1E1E2D`. Content max 1200px. Hamburger <768px
- `try/catch` + toast on error + spinner while loading
- Log to `activityLog` on pipeline actions
- Money in cents; dates as Timestamps, displayed Eastern

## Constraints
- Production tool — mobile-friendly, tablet field use
- Firestore rules = enforcement boundary
- Pipeline status transitions must not skip steps
