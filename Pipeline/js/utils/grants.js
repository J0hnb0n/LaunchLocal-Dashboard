/* ============================================
   LaunchLocal — Government Grants Utility
   ============================================ */

/**
 * Grants — filters the Innovation Canada Business Benefits Finder dataset
 * (~1,300 federal/provincial programs) down to a short-list relevant to a
 * specific prospect, by province + industry. Renders the matches inline on
 * the sales cheat sheet so the rep never has to click through and filter
 * manually.
 *
 * Data source: Open Government Portal dataset 4e75337e-70d0-4ed7-92d1-3b85192ec6b1
 *   js/data/grants-data.json  (trimmed English-only, refresh quarterly)
 *
 * Matching is keyword-based — the source data has no structured
 * province/industry columns, so we infer:
 *   - Province: organization mentions "Government of Canada" (federal) or
 *     the prospect's own province name. Programs naming a DIFFERENT province
 *     are excluded.
 *   - Industry: bucket of keywords per industry; falls back to generic
 *     small-business relevance.
 *   - Digital/web/marketing keywords get a boost — most pitchable for a
 *     web-build conversation.
 *
 * Loading is lazy + cached. App.init() calls preload() so data is ready
 * by the time a cheatsheet opens.
 */
const Grants = {
    DATA_URL: 'js/data/grants-data.json',
    BENEFITS_FINDER_URL: 'https://innovation.ised-isde.canada.ca/innovation/s/list-liste?language=en_CA',
    CANADA_FINANCING_URL: 'https://www.canada.ca/en/services/business/grants.html',

    _data: null,
    _loading: null,

    PROVINCES: {
        AB: 'Alberta', BC: 'British Columbia', MB: 'Manitoba', NB: 'New Brunswick',
        NL: 'Newfoundland and Labrador', NS: 'Nova Scotia', NT: 'Northwest Territories',
        NU: 'Nunavut', ON: 'Ontario', PE: 'Prince Edward Island', QC: 'Quebec',
        SK: 'Saskatchewan', YT: 'Yukon'
    },

    ALL_PROVINCE_NAMES: [
        'ontario','quebec','british columbia','alberta','manitoba','saskatchewan',
        'nova scotia','new brunswick','newfoundland','prince edward',
        'yukon','northwest territories','nunavut'
    ],

    INDUSTRY_LABELS: {
        restaurant: 'Food services / restaurant',
        tradesperson: 'Skilled trades / automotive',
        salon: 'Personal care / salon / spa',
        retail: 'Retail',
        other: 'Small business'
    },

    // Industry-specific keywords (weighted heavily in scoring)
    INDUSTRY_KEYWORDS: {
        restaurant: ['restaurant','food','hospitality','tourism','agri','beverage','culinary'],
        tradesperson: ['trade','construction','manufactur','automotive','apprentice','skilled','contractor'],
        salon: ['personal','wellness','health','service industry','beauty'],
        retail: ['retail','store','commerce','e-commerce','consumer','shop'],
        other: []
    },

    // Always-relevant small-business keywords (mild boost)
    GENERIC_KEYWORDS: ['small business','sme','entrepreneur','startup','grant','loan','subsidy','funding'],

    // Highest pitch value — owners investing in a website care about these
    DIGITAL_KEYWORDS: ['digital','technology','website','online','e-commerce','marketing','innovation','adoption'],

    // Programs targeting academia/research — never relevant to a local business pitch
    EXCLUDE_PATTERNS: /\b(university|postdoctoral|postdoc|phd|doctoral|research chair|academic research|student loan|professor)\b/,

    parseProvince(address) {
        if (!address || typeof address !== 'string') return 'ON';
        const match = address.toUpperCase().match(/\b(AB|BC|MB|NB|NL|NS|NT|NU|ON|PE|QC|SK|YT)\b/);
        return match ? match[1] : 'ON';
    },

    industryLabel(industry) {
        return this.INDUSTRY_LABELS[industry] || this.INDUSTRY_LABELS.other;
    },

    industryKey(industry) {
        return this.INDUSTRY_KEYWORDS[industry] ? industry : 'other';
    },

    context(prospect) {
        const code = this.parseProvince(prospect?.address);
        const iKey = this.industryKey(prospect?.industry);
        return {
            provinceCode: code,
            provinceName: this.PROVINCES[code] || 'Ontario',
            industryKey: iKey,
            industryLabel: this.industryLabel(prospect?.industry)
        };
    },

    /**
     * Fire-and-forget preload. Safe to call repeatedly — the first call does
     * the fetch, subsequent calls are no-ops.
     */
    preload() {
        return this.load().catch(() => {});
    },

    load() {
        if (this._data) return Promise.resolve(this._data);
        if (this._loading) return this._loading;
        this._loading = fetch(this.DATA_URL, { cache: 'default' })
            .then(r => {
                if (!r.ok) throw new Error(`grants data HTTP ${r.status}`);
                return r.json();
            })
            .then(d => {
                this._data = Array.isArray(d) ? d : [];
                this._loading = null;
                return this._data;
            })
            .catch(err => {
                console.warn('Grants: failed to load data', err);
                this._loading = null;
                this._data = [];
                return this._data;
            });
        return this._loading;
    },

    _score(program, ctx) {
        const hay = `${program.t} ${program.s} ${program.d} ${program.o}`.toLowerCase();
        const org = program.o.toLowerCase();
        const title = program.t.toLowerCase();

        if (this.EXCLUDE_PATTERNS.test(hay)) return 0;

        // Province gate
        const isFederal = org.includes('government of canada');
        const provName = ctx.provinceName.toLowerCase();
        const mentionsOwn = hay.includes(provName);
        const otherProvs = this.ALL_PROVINCE_NAMES.filter(p => p !== provName);
        // Title mentioning another province is a strong geographic scope signal —
        // exclude even federal programs ("Northern Ontario Development Program"
        // is federal but Ontario-only, and shouldn't surface for a BC prospect).
        if (otherProvs.some(p => title.includes(p))) return 0;
        const mentionsOther = otherProvs.some(p => org.includes(p));

        let score;
        if (mentionsOwn) score = 5;
        else if (isFederal) score = 3;
        else if (mentionsOther) return 0;
        else score = 1;

        // Industry keywords
        const iKws = this.INDUSTRY_KEYWORDS[ctx.industryKey] || [];
        for (const kw of iKws) if (hay.includes(kw)) score += 3;

        // Digital / marketing / innovation — max +6
        let digHits = 0;
        for (const kw of this.DIGITAL_KEYWORDS) if (hay.includes(kw)) digHits++;
        score += Math.min(digHits * 2, 6);

        // Generic small-biz — max +3
        let genHits = 0;
        for (const kw of this.GENERIC_KEYWORDS) if (hay.includes(kw)) genHits++;
        score += Math.min(genHits, 3);

        return score;
    },

    match(prospect, limit = 6) {
        if (!this._data || this._data.length === 0) return [];
        const ctx = this.context(prospect);
        return this._data
            .map(p => ({ p, s: this._score(p, ctx) }))
            .filter(x => x.s > 0)
            .sort((a, b) => b.s - a.s)
            .slice(0, limit)
            .map(x => x.p);
    },

    _grantCardHTML(p) {
        const esc = LaunchLocal.escapeHtml;
        return `
            <div class="grant-card" style="padding:10px 12px;border:1px solid var(--border);border-radius:6px;margin-bottom:8px;background:var(--bg);">
                <a href="${esc(p.u)}" target="_blank" rel="noopener" style="font-weight:600;color:var(--accent);text-decoration:none;">
                    ${esc(p.t)} &#8599;
                </a>
                <div class="text-sm" style="margin-top:4px;">${esc(p.s)}</div>
                <div class="text-muted text-sm" style="margin-top:4px;">${esc(p.o)}</div>
            </div>
        `;
    },

    renderCheatsheetBlock(prospect) {
        const ctx = this.context(prospect);
        const esc = LaunchLocal.escapeHtml;
        const matches = this.match(prospect, 6);

        const body = matches.length > 0
            ? matches.map(m => this._grantCardHTML(m)).join('')
            : `<p class="text-sm text-muted">Grant data still loading — <a href="${this.BENEFITS_FINDER_URL}" target="_blank" rel="noopener">browse all programs &#8599;</a></p>`;

        return `
            <div class="cs-section cs-full">
                <h4 class="cs-section-title">
                    Government Grants &mdash;
                    <span class="text-muted" style="font-weight:500;">${esc(ctx.provinceName)} / ${esc(ctx.industryLabel)}</span>
                </h4>
                <p class="text-sm" style="margin:0 0 12px;">
                    Mention these to the owner &mdash; their build could be partially offset by available funding.
                </p>
                <div class="grants-list">${body}</div>
                <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
                    <a class="btn btn-ghost btn-sm" href="${this.BENEFITS_FINDER_URL}" target="_blank" rel="noopener">
                        Browse all 1,300+ programs &#8599;
                    </a>
                    <a class="btn btn-ghost btn-sm" href="${this.CANADA_FINANCING_URL}" target="_blank" rel="noopener">
                        Canada.ca financing &#8599;
                    </a>
                </div>
            </div>
        `;
    },

    renderProspectRow(prospect) {
        const esc = LaunchLocal.escapeHtml;
        const matches = this.match(prospect, 3);

        if (matches.length === 0) {
            return `
                <div class="detail-row">
                    <span>Grants</span>
                    <span><a href="${this.BENEFITS_FINDER_URL}" target="_blank" rel="noopener">Innovation Canada &#8599;</a></span>
                </div>
            `;
        }

        const list = matches.map(m =>
            `<div><a href="${esc(m.u)}" target="_blank" rel="noopener">${esc(m.t)} &#8599;</a></div>`
        ).join('');

        return `
            <div class="detail-row" style="align-items:flex-start;">
                <span>Grants</span>
                <span style="text-align:right;">
                    ${list}
                    <div style="margin-top:4px;">
                        <a href="${this.BENEFITS_FINDER_URL}" target="_blank" rel="noopener" class="text-muted text-sm">See all &#8599;</a>
                    </div>
                </span>
            </div>
        `;
    }
};

LaunchLocal.Grants = Grants;
