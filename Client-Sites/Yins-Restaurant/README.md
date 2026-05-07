# Yin's Restaurant — Website

Static, single-page website for Yin's Restaurant in Waterford, Ontario. Built with vanilla HTML / CSS / JavaScript — no build step, no dependencies. Deploys directly to Firebase Hosting (or any static host).

## Preview locally

The site is plain static files. Open `index.html` directly in a browser, or serve the folder with any local web server. Examples:

```bash
# Python 3
python -m http.server 8000

# Node (if installed)
npx serve .
```

Then visit http://localhost:8000.

## File structure

```
index.html        Single-page site with all sections (Home, About, Menu, Gallery, Reviews, Visit)
style.css         Design system + responsive layout
script.js         Mobile nav toggle, open/closed indicator, form handling, copyright year
assets/
  favicon.svg     Generated mark — red square with "Y"
README.md         This file
```

## Design notes

- **Brand voice:** Bold, Traditional, Warm — communicated through deep red (`#b32222`) primary, warm gold (`#c9a449`) accent, warm off-white (`#faf6f1`) section backgrounds, and a Cormorant Garamond serif for headings paired with Inter for body.
- **Light mode only** as briefed. No theme switcher.
- **Mobile-first:** layout designed at 375px, then enhanced at 720px (tablet) and 1024px (desktop). Hamburger nav appears below 860px.
- **Hero photography** uses Unsplash hot-linked images. Replace with real photos of the restaurant's food and dining room before launch (see "What the client needs to provide" below).

## What's a placeholder

Search the codebase for `PLACEHOLDER` comments to find every spot the client needs to confirm. Summary:

| Item | Where | Notes |
|---|---|---|
| **Menu items & pricing** | `index.html` → `<!-- PLACEHOLDER MENU -->` | Built a representative Canadian-Chinese menu (egg rolls, ginger beef, chicken balls, combos). Client must confirm dishes and current prices. |
| **Reviews** | `index.html` → `<!-- PLACEHOLDER REVIEWS -->` | Four illustrative quotes attributed to first names. Replace with verified Google reviews (with reviewer permission) before launch. |
| **Email address** | `index.html` (footer + form action) | Form currently uses `mailto:hello@yinsrestaurant.ca`. Confirm or swap actual inbox. |
| **Social URLs** | `index.html` footer | Facebook / Instagram links are commented out — add when client provides URLs. Also add to `sameAs` in the JSON-LD `Restaurant` block. |
| **Founded year** | `index.html` JSON-LD | `foundingDate` not included — add when known. |
| **Real photography** | `index.html` hero, about, gallery | All images are Unsplash placeholders. Replace with actual photos of Yin's food, dining room, and (with permission) the team. |
| **Hero angle** | `index.html` hero copy | Brief listed "[not specified]". Wrote a "Waterford classic" angle leaning on tradition + generous portions. Confirm this matches how the owner describes the place. |

## What the client needs to provide

Before pitching as a live site, collect from the client:

1. **A real menu** with current dishes and prices (PDF or list is fine — we'll typeset).
2. **5–12 high-resolution photos** — signature dishes, dining room, exterior, owner/team if comfortable.
3. **A working email inbox** for the contact form to deliver to.
4. **Social media URLs** if they have Facebook/Instagram.
5. **Founded year** for the JSON-LD structured data.
6. **Confirmation of hours** (the brief says Mon–Sun 9 AM – 5 PM — verify this is accurate; many restaurants have evening hours and this is unusual).
7. **Any active promotions** they'd like featured (e.g. lunch specials, family combos).

## Form handling — upgrade path

The contact form currently uses a `mailto:` action, which opens the visitor's email client. This is reliable but adds friction. Once the client confirms an inbox, swap to one of:

- **Formspree** (`https://formspree.io`) — change form `action` to `https://formspree.io/f/{form-id}`, remove `enctype`, add hidden `_subject` field. Free tier: 50 submissions/month.
- **Netlify Forms** — add `netlify` attribute to the `<form>` tag if hosting on Netlify. (Not applicable for Firebase Hosting.)
- **Firebase + Cloud Function** — write submissions to Firestore and send transactional email via SendGrid/Resend. Best long-term fit since the site is already on Firebase.

## SEO / structured data

`index.html` includes:

- `<title>`, meta description, canonical URL
- Open Graph + Twitter Card tags (image is the hero Unsplash photo — replace OG image when real photography is in place)
- JSON-LD `Restaurant` schema with address, phone, hours, aggregate rating (3.9 / 415), `priceRange`, `servesCuisine`, `acceptsReservations`

Validate at https://search.google.com/test/rich-results once deployed.

## Lighthouse expectations

Anticipated scores on a clean Firebase Hosting deploy:

- **Performance:** 90–98 (single small CSS file, deferred JS, lazy-loaded gallery, preconnected fonts)
- **Accessibility:** 95–100 (semantic HTML, skip link, alt text, focus styles, labelled form fields, AA contrast)
- **Best Practices:** 95–100
- **SEO:** 100

Performance may dip below 90 if Unsplash hero image is slow on first paint — replacing it with an optimized self-hosted WebP will lift the score.

## Deployment

Drop into Firebase Hosting:

```bash
firebase init hosting    # public dir = "."
firebase deploy
```

Add `firebase.json` ignoring this README and the `.git` folder if needed.
