# Couwenberg Concrete Inc — Website

Demo site built by LaunchLocal for Couwenberg Concrete Inc (2 Main St E, Norwich, ON).

## Preview locally

No build step — just open `index.html` in a browser. For a cleaner preview that avoids `file://` quirks:

```bash
# from this folder
python -m http.server 8080
# then visit http://localhost:8080
```

## Stack

Plain HTML, CSS, vanilla JavaScript. Google Fonts (Archivo + Inter). No frameworks, no npm, no build tools.

## Structure

```
index.html        Single-page site, anchor-nav sections
style.css         Design system + all component styles
script.js         Mobile nav, FAQ accordion, form validation, footer year
assets/
  favicon.svg     CC monogram, slate + amber
  favicon.ico     (optional — SVG favicon covers modern browsers)
README.md         This file
```

## Design notes

Palette is built from the trade itself — deep slate (`#1F2933`) for concrete/asphalt with a safety-amber accent (`#E87722`) pulled from worksite colours. Typography pairs Archivo (heavy, industrial) for headlines with Inter for body. Restrained layout, strong whitespace, photo-driven — no gradients or decorative animation.

## Placeholders — client must confirm before pitch

All instances are marked with `<!-- PLACEHOLDER: ... -->` in HTML. Summary:

1. **Services list** — inferred from business name + Oxford County context. Eight categories (driveways, garage/shop floors, walkways & steps, patios, footings & foundations, **agricultural concrete**, stamped/decorative, repair & resurfacing). Confirm which are actually offered.
2. **Founding year** — hero eyebrow shows `[year]` — needs real founding year.
3. **Family-operated claim** — assumed from business name. Confirm.
4. **Licensing / insurance / WSIB** — stated as "licensed and insured" and WSIB coverage. Confirm exact credentials; update FAQ if different.
5. **Email address** — used `info@couwenbergconcrete.ca` as a placeholder in footer, contact list, and mailto form action. Swap when client provides real email.
6. **Domain** — `couwenbergconcrete.ca` used in canonical + OG + JSON-LD. Update if they register something different.
7. **Office hours** — brief said Mon–Sun 9 AM–5 PM. That's unusual for a concrete contractor; confirm actual shop hours vs. when-to-call hours. JSON-LD uses the brief's stated hours verbatim.
8. **Gallery photos** — currently Unsplash placeholders tagged with local town names. Replace with the client's real project photos.
9. **About/owner story** — general "local crew" placeholder copy. Needs real background, owner name, and ideally a photo.
10. **Google review link** — "Leave a Review" button currently anchors to `#contact`. Swap to client's `g.page/r/…` URL once available.
11. **Social links** — commented-out footer column ready to go when client provides.
12. **Payment methods** — cheque / e-transfer / bank transfer assumed.

## What the sales rep / client still needs to supply

- Real project photos (ideally 6–10 for gallery, 1 hero shot)
- Confirmed services list + any specialty offerings (e.g. broom finish only vs. full decorative)
- Founding year, owner name(s), brief bio
- Email address + any social handles
- Certifications (licensed journeyman? WSIB cleared? liability policy?)
- Logo file if one exists (otherwise current CC monogram stays)

## SEO baseline — what's wired

- Unique title + meta description with primary service + city
- Canonical URL, Open Graph + Twitter Card tags
- JSON-LD `GeneralContractor` schema with address, phone, area served (Norwich, Tillsonburg, Woodstock, Ingersoll, Otterville, Oxford County), opening hours
- Semantic HTML (single H1, sectioned H2s, descriptive alt text, skip-link, labelled form fields)
- `loading="lazy"` on all below-the-fold imagery

## Form handling

Quote form currently submits via `mailto:` — fine for a fresh demo but will look clunky. **Upgrade path:** wire to Netlify Forms (add `data-netlify="true"` and deploy on Netlify) or Formspree (change `action` to a Formspree endpoint). No other code changes needed.

## Expected Lighthouse (mobile)

Rough estimate from manual review:

- Performance: **90–96** (Unsplash images are the main variable — swap for optimized local JPGs and this lands at 95+)
- Accessibility: **95–100**
- Best Practices: **95–100**
- SEO: **100**

## Browser support

Modern evergreen browsers (Chrome, Edge, Firefox, Safari). Uses `:has()`-free CSS, CSS custom properties, `aspect-ratio`, and `<details>` — all broadly supported for 2+ years.
