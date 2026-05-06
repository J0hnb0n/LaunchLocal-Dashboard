# Fescue's Edge — Client Site

Prospect demo site for Fescue's Edge Golf Club (Scotland, Ontario). Built from an Anthropic design export.

## Stack
- **Static site** — no build tools
- **React 18.3 via CDN** + Babel Standalone for in-browser JSX (so the `.jsx` file is served as-is and transformed client-side)
- Fonts via Google Fonts CDN (Cormorant Garamond, Inter, JetBrains Mono)

## File Structure
```
Fescues-Edge/
├── index.html              Entry point — inline theme-init script, mounts <App /> into #root
├── styles.css              All styles (design tokens + [data-theme="dark"] overrides)
├── components/
│   └── sections.jsx        Section components + NavContext + App shell (hash-based page routing)
├── img/                    Hero/gallery photos (01–09) + logo-fescue.png
├── Design Files/           Original design export from Anthropic (source of truth)
├── Photos/                 Earlier reference photos + AI-edited variants (not used by site)
└── CLAUDE.md               This file
```

## App Architecture
SPA with hash routing. `App` in `sections.jsx` handles theme (`data-theme` + localStorage) and page state (synced to `location.hash`). Pages: `home` (Hero + StatusBar + Intro + News + Visit), `course` (Course + Scorecard), `rates` (Rates + Range), `membership`, `leagues`, `events`, `dining`. `NavContext` provides a `navigate(pageId)` function to any descendant (TopBar, Footer, Hero CTA) so anchor-style links route without a reload.

## Local Preview
Babel Standalone needs to fetch `components/sections.jsx` — that requires a real HTTP server (not `file://`). From this folder:

```bash
python -m http.server 8000
# visit http://localhost:8000
```

## Editing Notes
- Section copy, hole yardages, and rate tables all live in `components/sections.jsx`
- Colors and typography live in `styles.css` `:root` (green/brass/paper palette); dark-mode overrides are under `:root[data-theme="dark"]`
- Internal page links should go through `NavContext` (use `useNav()` inside a component; render `<a href="#page" onClick={...navigate}>`) so they route client-side instead of reloading
- Images in `img/` are referenced by `src="img/NN-name.jpg"` — keep filenames stable or update the `<Placeholder>` props
- Logo: `img/logo-fescue.png` is a raster with a cream background; light mode uses `mix-blend-mode: multiply` to blend it into the paper, dark mode uses `filter: invert()` to flip it. If you ever get a transparent version, drop the blend-mode/filter rules.

## Status
Prospect / demo only. Not yet sold. No Firebase project, no GitHub repo, no deploy pipeline set up yet — set those up via the standard Launch Local flow (see parent-of-parent CLAUDE.md) once the client signs.

## Roadmap
_Auto-maintained by the dashboard refresh (daily noon + Claude Code session-end hook). Top 3 open items surface as to-dos in the AI_Projects dashboard. `[ ]` = open, `[x]` = done. Prefer engaging/build-style items over pure cleanup. Keep item text stable so check-off state persists in the dashboard. The loop may mark items done based on recent commits, add inferred new items, and reorder — manual edits always win._

- [ ] _(This list will auto-populate on the next dashboard refresh based on recent activity in this folder. Currently a prospect — pitch and close before building further.)_
