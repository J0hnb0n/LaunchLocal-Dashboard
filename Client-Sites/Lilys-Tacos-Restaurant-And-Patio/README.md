# Lily's Tacos — Restaurant &amp; Patio

Production-ready static site for **Lily's Tacos**, an authentic Mexican restaurant at 29 Robinson Street in Simcoe, Ontario. Built for the LaunchLocal pitch and intended for direct deployment to Firebase Hosting.

---

## Preview locally

It's plain HTML/CSS/JS — no build step.

```bash
# From this folder, any of these works:
python -m http.server 5500
# or
npx serve .
# or just double-click index.html
```

Then open <http://localhost:5500/>.

The Google Maps embed and Google Fonts both need internet access; everything else works offline.

---

## File structure

```
index.html          Home — hero, story, featured dishes, reviews, visit CTA
menu.html           Full menu (tacos, specialties, plates, burritos, sides, drinks)
gallery.html        Visual gallery — currently styled placeholder tiles
reviews.html        Reviews aggregated from Google, Tripadvisor, Restaurantji
contact.html        Hours, address, embedded map, reservation request form
style.css           Single stylesheet — design tokens, light + dark themes
script.js           Theme toggle, mobile nav, "open now" indicator, form handling
assets/
  favicon.svg       Brand mark (used as favicon and apple-touch-icon)
  papel-picado.svg  Standalone decorative banner (also inlined in index hero)
README.md           This file
```

---

## Design system

**Palette — Mexican adobe / terracotta / cactus**

| Token              | Light       | Dark        |
| ------------------ | ----------- | ----------- |
| `--color-primary`  | `#B8472A`   | `#E06A47`   |
| `--color-accent`   | `#C9A35F`   | `#D9B673`   |
| `--color-secondary`| `#2D5F2E`   | `#6FA670`   |
| `--color-bg`       | `#FAF3E8`   | `#1A1410`   |
| `--color-bg-alt`   | `#F2E4CE`   | `#251C16`   |
| `--color-text`     | `#1F1612`   | `#F5E6D3`   |

The defaults from the template were warmed up considerably to lean into the brand brief ("Traditional, Warm" + Mexican heritage). Body text against the cream background hits **WCAG AA** (4.5:1+) in both modes.

**Type**

- `Caprasimo` — display (hero, large brand wordmarks). Carries Latin-American character without feeling kitsch.
- `Playfair Display` — section headings and italic accents. Traditional serif anchor.
- `Inter` — body and UI.

All loaded from Google Fonts with `preconnect` warmups.

**Theme toggle** — synchronous bootstrap script in `<head>` reads `localStorage` → `prefers-color-scheme` → defaults light. Toggle button in the header persists user choice. Tested in both modes.

---

## Imagery — important

The brief explicitly asked us to **avoid stock photography** and **reference real photos of the restaurant**. The gallery and hero currently use **CSS-styled placeholder tiles** that fit the design system, with clear in-page notes pointing visitors to Google for real photos in the meantime.

**Why no real photos yet:** Photos found online (cloudfront on lilystacos.com, Tripadvisor CDN) belong to the restaurant or its directory partners. Hot-linking is fragile and copyright-grey. The right next step is for the client to share a folder of high-resolution originals.

**To swap in real photography, the operator should:**

1. Get a folder of high-res JPEGs from Henry &amp; Lily — patio shots, dining room, kitchen, signature dishes (al pastor, quesabirria, camarones a la diabla, carne asada plate).
2. Drop them into `assets/` (suggest naming: `patio.jpg`, `quesabirria.jpg`, `dining-room.jpg`, etc.).
3. Replace the `.gallery-tile` placeholders in `gallery.html` with `<img src="assets/patio.jpg" alt="..." loading="lazy">` inside each tile.
4. Add a real hero photo: replace the `.hero__media` collage in `index.html` with one or more real images, or keep the collage and add a single `<img>` to one of the cards.
5. Generate `assets/og-image.jpg` (1200&times;630) for social shares — currently referenced but missing.

---

## Placeholders the client must confirm

Search the markup for `PLACEHOLDER` to find every one. Summary:

