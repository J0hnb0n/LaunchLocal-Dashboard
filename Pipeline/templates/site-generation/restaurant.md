### Restaurant-Specific Requirements

**Hero section:**
- Lead with photography of signature dishes or the dining space — not a stock "chef in kitchen" photo.
- Headline should evoke the cuisine or atmosphere, not describe it ("Wood-fired Neapolitan pies, twelve tables, open 5pm" beats "Authentic Italian Dining").
- Primary CTA: **View Menu** (anchor link to menu section) + secondary **Reserve a Table** or **Order Online**.

**Required sections:**
1. **Menu** — Either a full menu on-page (preferred) or linked PDF. Group by course/category with prices. If the client hasn't provided a menu, build a sample based on the cuisine type and clearly mark it `<!-- PLACEHOLDER MENU: client to confirm dishes and pricing -->`.
2. **Hours** — Display prominently. Separate lunch/dinner/weekend hours if applicable. Include a "currently open/closed" indicator if you implement JS.
3. **Location** — Embedded Google Map, full address, parking notes if relevant, transit accessibility.
4. **Reservations** — If they use OpenTable/Resy/Tock, link out with their widget. Otherwise a simple reservation request form (name, party size, date, time, phone, email, notes) + click-to-call as the primary path.
5. **About / Story** — Origin of the restaurant, chef or owner background, philosophy on ingredients/sourcing. 1-3 short paragraphs, not a wall of text.
6. **Gallery** — 6-12 high-quality food/interior photos in a responsive grid. Lazy-load everything below the fold.

**Optional but high-value:**
- **Private events / catering** page or section if they offer it
- **Gift cards** CTA
- **Press / reviews** snippets (only if real — never fabricate)

**Industry-specific SEO:**
- Structured data type: `Restaurant` (extends `LocalBusiness`) — include `servesCuisine`, `acceptsReservations`, `menu` URL, `priceRange` ($, $$, $$$).
- Title format: `{Business Name} — {Cuisine Type} in {City}`

**Design cues:**
- Photography is the hero. Use large, well-composed food/space images.
- Typography: consider a serif or stylized display font for headings to evoke craft, with a clean sans-serif body.
- Warm, appetite-adjacent colors unless the brand is deliberately minimal/modern.
- Avoid generic "restaurant template" vibes (scrolling marquee of dishes, parallax hero on every section).
