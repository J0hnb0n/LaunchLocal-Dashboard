# LaunchLocal — Site Generation Prompt

You are building a **production-ready website** for a real local business as part of the LaunchLocal pipeline. This site will be pitched to the business owner as a sales demo and may be deployed as their live site. Treat this as a client deliverable, not a prototype.

---

## Client Brief

- **Business:** {{businessName}}
- **Industry:** {{industry}}
- **Established:** {{foundedYear}}
- **Address:** {{address}}
- **Phone:** {{phone}}
- **Email:** {{email}}
- **Existing website:** {{website}}
- **Google reputation:** {{googleRating}} stars ({{reviewCount}} reviews)

### Services / offerings
{{services}}

### Hours
{{hours}}

### Hero angle (lead story)
{{heroAngle}}

### Brand voice
{{brandVoice}}

### Pages required
{{pagesNeeded}}

### Upsells / automation flags to surface
{{upsells}}

### Additional notes
{{notes}}

---

## Output Location

**First step — set your working directory** to the slug folder. The auto-upload Stop hook detects work by scanning recently-modified `Client-Sites/<slug>/` folders, so the build must land there.

```bash
mkdir -p Client-Sites/{{clientSlug}}
cd Client-Sites/{{clientSlug}}
```

(Run Claude Code from the `Launch Local` repo root for that relative path to resolve. If you started from elsewhere, use the absolute path instead.)

All file paths below are relative to the slug folder.

---

## Tech Stack — Strict

