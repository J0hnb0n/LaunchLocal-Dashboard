# Jordan's Divine Dish — Website

Static site for **Jordan's Divine Dish Restaurant & Catering**, Norwich, ON.
Built by LaunchLocal. Plain HTML/CSS/vanilla JS — no build tools, no frameworks.

## Preview locally

From the project root:

```bash
cd "C:\Users\Woodl\Documents\AI_Projects\Launch Local"
python -m http.server 8000
# open: http://localhost:8000/Client-Sites/Jordans-Divine-Dish-Restaurant-Catering/
```

Or just double-click `index.html`.

## File structure

```
index.html       Single-page site (Home, About, Menu, Catering, Gallery, Reviews, Contact)
style.css        Full design system, light + dark mode
script.js        Theme toggle, mobile nav, smooth scroll, form validation
assets/
  chicken.mp4    Client-supplied waving-chicken mascot (used in header + footer brand mark)
  favicon.svg    Generated placeholder — client may replace with real logo
```

## Design notes

- **Brand voice:** Bold, Traditional, Warm.
- **Palette:** heritage red `#8C2B1F`, warm gold `#C9932B`, cream background — derived from the client's voice + small-town Ontario comfort-food positioning.
- **Typography:** Playfair Display (headings) + Inter (body). Serif for the "home cooking" feel, sans for readability.
- **Light & dark mode:** toggle in the header. Preference is stored in `localStorage` under `jdd-theme`, with a default that follows the OS setting.
- **Brand mark:** the waving-chicken video loops in a circular framed mark (header + footer).

## Placeholders — client to confirm/supply

Search the HTML for `PLACEHOLDER` to find every one. In summary:

- **Menu items & prices** — sample menu built from reasonable inference (home-style / comfort food). Needs to be replaced with the real menu.
- **Sourcing claims** — "Oxford County produce, Ontario meats" and "in-house baking" need confirmation.
- **Reviews** — three sample testimonials are written in the voice of the real Google reviews. Replace with actual quoted/attributed reviews (or keep as-is if they're accurate paraphrases).
- **Email destination** — contact form uses `mailto:hello@jordansrestaurantandcatering.com`. Confirm the correct inbox, then upgrade to Formspree / Netlify Forms before going live.
- **Social links** — commented-out block in the footer.
- **Catering radius & pricing** — copy hints at full-service catering; specifics need confirmation.
- **Real photography** — every image is a placeholder from Unsplash. Replace with photos of the actual dining room, staff, and dishes for maximum impact.

## Upsell opportunities flagged for this client

- **SEO package** — Google Business optimization, local schema enrichment.
- **Social media content setup** — template grid for Instagram / Facebook content calendar.
- **Email newsletter setup** — capture form + seasonal catering campaigns.

## Tech checklist

- [x] Semantic HTML5
- [x] CSS custom properties, light + dark theme
- [x] Mobile-first responsive (breakpoints at 400 / 768 / 1024)
- [x] WCAG AA focus states, skip-to-content, alt text, form labels
- [x] `LocalBusiness` / `Restaurant` JSON-LD with hours, rating, address
- [x] Open Graph + Twitter Card meta
- [x] Lazy-loaded images below the fold
- [x] Deferred JS
- [x] `prefers-reduced-motion` respect
