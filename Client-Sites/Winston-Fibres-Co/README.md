# Winston Fibres Co. — Site

Multi-page static site for **Winston Fibres Co.**, a hand-dyed yarn studio (est. 2023). Built with plain HTML, CSS, and vanilla JavaScript — no build tools, no frameworks. Firebase Hosting compatible.

## Local preview

```bash
cd "C:\Users\Woodl\Documents\AI_Projects\Launch Local\Client-Sites\Winston-Fibres-Co"
python -m http.server 5500
# open http://localhost:5500
```

Or just double-click `index.html` to view in a browser.

## Page map

| Page | File | Notes |
|------|------|-------|
| Home | `index.html` | Hero, featured yarns, story snippet, CTA |
| About | `about.html` | Studio story + values + stat strip |
| Shop | `shop.html` | Sock kits, single skeins, **yarn weight / density guide table** |
| Sale | `sale.html` | Sale items + **owner inline-edit toggle** (see below) |
| Gallery | `gallery.html` | Yarn + project photo grid |
| Reviews | `reviews.html` | Testimonial cards (currently placeholder reviews) |
| FAQ | `faq.html` | Shipping, dye lots, custom orders, care; includes JSON-LD `FAQPage` |
| Contact | `contact.html` | Contact form (mailto), info card, map placeholder |

Shared `style.css` and `script.js` are loaded on every page.

## Design features

- **Typography** — Lora (serif headings) + Inter (body), both via Google Fonts. Lora has a conventional ampersand, though all user-visible `&` symbols have been rewritten as "and" per client preference.
- **Dark mode** — a sun/moon toggle in the header flips the whole site between a warm-cream light theme and a deep-brown/forest dark theme. The choice persists to localStorage and respects `prefers-color-scheme` on first visit. A small inline script in each `<head>` applies the stored theme *before paint* to prevent a flash.
- **Hero (home)** — a full-viewport image with a slow ken-burns zoom, parallax-style overlay, and IntersectionObserver-driven fade-up reveals for the headline, lede, and CTAs. Respects `prefers-reduced-motion`.
- **Side-scrolling featured gallery (home)** — a horizontally-scrolling, scroll-snap row with arrow controls that disable at the start/end. No prices on the home page; all pricing lives on `shop.html`.
- **Home layout polish** — constrained story-image column, compact final CTA, and subtle scroll-in reveals on each section.
- **Scroll reveals** — any element with class `.reveal` (optionally `.delay-1/2/3`) fades up when it enters the viewport.

## Instagram and socials

- Instagram handle confirmed: **@winstonfibresco** — linked in the footer of every page and in the `sameAs` JSON-LD on the home page.
- **Instagram post photos could not be scraped automatically.** Instagram requires authentication/JavaScript to render feed content, which WebFetch can't do. If the client wants her IG photos featured on the gallery or home page, three options:
  1. She sends a handful of favourites and we drop them into `assets/instagram/`.
  2. We embed her live feed via a free Shopify-style widget like **LightWidget** or **SnapWidget** (adds one `<iframe>`, no backend).
  3. Each post has a public embed URL (`https://www.instagram.com/p/XXX/embed`) we can iframe individually if she picks 3–6 favourites.
- Facebook, Etsy, TikTok, etc. — not confirmed. Placeholder comment in the footer next to the Instagram icon ready for additional handles.

## Owner edit toggle (sale page)

The brief asked for the ability for the owner to edit the sale page herself. The **`sale.html`** page has an "Edit sale items" toggle in a control bar at the top. Flipping it on:

- Makes prices, names, descriptions, and tags **inline-editable** (`contenteditable`)
- Saves changes to the browser's **localStorage** automatically as she types (with a "Saved locally ✓" confirmation)
- A **Reset to defaults** button wipes her edits and restores the original copy

### Important caveat

This is a **demo / preview editor only**. Edits are stored in *her own browser* — they do not appear for other visitors and they don't get pushed to the live site. This was the most we could build without adding a backend.

To make her edits actually publish to the live site, the recommended upgrade is one of:

1. **Firebase Firestore + a small "publish" button** — when she's happy, click publish, write changes to Firestore, and have the page fetch from Firestore on load. (~1–2 hours of work).
2. **A proper headless CMS** — point her edits at Sanity, Contentful, or DecapCMS and treat the site as the rendered view.
3. **Manual workflow** — she emails the LaunchLocal team her sale list each week and we update the HTML.

Pitch which one fits her budget / appetite during the demo conversation. Option 3 is what's wired today.

## Placeholders the client must confirm

Search the codebase for `<!-- PLACEHOLDER:` to find them all. Summary:

- **Address / city** — never confirmed during scouting; currently shown as "Ontario, Canada"
- **Phone number** — currently shows "By appointment — please email first"
- **Contact email** — currently `hello@winstonfibresco.com` (best guess from domain)
- **Social links** — Instagram and Facebook URLs needed
- **Founder/owner story** — currently AI-written based on shop name + 2023 founding date
- **Yarn product imagery** — pulled directly from the client's live `winstonfibresco.com` Shopify CDN and stored locally in `assets/products/`. Replace if she has higher-resolution originals or seasonal updates.
- **Customer reviews** — currently placeholder testimonials; collect real ones before launch
- **Local pickup, classes/workshops** — yes/no answers needed for FAQ

## Inferred information (verify before pitching)

The brief said "the owner has a variety of yarns, and some yarns are a certain density" — so we built a **full yarn weight reference table** (Lace through Jumbo) on `shop.html`. Confirm with the client:

- Which weights does she actually carry today? (We listed Fingering/Sock and Bulky from her live site; DK/Worsted are listed as "rotating" in the FAQ.)
- The product list on `shop.html` is built from her live `winstonfibresco.com` collection (Birch Bark, Broody Hen, Forest Floor, Potpourri, Rainbow Dash, Robin's Egg, Spring Peony, The Little Mermaid, Bulky Wool/Mohair) plus the four Sock Project kits ($44 / $82 / $120 / $156). Confirm she still carries all of these.
- Custom dye request workflow (FAQ assumes it exists).

## SEO

- Per-page `<title>`, meta description, canonical URL, OG + Twitter Card tags
- JSON-LD `Store` schema on home with full opening hours and `foundingDate: 2023`
- JSON-LD `FAQPage` schema on the FAQ page
- Recommend: add Google Business Profile (part of the SEO upsell)

## Deployment

Standard LaunchLocal Firebase deploy pipeline — see master `CLAUDE.md`. Suggested project ID: `winston-fibres-co`.

## Estimated Lighthouse

Mobile Performance ~94–98 · Accessibility ~95+ · SEO 100 · Best Practices 100. Product imagery is hosted alongside the site (`assets/products/`) — running it through an image optimizer (Squoosh, ImageOptim, or Firebase resize) before launch will push Performance higher and reduce the ~17 MB total payload.
