# Joro Dashboard — CLAUDE.md
_Read first every session. Sub-project of Joro. Update if files, features, or decisions change._

## Location
`C:\Users\Woodl\Documents\AI_Projects\Joro\Dashboard\`

## Project Goal
Standalone KPI dashboard for Jörð Outdoor Spa — visualizes the 2025 measurables tracked in `KPIs - Dashboard - 2025.xlsx`. Built fresh from scratch (old attempts had broken charts — the `archive/` folder keeps the prior file for reference only, NOT to copy from).

## File Structure
```
Dashboard/
├── CLAUDE.md                       ← this file
├── dashboard.html                  ← complete dashboard (all inline)
├── KPIs - Dashboard - 2025.xlsx    ← source data (Annual Dashboard sheet is primary)
└── archive/
    └── old-index.html              ← previous broken version, do NOT reference
```

## Data Source
- Workbook: `KPIs - Dashboard - 2025.xlsx`
- Primary sheet: **Annual Dashboard** — months Jun–Dec 2025 across five categories: Marketing & Awareness, Sales & Sessions, Customer Experience, Campaigns, Community & Brand.
- Data is hardcoded into `index.html` as JS arrays — no runtime xlsx parsing.

## Stack
- Single HTML file, vanilla CSS/JS, no build step
- Chart.js via CDN for all visualizations
- Google Fonts: Cormorant Garamond (display) + Outfit (UI) — matches parent Joro site

## Design — matches parent Joro site
- `--dark: #0e1510` · `--dark2: #182018` · `--green: #2d4a2d` · `--green-lt: #3d6b3d`
- `--ember (gold): #c8813a` · `--ember-lt: #e09a52`
- `--cream: #f2ead8` · `--muted: #8a9485`
- Classy, sleek, professional. No emojis. No AI-looking clichés.

## Rules for Claude
1. Read this file first, then state which files are affected and why
2. Do NOT open `archive/old-index.html` when making changes — rebuild from data, not from the old code
3. Use `filesystem:edit_file` for targeted changes; `filesystem:write_file` only for full rewrites — state which
4. Apply all changes in one pass without re-reading mid-edit
5. On finish: confirm complete or provide a ready-to-paste handoff prompt
6. Update this file if files are added or decisions change