- **Plain HTML / CSS / Vanilla JavaScript only.** No build tools, no npm, no frameworks (no React, Vue, Tailwind, Bootstrap, jQuery).
- Firebase Hosting compatible — static files only.
- Use semantic HTML5 (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`).
- Use CSS custom properties (variables) in `:root` for the design system.
- Use ES6+ for any JS (const/let, arrow functions, template literals, `addEventListener` — no inline `onclick`).
- No external CSS frameworks. You may use Google Fonts via `<link>` and one icon font/SVG set if it serves the design.

## Required File Structure

```
index.html
style.css
script.js              (only if the site needs JS interactivity)
assets/
  favicon.ico          (simple SVG or PNG — generate one from the business initial)
  hero.jpg             (or use a free Unsplash URL for hero imagery — document in a comment)
  [other images/icons as needed]
README.md              (brief notes: how to preview, what's a placeholder, what client needs to provide)
```

---

## Design System (defaults — override only if brand calls for it)

```css
:root {
  --color-primary: {{primaryColor}};
  --color-accent: {{accentColor}};
  --color-text: #1A1A1A;
  --color-text-muted: #5F6368;
  --color-bg: #FFFFFF;
  --color-bg-alt: #F8F9FA;
  --color-border: #E5E7EB;

  --font-heading: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;

  --space-xs: 8px;
  --space-sm: 16px;
  --space-md: 24px;
  --space-lg: 48px;
  --space-xl: 96px;

  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
  --shadow-lg: 0 16px 40px rgba(0,0,0,0.12);
}
```

If you deviate, document why in the `README.md`.

## Theme Mode

{{themeModeGuidance}}

## Design Principles

1. **Above the fold:** business name/logo, hero imagery, headline (the hero angle), clear primary CTA. Visitor should know what this business does and how to take the next step within 3 seconds.
2. **Clear primary CTA** — usually "Call Now" (tel: link), "Book Online" (or a visible booking anchor), or "Get a Quote" (form or email link). One CTA per section, repeated in the header and footer.
3. **Trust signals near the top** — Google rating, review count, years in business, certifications, or a photo of the owner/team. Do not invent credentials. If in doubt, leave a clear `<!-- PLACEHOLDER: client to provide -->` comment.
4. **Mobile-first responsive.** Design for 375px width first. Use `@media (min-width: ...)` breakpoints to layer in larger screens. Touch targets ≥44px. Never require horizontal scroll.
5. **Real photography** — use relevant Unsplash URLs (e.g., `https://images.unsplash.com/photo-...?w=1600&q=80`) or leave a comment that the client should supply real photos. Never use stock "business meeting" clichés if the industry has better options.
6. **Whitespace and typography carry the design** — don't over-decorate. A restrained, confident layout looks more professional than gradients and animations.
7. **Accessibility baseline:** semantic HTML, alt text on every image, sufficient color contrast (WCAG AA, 4.5:1 for body text), focus styles visible, skip-to-content link, form labels associated with inputs, keyboard-navigable.

## SEO Baseline (non-negotiable)

- `<title>` with business name + primary service + city
- `<meta name="description">` — 150-160 chars, compelling, includes primary service
- Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type=website`)
- Twitter Card tags
- `<meta name="viewport" content="width=device-width, initial-scale=1">`
- Structured data JSON-LD for `LocalBusiness` (or a more specific subtype such as `Restaurant` when appropriate) with name, address, phone, geo (if available), rating, review count, sameAs (Google, Facebook if known)
- Include `openingHoursSpecification` as an array of structured entries using the operator-provided hours (see below).
- If a founded year is provided, include `"foundingDate": "{{foundedYear}}"` in the JSON-LD.
- Semantic heading hierarchy (one `<h1>`, then `<h2>` for major sections)
- Descriptive alt text on images
- Canonical URL meta tag

Use these operating hours in the structured data (drop them into `openingHoursSpecification`):

```json
{{hoursJsonLd}}
```

## Performance Baseline

- Single CSS file, minified-friendly (no unused rules)
- Lazy-load images below the fold (`loading="lazy"`)
- Serve images at appropriate sizes — use Unsplash's `w=` query param to right-size
- Preconnect to Google Fonts if used
- No render-blocking JS (use `defer` or put `<script>` at end of body)
- Target Lighthouse Performance ≥90 on mobile

---

## Industry-Specific Guidance

{{industryGuidance}}

---

## Contact / Lead Capture

Every site needs a way to convert a visitor. Implement at least two of:

- **Phone CTA** — `<a href="tel:{{phone}}">` button in header + footer + hero
- **Email CTA** — `<a href="mailto:{{email}}">` link
- **Contact form** — HTML form that submits to a `mailto:` action (document upgrade path to Formspree/Netlify Forms in README)
- **Embedded Google Map** of the business address (`<iframe>` from Google Maps share → embed)

Forms must have proper labels, required-field indicators, client-side validation, and visible success/error states.

## Footer (required)

- Business name, address, phone, email (click-to-call and click-to-email)
- Hours of operation
- Social links if known (leave commented placeholders otherwise)
- Copyright current year
- "Website by LaunchLocal" in small text at the bottom

---

## Deliverable Checklist — Verify Before Finishing

- [ ] Opens `index.html` directly in a browser with no errors in the console
- [ ] No broken image references, no missing CSS/JS files, no 404s in the network tab
- [ ] Mobile layout works at 375px (no horizontal scroll, readable type, tappable CTAs)
- [ ] Tablet layout works at 768px
- [ ] Desktop layout works at 1280px+
- [ ] All links either work, use `tel:`/`mailto:`, or are clearly marked as placeholders in HTML comments
- [ ] JSON-LD structured data validates (mentally check it compiles)
- [ ] No Lorem Ipsum. Every word of copy is specific to this business.
- [ ] Run through the design principles list above and confirm each one
- [ ] `README.md` documents: how to preview, what's a placeholder, what the client needs to supply (real photos, social URLs, actual menu/pricing, etc.)
- [ ] Favicon is set
- [ ] Color contrast passes WCAG AA — check body text against background

## After Building

1. Print a short summary: what you built, key design decisions, any placeholders the client needs to fill in, and an estimated Lighthouse score range.
2. Flag any information gaps where you made reasonable assumptions — list them so the sales rep can confirm with the client before pitching.