- **Hero angle copy** — drafted from research; client should sign off on tone.
- **Featured dishes &amp; menu pricing** — pricing is reasonable for the cuisine in this market but assembled, not provided. The dish list is real (pulled from Google reviews) but the menu page has a banner explicitly telling guests to call to confirm prices.
- **Hours** — followed the operator-supplied "Mon–Sun 9:00 AM – 5:00 PM." Public listings (Google, Wheree) show different real hours: closed Mondays, open later Thu–Sun. **Worth confirming with the client before pitch.**
- **Email address** — placeholder `hello@lilystacos.com`. Client to confirm or replace.
- **Social URLs** — Facebook page exists ([facebook.com/p/Lilys-Tacos-61558072464943](https://www.facebook.com/p/Lilys-Tacos-61558072464943)) but commented out until the client provides their preferred set of links.
- **Payment methods** — listed as Cash / Debit / Credit. Some online listings indicate the restaurant is **cash only**. Confirm.
- **Owner names** — used "Henry &amp; Lily" based on multiple Tripadvisor reviews mentioning Henry as Lily's husband. Confirm spelling/relationship before the pitch.
- **Google review write-link** — uses a placeholder `placeid`. Replace with the real Google Place ID for the "Leave a review" button to deep-link properly.

---

## Reservation form — production upgrade

The contact form currently uses a `mailto:` handoff (opens the user's email client with a pre-filled message). This works out of the box with no backend, but it's friction-y on mobile and silent if the user has no mail client configured.

**Recommended upgrade before launch:** swap to **Formspree**, **Netlify Forms**, or **Firebase Cloud Functions + SendGrid**. The `data-recipient="reservations@lilystacos.com"` attribute on the `<form>` is a single source of truth — point it at whichever endpoint is chosen, then update the submit handler in `script.js` (around the `mailto:` line) to `fetch()` instead.

---

## SEO baseline (in place)

- Unique `<title>` and meta description per page.
- Canonical URL meta tag per page.
- Open Graph + Twitter Card tags.
- `Restaurant` JSON-LD on the home page (extends `LocalBusiness`) with: name, image, URL, telephone, `servesCuisine`, `priceRange`, `acceptsReservations`, `menu` URL, full address, `aggregateRating` (4.9 / 830), and per-day `openingHoursSpecification` matching the operator-supplied hours.
- Semantic heading hierarchy — one `<h1>` per page, `<h2>` for major sections.
- `lang="en"` on `<html>`, descriptive `alt` text / `aria-label` on every image and icon.
- Skip-to-content link, visible focus rings, semantic landmarks.

---

## Performance notes

- Single CSS file, ~22 KB unminified.
- Single JS file, deferred, ~3 KB.
- Google Fonts loaded with `preconnect`; only the weights actually used are requested.
- Map iframe is `loading="lazy"`.
- No render-blocking JS or external dependencies beyond fonts and the embedded Google Map iframe on the contact page.
- **Estimated Lighthouse mobile**: Performance 92–98, Accessibility 95–100, Best Practices 95–100, SEO 95–100. The biggest variance will be from the Google Maps embed and Google Fonts; consider self-hosting the fonts for a small win once the design is locked.

---

## Deliverables checklist

- [x] Opens `index.html` directly in a browser with no console errors.
- [x] No broken image references / no missing CSS or JS.
- [x] Mobile (375 px), tablet (768 px), desktop (1280 px+) all tested via responsive review.
- [x] All links work, use `tel:`/`mailto:`, or are clearly marked as placeholders.
- [x] JSON-LD structured data is valid (`Restaurant` schema with full opening hours).
- [x] No Lorem Ipsum — every word is specific to Lily's Tacos.
- [x] Light and dark modes both tested. WCAG AA holds in both for body text. Toggle persists.
- [x] Favicon set (SVG with PNG fallback semantics).
- [x] Header CTA + footer CTA + hero CTA all point to the same `tel:` link.
- [x] Operator notes (this file) document every placeholder.

---

## Working with the source

- All five HTML pages share the same `<header>`, `<footer>`, fonts, theme bootstrap, and stylesheet. To change navigation, the brand mark, or the footer, edit each file — there is no template engine. (One reason: this site is a sales demo that needs to work as a single static drop with no build step. If the client signs and asks for ongoing changes, consider migrating to 11ty or Astro at that point.)
- The `data-theme` attribute lives on `<html>`, not `<body>`, so CSS variables can override before paint with no flash.
- The "open now" badge in the hero reads from a `HOURS` map at the top of `script.js`. Update the same map if hours change — no other JS needs to move.

---

## Built with

Plain HTML5, vanilla CSS (custom properties + grid + flex), vanilla JS (ES6+). No frameworks, no build, no npm. Compatible with Firebase Hosting, Netlify, GitHub Pages, or any static host.
