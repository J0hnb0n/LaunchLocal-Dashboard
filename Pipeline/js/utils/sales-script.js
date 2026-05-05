/* ============================================
   LaunchLocal — Sales Script (Hormozi Edition)
   ============================================
   Pre-sales playbook for the Sales module's pitch workspace.

   Demo-first, time-budgeted, industry-tailored. Renders into the
   "Live Script" tab of the Pitch Brief modal in sales.js.

   Public surface:
     LaunchLocal.SalesScript.getTrack(industry)        -> track slug
     LaunchLocal.SalesScript.getTier(prospect)         -> 'premium'|'standard'|'value'
     LaunchLocal.SalesScript.getSmartPricing(prospect) -> { build, maintenance, ... }
     LaunchLocal.SalesScript.getDefaultAvgTicket(ind)  -> number
     LaunchLocal.SalesScript.render(prospect, opts)    -> HTML string

   Note: project-detail.js has its own renderSalesScript (CLOSER framework,
   post-sale upsell context). That stays. This module is the pre-sale
   canonical script — different audience, different goal.
   ============================================ */

(function () {
    'use strict';

    const esc = (s) => (window.LaunchLocal && LaunchLocal.escapeHtml)
        ? LaunchLocal.escapeHtml(s)
        : String(s ?? '').replace(/[&<>"']/g, c => ({
            '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
        }[c]));

    const fmt = (n) => '$' + Math.round(n).toLocaleString();

    // ---------- INDUSTRY → TRACK ----------
    // Maps the prospect dropdown values to one of 5 script tracks.
    function getTrack(industry) {
        const t = (industry || '').toLowerCase();
        if (t === 'restaurant') return 'restaurant';
        if (t === 'tradesperson') return 'trades';
        if (t === 'salon') return 'salon';
        if (t === 'retail') return 'retail';
        return 'generic';
    }

    // ---------- SMART PRICING ----------
    // Tier rules:
    //   premium  → high-margin / professional services (lawyers, dentists, etc.)
    //   standard → restaurant, salon, retail, generic "other"
    //   value    → tradesperson and small-margin services
    //
    // Premium is detected by businessName keywords because the existing
    // industry dropdown only has 5 buckets — we can't rely on it alone.
    const PREMIUM_KEYWORDS = [
        'law', 'attorney', 'legal',
        'dental', 'dentist', 'orthodont',
        'medical', 'clinic', 'doctor', 'physician', 'med spa', 'medspa',
        'chiropract', 'physiotherap', 'optometr', 'veterinar',
        'cosmetic', 'plastic surgery',
        'accountant', 'accounting', 'cpa', 'tax',
        'real estate', 'realtor', 'realty', 'broker',
        'financial', 'wealth', 'insurance',
        'consultant', 'consulting',
        'engineering', 'architect',
        'notary'
    ];

    function getTier(prospect) {
        const name = (prospect?.businessName || '').toLowerCase();
        const industry = (prospect?.industry || '').toLowerCase();

        // Premium override by name keywords (lawyer, dentist, etc.)
        if (PREMIUM_KEYWORDS.some(kw => name.includes(kw))) return 'premium';

        if (industry === 'tradesperson') return 'value';
        // restaurant / salon / retail / other → standard
        return 'standard';
    }

    const TIER_BASE = {
        premium:  { build: 1997, maintenance: 200, anchorMult: 5.0 },
        standard: { build: 1497, maintenance: 150, anchorMult: 4.5 },
        value:    { build:  997, maintenance: 100, anchorMult: 4.0 }
    };

    const TIER_LABEL = {
        premium:  'Premium',
        standard: 'Standard',
        value:    'Value'
    };

    function getSmartPricing(prospect) {
        const tier = getTier(prospect);
        const score = prospect?.prospectScore || 0;
        const base = TIER_BASE[tier];

        let build = base.build;

        // Score modifier — hot leads pay more, cold leads get a nudge
        if (score >= 80) build += 200;
        else if (score < 50) build = Math.max(build - 200, 797);

        // Round to nearest .97 anchor (e.g. 1697 → 1697, 1500 → 1497)
        build = Math.floor(build / 100) * 100 - 3;
        if (build < 797) build = 797;

        const anchor = Math.round((build * base.anchorMult) / 100) * 100;

        const reasons = [];
        if (tier === 'premium') reasons.push('premium industry');
        else if (tier === 'value') reasons.push('value-tier industry');
        else reasons.push('standard industry');
        if (score >= 80) reasons.push('hot lead');
        else if (score < 50) reasons.push('lower urgency');

        return {
            build,
            maintenance: base.maintenance,
            anchor,
            tier,
            tierLabel: TIER_LABEL[tier],
            reasoning: reasons.join(' · '),
            buildDisplay: fmt(build),
            maintenanceDisplay: fmt(base.maintenance) + '/mo',
            anchorDisplay: fmt(anchor),
            paidInFullDiscount: 200,
            paidInFullDisplay: fmt(build - 200)
        };
    }

    // ---------- AVERAGE TICKET DEFAULTS (CAD) ----------
    // Used for cost-of-inaction math when the prospect record has no avgTicket.
    const DEFAULT_AVG_TICKETS = {
        restaurant: 25,
        tradesperson: 400,
        salon: 80,
        retail: 50,
        other: 100
    };

    function getDefaultAvgTicket(industry) {
        return DEFAULT_AVG_TICKETS[industry] || DEFAULT_AVG_TICKETS.other;
    }

    // ---------- INDUSTRY COPY ----------
    // Phrase library — used in opener, mechanism, urgency, etc.
    const COPY = {
        restaurant: {
            customerType: 'diners',
            customerVerb: 'dine with you',
            searchExample: '"best [cuisine] near me"',
            cta: 'reservation or order',
            avgUnit: 'cover',
            extraPerMonth: 8,         // conservative extra customers/mo from a good site
            stackEmoji: '🍽️'
        },
        trades: {
            customerType: 'jobs',
            customerVerb: 'request a quote',
            searchExample: '"[trade] in [city]"',
            cta: 'quote request',
            avgUnit: 'job',
            extraPerMonth: 3,
            stackEmoji: '🔧'
        },
        salon: {
            customerType: 'clients',
            customerVerb: 'book an appointment',
            searchExample: '"[treatment] near me"',
            cta: 'booking',
            avgUnit: 'appointment',
            extraPerMonth: 6,
            stackEmoji: '💆'
        },
        retail: {
            customerType: 'shoppers',
            customerVerb: 'walk in',
            searchExample: '"[product] in [city]"',
            cta: 'visit or inquiry',
            avgUnit: 'sale',
            extraPerMonth: 10,
            stackEmoji: '🛍️'
        },
        generic: {
            customerType: 'customers',
            customerVerb: 'reach out',
            searchExample: 'your service',
            cta: 'call or contact',
            avgUnit: 'customer',
            extraPerMonth: 5,
            stackEmoji: '🏷️'
        }
    };

    // ---------- VALUE STACKS ----------
    // Per-track stack lines. Same structure across tracks so render is uniform.
    // `value` is the anchor dollar amount; `included` items add value but no $.
    const STACKS = {
        restaurant: [
            { label: 'Custom site designed around your menu + atmosphere', value: 3500 },
            { label: 'Online menu with photos — updateable in 5 minutes', value: 800 },
            { label: 'Reservations / order-online button (one click)', value: 700 },
            { label: 'Google Maps + "near me" SEO so you win the lunch search', value: 1500 },
            { label: 'Mobile-first build (90%+ of food searches are mobile)', value: 0, included: true },
            { label: 'Review funnel — happy diners → Google reviews on autopilot', value: 600 },
            { label: 'Photo direction + on-site shoot day', value: 700 },
            { label: 'Hosting, SSL, daily backups', value: 300, suffix: '/yr' },
            { label: '30 days unlimited revisions post-launch', value: 800 }
        ],
        trades: [
            { label: 'Custom site built around your services + service area', value: 3500 },
            { label: 'Service-area pages so you rank in every town you cover', value: 1200 },
            { label: '"Get a Quote" form piped to your phone in real time', value: 700 },
            { label: 'Local SEO + Google Business Profile optimization', value: 1500 },
            { label: 'Before/after gallery — upload from your phone', value: 500 },
            { label: 'Trust stack — license, insurance, reviews, guarantees', value: 400 },
            { label: 'Emergency-call CTA (clickable on mobile)', value: 300 },
            { label: 'Hosting, SSL, daily backups', value: 300, suffix: '/yr' },
            { label: '30 days unlimited revisions post-launch', value: 800 }
        ],
        salon: [
            { label: 'Custom site designed around your brand aesthetic', value: 3500 },
            { label: 'Online booking integrated with your system', value: 900 },
            { label: 'Service menu with prices — easy to edit', value: 700 },
            { label: 'Stylist / practitioner profiles', value: 600 },
            { label: 'Local SEO so you own "[treatment] near me"', value: 1500 },
            { label: 'Instagram feed embedded + auto-syncing', value: 400 },
            { label: 'Gift card / package promo blocks', value: 500 },
            { label: 'Hosting, SSL, daily backups', value: 300, suffix: '/yr' },
            { label: '30 days unlimited revisions post-launch', value: 800 }
        ],
        retail: [
            { label: 'Custom site designed around your storefront + product range', value: 3500 },
            { label: 'Featured-products module (no full e-com complexity)', value: 900 },
            { label: 'Store hours, directions, parking — front and center', value: 400 },
            { label: 'Local SEO + Google Maps optimization', value: 1500 },
            { label: '"Hold this for me" inquiry form', value: 500 },
            { label: 'Email capture for promos / new stock', value: 400 },
            { label: 'Photo direction for hero shots', value: 600 },
            { label: 'Hosting, SSL, daily backups', value: 300, suffix: '/yr' },
            { label: '30 days unlimited revisions post-launch', value: 800 }
        ],
        generic: [
            { label: 'Custom site (not a template) built for your business', value: 3500 },
            { label: 'Conversion-focused copy', value: 1200 },
            { label: 'Local SEO + Google Business Profile setup', value: 1500 },
            { label: 'Lead capture → straight to your phone/email', value: 400 },
            { label: 'Mobile-first, fast-loading', value: 0, included: true },
            { label: 'One-click contact / booking', value: 600 },
            { label: 'Hosting, SSL, daily backups', value: 300, suffix: '/yr' },
            { label: '30 days unlimited revisions post-launch', value: 800 }
        ]
    };

    // ---------- TIME ESTIMATES ----------
    function targetLaunchDate() {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
    }

    function nextSlotDate() {
        const d = new Date();
        d.setDate(d.getDate() + 35); // ~5 weeks out
        return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
    }

    // ---------- STEP RENDERERS ----------
    // Each step is a self-contained card. Steps render in order.

    function stepCard({ num, title, budget, goal, criterion, body }) {
        return `
            <div class="ss-step" data-step="${num}">
                <div class="ss-step-head">
                    <div class="ss-step-num">${num}</div>
                    <div class="ss-step-meta">
                        <h4 class="ss-step-title">${esc(title)}</h4>
                        <div class="ss-step-tags">
                            <span class="ss-tag ss-tag-time">⏱ ${esc(budget)}</span>
                            ${goal ? `<span class="ss-tag ss-tag-goal">Goal: ${esc(goal)}</span>` : ''}
                        </div>
                    </div>
                    <label class="ss-step-check" title="Mark complete">
                        <input type="checkbox" class="ss-check"> <span></span>
                    </label>
                </div>
                ${criterion ? `<div class="ss-criterion">✓ Done when: ${esc(criterion)}</div>` : ''}
                <div class="ss-step-body">${body}</div>
            </div>
        `;
    }

    function dialog(text) {
        return `<div class="ss-dialog">${text}</div>`;
    }

    function note(text) {
        return `<div class="ss-note">${text}</div>`;
    }

    function bulletList(items) {
        return `<ul class="ss-list">${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
    }

    // ---------- MAIN RENDER ----------
    function render(prospect, opts = {}) {
        const p = prospect || {};
        const track = getTrack(p.industry);
        const copy = COPY[track];
        const stack = STACKS[track];
        const pricing = getSmartPricing(p);
        const avgTicket = Number(p.avgTicket) || getDefaultAvgTicket(p.industry);
        const bizName = esc(p.businessName || 'this business');
        const reviewCount = Number(p.reviewCount) || 0;
        const rating = p.googleRating || null;
        const hasWebsite = !!p.website;
        const launchDate = targetLaunchDate();
        const nextSlot = nextSlotDate();
        const cityHint = (p.address || '').split(',').slice(-2, -1)[0]?.trim() || 'your area';

        // Cost-of-inaction math
        const extraCustomers = copy.extraPerMonth;
        const monthlyUpside = extraCustomers * avgTicket;
        const yearlyUpside = monthlyUpside * 12;
        const paybackWeeks = Math.max(1, Math.ceil(pricing.build / Math.max(monthlyUpside, 1) * 4.3));

        const stackTotal = stack.reduce((s, i) => s + (i.value || 0), 0);

        // ---------- HEADER ----------
        const header = `
            <div class="ss-header">
                <div class="ss-header-left">
                    <h3 class="ss-title">Live Script — ${bizName}</h3>
                    <div class="ss-header-meta">
                        <span class="ss-pill">${copy.stackEmoji} ${esc(track[0].toUpperCase() + track.slice(1))} track</span>
                        <span class="ss-pill ss-pill-tier ss-pill-tier-${pricing.tier}">${esc(pricing.tierLabel)} pricing</span>
                        <span class="ss-pill">${esc(pricing.buildDisplay)} build · ${esc(pricing.maintenanceDisplay)}</span>
                    </div>
                    <div class="ss-header-sub">${esc(pricing.reasoning)}</div>
                </div>
                <div class="ss-header-right">
                    <div class="ss-avgticket-wrap">
                        <label class="ss-avgticket-label">Avg ticket
                            <span class="ss-hint">used for cost-of-inaction math</span>
                        </label>
                        <div class="ss-avgticket-row">
                            <span class="ss-avgticket-prefix">$</span>
                            <input type="number" class="ss-avgticket-input" id="ss-avgticket"
                                   value="${avgTicket}" min="1" step="1"
                                   data-prospect-id="${esc(p.id || '')}">
                            <span class="ss-avgticket-suffix">per ${esc(copy.avgUnit)}</span>
                        </div>
                    </div>
                    <div class="ss-actions">
                        <button class="btn btn-ghost btn-sm ss-print-btn" type="button">🖨 Print</button>
                        <button class="btn btn-ghost btn-sm ss-reset-btn" type="button">Reset checks</button>
                    </div>
                </div>
            </div>
        `;

        // ---------- BEFORE-MEETING PREP ----------
        const prep = `
            <div class="ss-prep">
                <h4 class="ss-prep-title">Before you walk in (5 min)</h4>
                <ol class="ss-prep-list">
                    <li>Demo open in browser tab + on phone.</li>
                    <li>Two competitor sites currently outranking ${bizName} on Google.</li>
                    <li>Confirm avg ticket above — adjust if you know better.</li>
                    <li>Know the launch date you'll commit to: <strong>${esc(launchDate)}</strong>.</li>
                </ol>
            </div>
        `;

        // ---------- 12 STEPS ----------
        const steps = [];

        // STEP 1 — Open + Demo Reveal
        steps.push(stepCard({
            num: 1, title: 'Open + Demo Reveal', budget: '≤ 3 min',
            goal: 'Site on their screen inside 90 seconds',
            criterion: "they've scrolled, clicked, or said any reaction",
            body: dialog(`
                "Hey [Name]. I'll skip the small talk and respect your time.
                I already built you a sample website. Took me a few hours.
                I want to show it to you, you tell me if it's better than what
                you've got, and we go from there. Sound good?"
                <br><br>
                <em>[Don't wait for permission. Share screen / hand them the phone.]</em>
                <br><br>
                "This is yours — your business, your services, your area.
                Click anything. Try the ${esc(copy.cta)} button. Tell me what jumps out."
            `) + note(`<strong>Then shut up</strong> for 60–90 seconds. Watch where their eyes go.`)
        }));

        // STEP 2 — Embedded Discovery
        steps.push(stepCard({
            num: 2, title: 'Embedded Discovery', budget: '≤ 5 min',
            goal: 'Get the 4 numbers you need',
            criterion: 'you can write the cost-of-inaction math on the spot',
            body: `<p class="ss-intro">Ask between their clicks — they're more honest while engaged with the demo.</p>` +
                bulletList([
                    `"Where does most of your business come from right now?"`,
                    `"Roughly how many new ${esc(copy.customerType)} do you land in a month?"`,
                    `"What's an average ${esc(copy.avgUnit)} worth to you?" <em class="ss-em">(update the avg ticket above)</em>`,
                    `"How many of those people found you on Google?" <em class="ss-em">(most will say "I don't know" — that's gold)</em>`,
                    `"On a scale of 1 to 10, how badly do you want to close that gap in the next 30 days?"`
                ])
        }));

        // STEP 3 — Cost of Inaction
        steps.push(stepCard({
            num: 3, title: 'Cost of Inaction', budget: '≤ 2 min',
            goal: 'Make doing nothing feel expensive',
            criterion: 'they nod or go quiet at the number',
            body: dialog(`
                "Quick math. A ${esc(copy.avgUnit)} is worth about <strong>${fmt(avgTicket)}</strong> to you.
                If a better website brought you just <strong>${extraCustomers} extra ${esc(copy.customerType)} a month</strong> —
                conservative — that's <strong>${fmt(monthlyUpside)}/month</strong>,
                <strong>${fmt(yearlyUpside)}/year</strong>.
                Doing nothing for the next 12 months isn't free.
                It's a <strong>${fmt(yearlyUpside)} decision</strong>. Fair?"
            `) + note(`Pause. Let it land. Let them say "yeah" or "huh" — don't fill the silence.`)
        }));

        // STEP 4 — Mechanism
        steps.push(stepCard({
            num: 4, title: 'The Mechanism', budget: '≤ 60 sec',
            goal: "Explain why this isn't another web guy",
            criterion: 'said it without stuttering',
            body: dialog(`
                "Most websites are brochures — pretty, ignored, never make a dime.
                We build one thing: a <strong>conversion machine</strong>. Three jobs only:
                show up on Google for ${esc(copy.searchExample)},
                load in under a second, and turn the visitor into a ${esc(copy.cta)}.
                Everything you just clicked is built around that."
            `)
        }));

        // STEP 5 — Industry Value Stack
        const stackRows = stack.map(item => {
            const valDisplay = item.included
                ? '<span class="ss-stack-included">included</span>'
                : `<span class="ss-stack-val">${fmt(item.value)}${item.suffix || ''}</span>`;
            return `<tr><td>${esc(item.label)}</td><td class="ss-stack-val-cell">${valDisplay}</td></tr>`;
        }).join('');

        steps.push(stepCard({
            num: 5, title: `Value Stack — ${esc(track[0].toUpperCase() + track.slice(1))}`, budget: '≤ 3 min',
            goal: 'Make the price feel small',
            criterion: 'you reached the total without interruption',
            body: `
                <div class="ss-intro">"So here's what you actually get. I'll go fast — stop me if anything's unclear."</div>
                <table class="ss-stack-table">
                    <thead><tr><th>What you get</th><th class="ss-stack-val-cell">Value</th></tr></thead>
                    <tbody>${stackRows}</tbody>
                    <tfoot>
                        <tr><td><strong>Real-world value</strong></td>
                        <td class="ss-stack-val-cell"><strong>${fmt(stackTotal)}</strong></td></tr>
                    </tfoot>
                </table>
                ${dialog(`
                    "Total real-world value on that is <strong>${fmt(stackTotal)}</strong>.
                    That's what it'd cost piecing this together from an agency, copywriter,
                    SEO guy, and developer — before anyone cared whether it made you money."
                `)}
            `
        }));

        // STEP 6 — Price Drop
        steps.push(stepCard({
            num: 6, title: 'Price Drop', budget: '≤ 30 sec',
            goal: 'Anchor against the stack — then stop talking',
            criterion: 'you shut up after the price',
            body: dialog(`
                "I'm not charging you ${fmt(stackTotal)}. I'm not even charging you ${esc(pricing.anchorDisplay)}.
                Your investment is <strong>${esc(pricing.buildDisplay)}</strong> — one time, you own it forever.
                ${esc(pricing.maintenanceDisplay)} after that keeps it running, hosted, and updated.
                No subscription, no surprises."
            `) + note(`<strong>Silence.</strong> Count to 10 in your head if you have to.`)
        }));

        // STEP 7 — Triple Guarantee
        steps.push(stepCard({
            num: 7, title: 'Triple Guarantee', budget: '≤ 60 sec',
            goal: 'Take all the risk off the table',
            criterion: 'they nod at "either way you win"',
            body: `
                <div class="ss-intro">"Three guarantees. I'm taking the risk, not you."</div>
                <ol class="ss-guarantees">
                    <li><strong>Love-it.</strong> Don't love the design? We redesign. No charge. Until you do.</li>
                    <li><strong>On-time.</strong> Live by <strong>${esc(launchDate)}</strong> or $200 off. My problem, not yours.</li>
                    <li><strong>Results.</strong> Zero leads in the first 90 days post-launch? I work for free until you get them.</li>
                </ol>
                ${dialog(`"Worst case, you get a free site and I work for nothing. Either way, you win."`)}
            `
        }));

        // STEP 8 — Real Urgency
        steps.push(stepCard({
            num: 8, title: 'Real Urgency', budget: '≤ 20 sec',
            goal: 'Anchor the next decision to a date, not a feeling',
            criterion: 'you named a specific launch date',
            body: dialog(`
                "I take 3 builds a month so quality stays high.
                One slot left for this month. Lock it in today, you're live by
                <strong>${esc(launchDate)}</strong>.
                Next opening after that is <strong>${esc(nextSlot)}</strong> —
                that's 5 more weeks of ${esc(copy.customerType)} finding the other guy first."
            `)
        }));

        // STEP 9 — Assumptive Close
        steps.push(stepCard({
            num: 9, title: 'Assumptive Close', budget: '≤ 30 sec',
            goal: 'Force a yes/no — not a maybe',
            criterion: 'they answered the question you asked',
            body: dialog(`
                "From what you told me — losing ${fmt(monthlyUpside)} a month doing nothing,
                investment is less than ${paybackWeeks} weeks of those lost ${esc(copy.customerType)},
                and I'm taking all the risk. Only question left:
                <strong>paid in full and save $200 (${esc(pricing.paidInFullDisplay)} today),
                or split into two payments?</strong>"
            `) + note(`<strong>Shut up.</strong> First to talk loses.`)
        }));

        // STEP 10 — Objections
        const objections = [
            { q: '"I need to think about it."',
              a: `"Fair. Three things people 'think about' — money, timing, or me. Which one is it? Let's just talk about the real one."` },
            { q: '"Too expensive."',
              a: `"Compared to what? Doing nothing is costing you ${fmt(monthlyUpside)} a month. This pays itself back in ${paybackWeeks} weeks. If you've got a cheaper quote, show me — I'll be honest if they're better."` },
            { q: '"I need to talk to my partner/spouse."',
              a: `"Of course. What will they ask? Let's answer it now so you're not their messenger. Or — three-way them in for 5 minutes?"` },
            { q: '"Send me something in writing."',
              a: `"Will do, right after this call. Quick question — if the proposal says exactly what I just told you, are we doing this? If yes, I start tonight. If no, what's missing?"` },
            { q: '"Got burned before."',
              a: `"Believe it. That's exactly why I guarantee everything. You don't pay for results you don't get. Last guy didn't do that, did he?"` },
            { q: '"Let me check the budget."',
              a: `"Smart. Is there <em>any</em> number that works this week? If yes, we can probably get there. If no, I'd rather know now than chase you for two weeks."` },
            { q: '"Can I keep the demo?"',
              a: `"It's yours the second you say yes. Until then I keep it private — only fair."` }
        ];

        if (hasWebsite) {
            objections.push({
                q: `"I already have a website."`,
                a: `"Can we look at it together? Sometimes what seems fine is being punished by Google. 30 seconds." <em>Then point at the facts: SSL, mobile, load speed, copyright year, GBP link.</em>`
            });
        }

        steps.push(stepCard({
            num: 10, title: 'Objection Handlers', budget: 'as needed',
            goal: 'Use only the ones they raise',
            criterion: 'objection answered → loop back to Step 9',
            body: `
                <div class="ss-objections">
                    ${objections.map(o => `
                        <div class="ss-obj">
                            <div class="ss-obj-q">${o.q}</div>
                            <div class="ss-obj-a">${o.a}</div>
                        </div>
                    `).join('')}
                </div>
            `
        }));

        // STEP 11 — If YES
        steps.push(stepCard({
            num: 11, title: 'If YES — Close-Out', budget: '≤ 5 min',
            goal: 'Do not leave without all three',
            criterion: 'agreement signed, deposit collected, kickoff booked',
            body: `
                <ol class="ss-yes-list">
                    <li>Send the 1-page agreement (e-sign).</li>
                    <li>Collect deposit via Stripe link or e-transfer.</li>
                    <li>Send 5-min intake form.</li>
                    <li>Book the kickoff call <strong>in front of them</strong>.</li>
                </ol>
                ${dialog(`
                    "Three things in the next 15 minutes: agreement to your inbox,
                    deposit link, intake form. Kickoff is <strong>[day/time]</strong>.
                    We're live by <strong>${esc(launchDate)}</strong>. Welcome aboard."
                `)}
            `
        }));

        // STEP 12 — If NO
        steps.push(stepCard({
            num: 12, title: 'If NO — Protect the Bridge', budget: '≤ 60 sec',
            goal: 'Tag prospect, ask for the referral',
            criterion: 'tagged not-now-90 or dead, follow-up set',
            body: dialog(`
                "All good. Two questions so I don't waste your time later —
                is this a 'no, not now' or a 'no, never'?
                And — who do you know who IS trying to grow right now?
                I'll take care of them and I'll take care of you for the intro."
            `)
        }));

        // ---------- TIMING SUMMARY ----------
        const timing = `
            <div class="ss-timing">
                <h4 class="ss-timing-title">Timing summary</h4>
                <table class="ss-timing-table">
                    <tbody>
                        <tr><td>Steps 1–9 (open through close)</td><td>~16 min</td></tr>
                        <tr><td>Objections (as needed)</td><td>+0–6 min</td></tr>
                        <tr><td>Yes/No close-out</td><td>+1–5 min</td></tr>
                        <tr><td><strong>Total target</strong></td><td><strong>20–25 min</strong></td></tr>
                    </tbody>
                </table>
            </div>
        `;

        return `
            <div class="sales-script" data-track="${track}">
                ${header}
                ${prep}
                <div class="ss-steps">${steps.join('')}</div>
                ${timing}
            </div>
        `;
    }

    // ---------- BIND HELPERS (called by sales.js after render) ----------
    // Wires the avg-ticket input, print button, and reset-checks button.
    // onAvgTicketChange(prospectId, value) is called when the input changes.
    function bind(rootEl, { onAvgTicketChange } = {}) {
        if (!rootEl) return;

        const avgInput = rootEl.querySelector('#ss-avgticket');
        if (avgInput && onAvgTicketChange) {
            let debounce;
            avgInput.addEventListener('input', () => {
                clearTimeout(debounce);
                debounce = setTimeout(() => {
                    const id = avgInput.getAttribute('data-prospect-id');
                    const val = Number(avgInput.value);
                    if (id && val > 0) onAvgTicketChange(id, val);
                }, 600);
            });
        }

        const printBtn = rootEl.querySelector('.ss-print-btn');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                document.body.classList.add('printing-script');
                window.print();
                setTimeout(() => document.body.classList.remove('printing-script'), 500);
            });
        }

        const resetBtn = rootEl.querySelector('.ss-reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                rootEl.querySelectorAll('.ss-check').forEach(cb => { cb.checked = false; });
                rootEl.querySelectorAll('.ss-step').forEach(s => s.classList.remove('ss-step-done'));
            });
        }

        rootEl.querySelectorAll('.ss-check').forEach(cb => {
            cb.addEventListener('change', () => {
                const step = cb.closest('.ss-step');
                if (step) step.classList.toggle('ss-step-done', cb.checked);
            });
        });
    }

    // ---------- EXPORT ----------
    // app.js declares `const LaunchLocal = {...}` which lives in the global
    // lexical scope but NOT on `window`. Attach to the lexical reference so
    // sales.js (which references `LaunchLocal.SalesScript` by name) finds us.
    LaunchLocal.SalesScript = {
        getTrack,
        getTier,
        getSmartPricing,
        getDefaultAvgTicket,
        render,
        bind
    };
})();
