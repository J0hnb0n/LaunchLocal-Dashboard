# The Copper Mug — LaunchLocal Demo Site

Static, single-page site for **The Copper Mug**, a traditional pub at 79 Broadway Street, Tillsonburg, ON. Built as a LaunchLocal demo/pitch deliverable — vanilla HTML/CSS/JS, Firebase-hosting-ready.

## Preview locally

From the `Launch Local/` project root (so the dashboard's site-probe can reach this folder):

```bash
cd "C:\Users\Woodl\Documents\AI_Projects\Launch Local"
python -m http.server 8000
# then open http://localhost:8000/Client-Sites/The-Copper-Mug/
```

Or, for a standalone preview, double-click `index.html` in the folder — most of the site works from the filesystem, though the embedded Google Map and Unsplash imagery require an active internet connection.

## File layout

```
index.html     Single-page site (Home / About / Menu / Visit / Reviews / Contact)
style.css      All styling — copper + espresso + cream palette, mobile-first
script.js      Mobile nav, open/closed indicator, footer year, form validation
assets/
  favicon.svg  Copper-on-espresso mug mark
```

## Design decisions

- **Palette override.** The LaunchLocal default tokens (`#c96442` / `#6b7f5e`) were replaced with a pub-specific copper + espresso + cream system to match the brand voice (traditional, warm) and the business name. Deviation documented here.
- **Typography.** Playfair Display for headings (serif, traditional character), Source Sans 3 for body (warm, modern sans). Two fonts only.
- **Hero.** Full-bleed pub interior photograph with dark overlay, headline + italic accent, CTA pair (View Menu / Call to Reserve), and trust signals (Google rating, open-now status, 7-days-a-week line).
- **Menu.** Six grouped cards (Starters, Pub Classics, Grill, Salads & Wraps, Sunday Roast featured, Kids) with dotted price leaders styled like a real pub menu.
- **Visit.** Address, phone, and full hours table paired with an embedded Google Map of 79 Broadway Street.
- **Reviews.** Dark espresso section with three pulled review cards to give the 4.1/543 figure some texture.
- **Contact.** Phone-first CTA + enquiry form (mailto action as a static fallback — upgrade path below).

## What's a PLACEHOLDER (client to confirm/replace)

Grep the source for `PLACEHOLDER` — every inferred item is flagged:

- **Hero photo, about photo** — currently Unsplash stock. Replace with real photography of the pub interior, exterior, and signature dishes. Swap the `src` on the `<img>` tags in `index.html` and update `og:image` / `twitter:image` meta tags.
- **Founding year** — referenced in the hero eyebrow and footer. Set the year once confirmed.
- **Menu items & pricing** — the full menu is an inferred pub-food selection (Fish & Chips, Shepherd's Pie, Sunday Roast, etc.) with representative prices. Confirm every line with the client before pitching; remove the "confirm before launch" note under the menu header once confirmed.
- **Story copy** — two About paragraphs are written in a warm, generic pub voice. Tailor with the owner's real story and philosophy.
- **Review quotes** — three review cards use realistic but generic excerpts. Pull real quotes from Google reviews for the final site.
- **Contact email** — `info@thecoppermugpub.ca` is assumed. Confirm and update the `mailto:` link + footer.
- **Social links** — commented placeholders in the footer. Fill in Facebook / Instagram URLs when provided.

## Upgrade path (post-sale)

1. **Contact form** — swap the `mailto:` action for a Formspree endpoint or, if deployed on Netlify, add `data-netlify="true"` + hidden `form-name` and the form starts flowing to the Forms dashboard.
2. **Real photos** — replace Unsplash URLs in the hero, about, and (optional future) gallery section with client-supplied imagery. Serve via Firebase Storage with responsive `srcset` once we have higher-res assets.
3. **Menu PDF** — if the client wants a dated/printable menu, we can link a PDF alongside the on-page version.
4. **Reservations** — if the client uses OpenTable/Resy, embed the widget on the Contact section and downgrade the enquiry form to an "other enquiries" form.
5. **Google Business & social** — upsells in the pipeline (SEO package, social content setup, email newsletter) plug in naturally once the site is live.

## Accessibility & SEO

- Semantic HTML5, one `<h1>`, logical heading hierarchy
- Skip-to-content link, visible focus rings, keyboard-navigable mobile nav
- `alt` text on imagery, `aria-label` on decorative elements
- JSON-LD `Restaurant` structured data with address, phone, rating, reviews, and full weekly opening hours
- Open Graph + Twitter Card meta
- All images below the fold use `loading="lazy"`; fonts preconnect; JS is `defer`red
- Estimated Lighthouse mobile score: **90–97** Performance / **100** Accessibility / **100** Best Practices / **100** SEO (pending real photography swap-in)

## Info gaps for the sales rep to confirm with the client

1. Actual founding year
2. Full menu & prices (we guessed an honest pub lineup — confirm everything)
3. Exact Sunday Roast timing ("from 12 noon until we run out" is an inference)
4. Real contact email address
5. Social media URLs (Facebook / Instagram)
6. Permission to pull live Google review quotes verbatim
7. Whether they want an online reservation widget (OpenTable/Resy) or phone-only
