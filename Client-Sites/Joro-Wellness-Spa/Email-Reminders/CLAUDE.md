# Joro Email Reminders — CLAUDE.md
_Read first every session. Sub-project of Joro. Update if files, features, or decisions change._

## Location
`C:\Users\Woodl\Documents\AI_Projects\Joro\Email-Reminders\`

## Project Goal
Implementation work for the **automated re-engagement email** upsell sold to Drew alongside the website. Goal: send templated emails to past Joro guests at 30, 60, and 90 days after their last visit to drive rebookings.

This folder holds the design previews, copy, and (eventually) the wiring to whatever tool actually sends the emails (Mailchimp / Squarespace Email Campaigns / Brevo / etc. — TBD with Drew).

## File Structure
```
Email-Reminders/
├── CLAUDE.md           ← this file
└── email-previews.html ← standalone demo of the 3 emails (was originally in main site)
```

## Email Sequence
| # | Trigger | Subject | Goal |
|---|---------|---------|------|
| 1 | 30 days after last visit | "The fire's still going, {name} 🔥" | Warm re-engagement, no pressure |
| 2 | 60 days after last visit | "Make it a habit — save 15% with a package 🌊" | Convert one-timers with package offer |
| 3 | 90 days after last visit | "Summer's coming — and the sauna's getting better 🌿" | Seasonal hook + bring-a-friend ask |

Full copy + visual designs live in `email-previews.html`.

## Open Questions (need Drew input)
- What email platform is Drew already using (Mailchimp? Squarespace Email? Mailerlite?) — drives integration approach
- Where does FlyBook export guest "last visit" dates? Is there an API or just CSV?
- Does Drew want first names personalized, or generic salutation?
- Unsubscribe flow — handled by sending platform or custom?
- Are these the *only* automated emails, or is there a welcome / post-first-visit one too?

## Stack (planned)
- Email templates: HTML (single-table layout, inline styles for max client compatibility)
- Trigger source: TBD — likely needs a Zapier/Make scenario or platform-native automation reading FlyBook → email tool
- No code in this folder runs in production yet — this is design + spec only

## Rules for Claude
1. Read this file first, then state which files are affected and why
2. `email-previews.html` is the visual reference — preserve its look when building real templates
3. Real email templates must use table-based layout + inline CSS (Outlook etc. don't reliably support modern CSS)
4. Use `filesystem:edit_file` for targeted changes; `filesystem:write_file` for new files — state which
5. Update this file if scope, platform, or open questions change
