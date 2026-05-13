# Joro Wellness Spa — CLAUDE.md
_Read first every session. Update if files, features, or decisions change._

## Location
`C:\Users\Woodl\Documents\AI_Projects\Joro\`

## Project Goal
Originally a prototype pitch site — **SOLD ✅** to Drew Ferris. Now in the post-sale implementation phase with ongoing support being offered. Full sequence is in `roadmap.html`.

The main `index.html` has been cleaned of pitch-only demo features (re-engagement email preview, AI chatbot). Sub-folders hold the upsells Drew bought separately.

## Client
| | |
|---|---|
| Business | Jörð Outdoor Spa (stylized) |
| Owner | Drew Ferris |
| Location | 1730 Front Road, Turkey Point, ON (inside Long Point Eco-Adventures) |
| Phone | (226) 567-2772 |
| Email | joro.wellspa@gmail.com |
| Booking | FlyBook (third-party embed) |
| Services | Drop-in $54.95 · 4-pack (15% off) · 8-pack (20% off) · Private from $249.95 |
| Experience | Hot sauna (70–90°C) → Cold plunge (2–4°C) → Fire circle |

## File Structure
```
Joro/
├── CLAUDE.md             ← this file
├── index.html            ← Home page (hero, experience, about, reviews, newsletter)
├── rates.html            ← Session Rates page
├── private.html          ← Private & Group Events page (with booking form)
├── journal.html          ← Wellness Journal page (articles + modal reader)
├── faq.html              ← FAQ page (accordion)
├── roadmap.html          ← implementation order of operations (visual)
├── SALES-CHEATSHEET.md   ← original pitch material (kept for reference)
├── Dashboard/            ← UPSELL: 2025 KPI dashboard (sub-project)
└── Email-Reminders/      ← UPSELL: 30/60/90-day automated re-engagement emails
```

## Stack (website)
- Vanilla HTML/CSS/JS — multi-page, inline CSS per page (each page is self-contained for Squarespace copy-paste), no build step
- Fonts: Cormorant Garamond + Outfit (Google Fonts CDN)
- Images: Joro's live Squarespace CDN URLs
- Final destination: Drew's Squarespace (port pending — see Phase 2 in roadmap.html)

## Design
- `--dark: #0e1510` · `--ember: #c8813a` · `--cream: #f2ead8`
- Classy, sleek, professional. The pitch-era "✦ New Feature" badges and ember-glow borders have been removed.

## Website Features (multi-page, May 2026)
| Page | Feature | Notes |
|------|---------|-------|
| `index.html` | Hero + experience cycle | Hot → cold → fire circle storytelling |
| `index.html` | About / Our Story | Location context, CTA |
| `index.html` | Google Reviews | Auto-scrolling carousel, 8 reviews |
| `index.html` | Newsletter signup | Email capture |
| `rates.html` | Session rates | Drop-in / 4-pack / 8-pack pricing cards |
| `private.html` | Private Booking form | Full form (name, email, phone, event type, group size, date, notes); confirmation state on submit |
| `journal.html` | Wellness Journal | 2 articles with modal reader — "Science of Contrast Therapy", "Your First Cold Plunge" |
| `faq.html` | FAQ accordion | 9 expandable Q&As |
| All pages | FlyBook booking link | Third-party booking via nav button |

## Removed from website (pitch-only)
- **AI Chatbot** — Drew passed for now. Not preserved as an upsell folder; if Drew revisits, rebuild from scratch.
- **Re-engagement Email Previews** — moved to `Email-Reminders/email-previews.html` as design reference for the upsell build.

## Upsell Sub-projects
Each has its own `CLAUDE.md`. Read it before working in that folder.
- **Dashboard/** — KPI dashboard for 2025 measurables
- **Email-Reminders/** — Automated 30/60/90-day re-engagement email sequence

## Roadmap
_Source-of-truth lives in `roadmap.html` (phased implementation with blurbs + checklists). The dashboard refresh (daily noon + Claude Code session-end hook) parses `roadmap.html` directly and surfaces the top 3 open phases as to-dos in the AI_Projects dashboard. It also auto-maintains status markers in `roadmap.html` — ticking off checklist items based on recent activity. Manual edits always win._

## Rules for Claude
1. Read this file first, then identify which files are affected and state why
2. For sub-folder work, also read that folder's `CLAUDE.md` before editing
3. `index.html` is the website source until it's ported to Squarespace — keep it Squarespace-portable (no exotic JS dependencies)
4. Use `filesystem:edit_file` for targeted changes; `filesystem:write_file` for new files or full rewrites — state which
5. Apply all changes in one pass without re-reading
6. On finish: confirm complete or provide a ready-to-paste handoff prompt
7. Update this file if files are added, features change status, or decisions are made
