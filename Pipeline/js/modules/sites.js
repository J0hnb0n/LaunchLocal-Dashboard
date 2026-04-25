/* ============================================
   LaunchLocal — Sites Module
   ============================================ */

const PALETTE_LIBRARY = {
    restaurant: {
        warm: [
            { name: 'Family Burgundy',     primary: '#8B1A1A', accent: '#F5E6D3' },
            { name: 'Terracotta Hearth',   primary: '#C96442', accent: '#6B7F5E' },
            { name: 'Imperial Red & Gold', primary: '#9E1B1E', accent: '#D4A437' }
        ],
        clean: [
            { name: 'Olive & Cream',       primary: '#4E5B3C', accent: '#EFEAD8' },
            { name: 'Slate & Terracotta',  primary: '#3E4A50', accent: '#C56B3F' }
        ],
        bold: [
            { name: 'Charcoal & Amber',    primary: '#2B2B2B', accent: '#E8A33D' },
            { name: 'Crimson & Onyx',      primary: '#B32222', accent: '#1A1A1A' }
        ]
    },
    tradesperson: {
        warm: [
            { name: 'Barn Red & Cream',    primary: '#8B2C2C', accent: '#F4EAD5' },
            { name: 'Earth & Copper',      primary: '#4A3728', accent: '#B87333' }
        ],
        clean: [
            { name: 'Charcoal & Steel',    primary: '#263238', accent: '#3E70A5' },
            { name: 'Deep Navy & Tan',     primary: '#1E3A5F', accent: '#C19960' }
        ],
        bold: [
            { name: 'Navy & Safety Orange',primary: '#13365E', accent: '#F26A21' },
            { name: 'Slate & Caution',     primary: '#37474F', accent: '#FFC107' },
            { name: 'Forest & Copper',     primary: '#2C4A33', accent: '#B87333' }
        ]
    },
    salon: {
        warm: [
            { name: 'Mauve & Cream',       primary: '#7B5E74', accent: '#F4E6D8' },
            { name: 'Sage & Ivory',        primary: '#7B8C6F', accent: '#F5F1E8' }
        ],
        clean: [
            { name: 'Taupe & White',       primary: '#6B5B4E', accent: '#FFFFFF' },
            { name: 'Black & Ivory',       primary: '#1A1A1A', accent: '#F8F5F0' }
        ],
        bold: [
            { name: 'Charcoal & Rose Gold',primary: '#2D2E32', accent: '#B78E7B' },
            { name: 'Noir & Blush',        primary: '#1A1A1A', accent: '#E8C5BF' }
        ]
    },
    retail: {
        warm: [
            { name: 'Forest & Cream',      primary: '#2F5230', accent: '#F4EAD5' },
            { name: 'Rust & Sand',         primary: '#A05131', accent: '#EAD9B5' }
        ],
        clean: [
            { name: 'Charcoal & Navy',     primary: '#2D2D2D', accent: '#1B3A5B' },
            { name: 'Slate & Sky',         primary: '#4A5568', accent: '#90CDF4' }
        ],
        bold: [
            { name: 'Navy & Sunset',       primary: '#1B3A5B', accent: '#F2994A' },
            { name: 'Black & Electric Red',primary: '#0E0E0E', accent: '#FF4757' }
        ]
    }
};

const VOICE_MOOD_MAP = {
    Friendly: 'warm', Warm: 'warm', Traditional: 'warm',
    Professional: 'clean', Minimal: 'clean', Modern: 'clean',
    Bold: 'bold'
};

const DEFAULT_UPSELLS_BY_TEMPLATE = {
    restaurant:   ['Review funnel automation', 'SEO package (Google Business optimization)', 'Social media content setup'],
    tradesperson: ['Booking widget integration', 'Review funnel automation', 'SEO package (Google Business optimization)'],
    salon:        ['Booking widget integration', 'Review funnel automation', 'Social media content setup'],
    retail:       ['Email newsletter setup', 'Social media content setup', 'SEO package (Google Business optimization)']
};

const AI_DIRECTIVE_SERVICES = '[AI-GENERATE: The operator has asked you to infer the primary services/offerings. Build a reasonable list using domain knowledge of the business name, industry, and existing website if accessible. Favour specificity (actual menu items, actual service categories) over vagueness. Mark each inferred item with `<!-- PLACEHOLDER: client to confirm -->` so the sales rep can verify with the client before pitching.]';

const AI_DIRECTIVE_HERO = '[AI-GENERATE: The operator has asked you to write the hero angle. Craft a 1–2 sentence lead story that evokes what makes this business distinctive. Use the business name, industry, Google rating/review count, and brand voice as signals. Favour sensory, specific language over generic claims. Wrap the final line in `<!-- PLACEHOLDER: client to confirm -->` so the sales rep can review.]';

// Theme mode guidance — injected into the master prompt template so Claude Code
// knows whether to ship light-only or to wire up a working light/dark switcher.
const THEME_MODE_LIGHT_ONLY = 'Ship a **light-only** site following the default design system above. Do not implement a dark mode or any theme switcher.';

const THEME_MODE_BOTH = `Ship **both light and dark modes** with a user-facing toggle. Implement it like this:

1. **CSS variables in both modes.** Define the default (light) palette on \`:root\`. Define the dark overrides on \`:root[data-theme="dark"]\` using the same variable names (\`--color-bg\`, \`--color-bg-alt\`, \`--color-text\`, \`--color-text-muted\`, \`--color-border\`, etc.). Every component must read from these variables — no hardcoded colours.

2. **Suggested dark palette** (tune so WCAG AA still holds against the chosen \`--color-primary\` / \`--color-accent\`):
   - \`--color-bg: #0E1116\`
   - \`--color-bg-alt: #1A1D24\`
   - \`--color-text: #F1F3F5\`
   - \`--color-text-muted: #9AA0A6\`
   - \`--color-border: #2A2F38\`
   - Shadows should use higher alpha on dark (e.g. \`rgba(0,0,0,0.5)\`).

3. **Theme resolution on load.** Read in this order: \`localStorage.getItem('theme')\` → \`window.matchMedia('(prefers-color-scheme: dark)').matches\` → default \`light\`. Set \`document.documentElement.dataset.theme\` accordingly. Run this **inline in \`<head>\`** (synchronously, before the stylesheet loads) to prevent a flash of the wrong theme.

4. **Toggle control.** Add a button in the header with a sun/moon SVG icon. Update its \`aria-label\` based on the current state ("Switch to dark mode" / "Switch to light mode"). On click, flip \`document.documentElement.dataset.theme\` and persist the new value to \`localStorage\` under the key \`theme\`.

5. **Images and hero overlays.** Hero imagery and any image with text overlaid on it should keep sufficient contrast in both modes — add a theme-aware gradient overlay where needed.

6. **Test both modes before finishing.** WCAG AA must hold for body text in both. Note in \`README.md\` which mode your screenshots were captured in and that the toggle is operator-tested.`;

const HOURS_DAYS = [
    { key: 'mon', label: 'Mon', full: 'Monday' },
    { key: 'tue', label: 'Tue', full: 'Tuesday' },
    { key: 'wed', label: 'Wed', full: 'Wednesday' },
    { key: 'thu', label: 'Thu', full: 'Thursday' },
    { key: 'fri', label: 'Fri', full: 'Friday' },
    { key: 'sat', label: 'Sat', full: 'Saturday' },
    { key: 'sun', label: 'Sun', full: 'Sunday' }
];

const SitesModule = {
    sites: [],
    prospects: [],
    selectedProspect: null,
    regeneratingSiteId: null,
    paletteOverridden: false,
    upsellsTouched: false,
    paletteShortlist: [],
    cachedServicesValue: '',
    cachedHeroAngleValue: '',

    async render(container) {
        container.innerHTML = this.getShellHTML();
        this.bindEvents(container);
        await this.loadSites();
        return () => {
            this.sites = [];
            this.prospects = [];
            this.selectedProspect = null;
            this.regeneratingSiteId = null;
        };
    },

    getShellHTML() {
        return `
            <div class="page-header">
                <div>
                    <h2 class="page-title">Sites</h2>
                    <p class="page-subtitle">Every site in flight — ready to generate, awaiting QA, or approved.</p>
                </div>
            </div>

            <div id="site-content">
                <div class="loading-screen"><div class="spinner spinner-lg"></div></div>
            </div>

            <div class="modal-overlay" id="qa-modal">
                <div class="modal modal-lg">
                    <div class="modal-header">
                        <h3 class="modal-title" id="qa-modal-title">QA Review</h3>
                        <button class="modal-close" id="qa-modal-close">&times;</button>
                    </div>
                    <div class="modal-body" id="qa-modal-body"></div>
                    <div class="modal-footer" id="qa-modal-footer"></div>
                </div>
            </div>

            <div class="modal-overlay" id="generate-modal">
                <div class="modal modal-xl">
                    <div class="modal-header">
                        <h3 class="modal-title" id="generate-modal-title">Generate Site Prompt</h3>
                        <button class="modal-close" id="generate-modal-close">&times;</button>
                    </div>
                    <div class="modal-body" id="generate-modal-body"></div>
                    <div class="modal-footer" id="generate-modal-footer"></div>
                </div>
            </div>

            <div class="modal-overlay" id="prompt-result-modal">
                <div class="modal modal-xl">
                    <div class="modal-header">
                        <h3 class="modal-title">Prompt Ready — Copy to Claude Code</h3>
                        <button class="modal-close" id="prompt-result-close">&times;</button>
                    </div>
                    <div class="modal-body" id="prompt-result-body"></div>
                    <div class="modal-footer" id="prompt-result-footer"></div>
                </div>
            </div>
        `;
    },

    async loadSites(options = {}) {
        try {
            const [sites, approved, queued] = await Promise.all([
                DB.getDocs('sites', { orderBy: [['createdAt', 'desc']] }),
                DB.getDocs('prospects', { where: [['status', '==', 'approved']] }),
                DB.getDocs('prospects', { where: [['status', '==', 'site-queued']] })
            ]);
            this.sites = sites;
            this.prospects = [...approved, ...queued];
            this.renderContent();
            // Files are uploaded by the Stop-hook on each operator's PC,
            // which writes filesUploadedAt + previewVersion + status to the
            // sites doc directly. The dashboard just reflects whatever it
            // sees in Firestore — no client-side probe needed.
        } catch {
            const content = document.getElementById('site-content');
            if (content) content.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">&#9888;</div>
                    <h3 class="empty-state-title">Failed to load sites</h3>
                </div>`;
        }
    },

    /**
     * Build the in-dashboard preview URL for a site. Files live in
     * Firebase Storage at sites/{slug}/, served through the auth-gated
     * /preview/{slug}/... Netlify Function. The ?v= param busts the
     * iframe cache when the hook re-uploads on a new generation.
     *
     * @param {object} site - sites/{siteId} doc
     * @returns {string|null} URL string, or null if the site hasn't been
     *   uploaded yet (filesUploadedAt missing).
     */
    previewUrlFor(site) {
        if (!site || !site.filesUploadedAt) return null;
        const slug = site.clientSlug || site.formData?.clientSlug || site.prospectId;
        if (!slug) return null;
        const v = site.previewVersion ? String(site.previewVersion) : '';
        const params = v ? `?v=${encodeURIComponent(v)}` : '';
        return `/preview/${encodeURIComponent(slug)}/index.html${params}`;
    },

    /**
     * Refresh one site doc from Firestore. Used by the "Refresh" button on
     * a prompt-generated card — gives the operator a way to pull the
     * latest state if the auto-upload hook just finished and the
     * dashboard's local list is stale.
     */
    async refreshSite(siteId) {
        try {
            const fresh = await DB.getDoc('sites', siteId);
            if (!fresh) {
                LaunchLocal.toast('Site no longer exists.', 'warning');
                return;
            }
            const i = this.sites.findIndex(x => x.id === siteId);
            if (i >= 0) this.sites[i] = { id: siteId, ...fresh };
            this.renderContent();

            if (fresh.filesUploadedAt) {
                LaunchLocal.toast(`${fresh.businessName} files uploaded — ready for QA.`, 'success');
            } else {
                LaunchLocal.toast(
                    'No upload detected yet. Make sure Claude Code finished the build, then check tools/README.md if the hook isn\'t running.',
                    'info',
                    7000
                );
            }
        } catch (err) {
            console.error('refreshSite:', err);
            LaunchLocal.toast('Failed to refresh site status.', 'error');
        }
    },

    renderContent() {
        const content = document.getElementById('site-content');
        if (!content) return;

        // Build a unified list. Every approved/site-queued prospect gets a
        // slot; if it has a sites doc, the doc's state determines the tag
        // and the actions. Otherwise it's "Ready to Generate".
        const siteByProspect = new Map();
        this.sites.forEach(s => { if (s.prospectId) siteByProspect.set(s.prospectId, s); });

        const readyToGenerate = this.prospects
            .filter(p => !siteByProspect.has(p.id))
            .map(p => ({ kind: 'ready', prospect: p }));

        const siteCards = this.sites.map(s => ({ kind: 'site', site: s }));

        // Priority order: ready-to-generate first, then awaiting QA, then
        // prompt-only, then needs-revision, then approved.
        const rank = (item) => {
            if (item.kind === 'ready') return 0;
            const s = item.site;
            if (s.qaStatus === 'pending') return 1;
            if (s.status === 'prompt-generated' && !s.qaStatus) return 2;
            if (s.qaStatus === 'revision-needed') return 3;
            if (s.qaStatus === 'approved') return 4;
            return 5;
        };
        const items = [...readyToGenerate, ...siteCards].sort((a, b) => rank(a) - rank(b));

        if (items.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">&#128187;</div>
                    <h3 class="empty-state-title">No sites yet</h3>
                    <p class="empty-state-desc">Approve a prospect in the Prospects module and it will appear here, ready for site generation.</p>
                </div>
            `;
            return;
        }

        content.innerHTML = `<div class="site-cards">${items.map(item => this.renderSiteCard(item)).join('')}</div>`;

        content.querySelectorAll('.qa-review-btn').forEach(btn => {
            btn.addEventListener('click', () => this.openQA(btn.getAttribute('data-id')));
        });
        content.querySelectorAll('.quick-approve-btn').forEach(btn => {
            btn.addEventListener('click', () => this.updateQAStatus(btn.getAttribute('data-id'), 'approved', ''));
        });
        content.querySelectorAll('.view-prompt-btn').forEach(btn => {
            btn.addEventListener('click', () => this.openPromptResult(btn.getAttribute('data-id')));
        });
        content.querySelectorAll('.probe-site-btn').forEach(btn => {
            btn.addEventListener('click', () => this.refreshSite(btn.getAttribute('data-id')));
        });
        content.querySelectorAll('.regenerate-btn').forEach(btn => {
            btn.addEventListener('click', () => this.openRegenerate(btn.getAttribute('data-id')));
        });
        content.querySelectorAll('.generate-for-prospect-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const prospectId = btn.getAttribute('data-id');
                const prospect = this.prospects.find(p => p.id === prospectId);
                if (prospect) {
                    this.regeneratingSiteId = null;
                    document.getElementById('generate-modal').classList.add('open');
                    this.openGenerateForm(prospect);
                }
            });
        });
    },

    renderSiteCard(item) {
        // Ready-to-generate card: no site doc yet — entry point for new sites.
        if (item.kind === 'ready') {
            const p = item.prospect;
            return `
                <div class="site-card">
                    <div class="site-card-preview">
                        <div class="site-preview-placeholder prompt-ready">
                            <span>&#10010;</span>
                            <small>Ready to build</small>
                        </div>
                    </div>
                    <div class="site-card-info">
                        <div class="site-card-name">${LaunchLocal.escapeHtml(p.businessName || 'Unnamed')}</div>
                        <div class="site-card-meta">
                            <span class="badge badge-info">Ready to Generate</span>
                            <span class="industry-tag">${LaunchLocal.escapeHtml(p.industry || 'uncategorized')}</span>
                        </div>
                        <div class="site-card-hint">${LaunchLocal.escapeHtml(p.address || '')}</div>
                    </div>
                    <div class="site-card-actions">
                        <button class="btn btn-primary btn-sm generate-for-prospect-btn" data-id="${p.id}">Generate Prompt</button>
                    </div>
                </div>
            `;
        }

        const s = item.site;

        // Prompt-generated, no QA yet: prompt is ready to run in Claude Code.
        if (s.status === 'prompt-generated' && !s.qaStatus) {
            return `
                <div class="site-card">
                    <div class="site-card-preview">
                        <div class="site-preview-placeholder prompt-ready">
                            <span>&#128221;</span>
                            <small>Prompt ready</small>
                        </div>
                    </div>
                    <div class="site-card-info">
                        <div class="site-card-name">${LaunchLocal.escapeHtml(s.businessName || 'Unnamed Site')}</div>
                        <div class="site-card-meta">
                            <span class="badge badge-info">Prompt Generated</span>
                            <span class="industry-tag">${LaunchLocal.escapeHtml(s.templateUsed || 'default')}</span>
                        </div>
                        <div class="site-card-hint">Run the prompt in Claude Code. Files auto-upload when the session ends — the card flips to "Awaiting QA" within ~10 seconds.</div>
                    </div>
                    <div class="site-card-actions">
                        <button class="btn btn-primary btn-sm view-prompt-btn" data-id="${s.id}">View Prompt</button>
                        <button class="btn btn-success btn-sm probe-site-btn" data-id="${s.id}">Refresh</button>
                        <button class="btn btn-ghost btn-sm regenerate-btn" data-id="${s.id}">Regenerate</button>
                    </div>
                </div>
            `;
        }

        const qaConfig = {
            pending: { badge: 'badge-warning', label: 'Awaiting QA' },
            approved: { badge: 'badge-success', label: 'Approved' },
            'revision-needed': { badge: 'badge-danger', label: 'Needs Revision' }
        };
        const cfg = qaConfig[s.qaStatus] || { badge: 'badge-neutral', label: s.qaStatus || 'Unknown' };

        return `
            <div class="site-card">
                <div class="site-card-preview">
                    <div class="site-preview-placeholder">
                        <span>&#128187;</span>
                        <small>${LaunchLocal.escapeHtml(s.industry || 'website')}</small>
                    </div>
                    <div class="site-scores">
                        ${s.pageSpeedScore ? `<div class="site-score-chip"><span>Speed</span><strong>${s.pageSpeedScore}</strong></div>` : ''}
                        ${s.mobileScore ? `<div class="site-score-chip"><span>Mobile</span><strong>${s.mobileScore}</strong></div>` : ''}
                    </div>
                </div>
                <div class="site-card-info">
                    <div class="site-card-name">${LaunchLocal.escapeHtml(s.businessName || 'Unnamed Site')}</div>
                    <div class="site-card-meta">
                        <span class="badge ${cfg.badge}">${cfg.label}</span>
                        <span class="industry-tag">${LaunchLocal.escapeHtml(s.templateUsed || 'default')}</span>
                    </div>
                    ${s.qaFeedback ? `<div class="site-feedback">"${LaunchLocal.escapeHtml(s.qaFeedback)}"</div>` : ''}
                </div>
                <div class="site-card-actions">
                    <button class="btn btn-secondary btn-sm qa-review-btn" data-id="${s.id}">Review</button>
                    ${s.qaStatus === 'pending' ? `<button class="btn btn-success btn-sm quick-approve-btn" data-id="${s.id}">Quick Approve</button>` : ''}
                    ${s.promptText ? `<button class="btn btn-ghost btn-sm view-prompt-btn" data-id="${s.id}">View Prompt</button>` : ''}
                    ${s.promptText ? `<button class="btn btn-ghost btn-sm regenerate-btn" data-id="${s.id}">Regenerate</button>` : ''}
                </div>
            </div>
        `;
    },

    openQA(id) {
        const s = this.sites.find(x => x.id === id);
        if (!s) return;

        const modal = document.getElementById('qa-modal');
        document.getElementById('qa-modal-title').textContent = `QA Review — ${s.businessName}`;

        const previewUrl = this.previewUrlFor(s);
        const previewBlock = previewUrl
            ? `
                <div class="site-preview-frame-wrap">
                    <div class="site-preview-frame-toolbar">
                        <span class="site-preview-frame-url">${LaunchLocal.escapeHtml(previewUrl)}</span>
                        <a class="btn btn-ghost btn-sm" href="${LaunchLocal.escapeHtml(previewUrl)}" target="_blank" rel="noopener">Open in new tab &#8599;</a>
                    </div>
                    <iframe class="site-preview-frame" src="${LaunchLocal.escapeHtml(previewUrl)}" title="Site preview" loading="lazy" sandbox="allow-scripts"></iframe>
                </div>
            `
            : `
                <div class="alert alert-info" style="margin-bottom:16px;">
                    <span>&#8505;</span>
                    <span>No upload detected yet. Run the prompt in Claude Code — files auto-upload when the session ends.</span>
                </div>
                <div class="site-preview-placeholder large">
                    <span>&#128187;</span>
                    <p>${LaunchLocal.escapeHtml(s.businessName)}</p>
                    <small>${LaunchLocal.escapeHtml(s.industry || '')} template &mdash; ${LaunchLocal.escapeHtml(s.templateUsed || 'default')}</small>
                </div>
            `;

        document.getElementById('qa-modal-body').innerHTML = `
            ${previewBlock}

            <div class="detail-grid" style="margin-top:16px;">
                <div class="detail-section">
                    <div class="detail-row"><span>Template</span><span>${LaunchLocal.escapeHtml(s.templateUsed || '—')}</span></div>
                    <div class="detail-row"><span>PageSpeed Score</span><span>${s.pageSpeedScore || '—'}</span></div>
                    <div class="detail-row"><span>Mobile Score</span><span>${s.mobileScore || '—'}</span></div>
                    <div class="detail-row"><span>QA Status</span><span>
                        <span class="badge ${s.qaStatus === 'approved' ? 'badge-success' : s.qaStatus === 'revision-needed' ? 'badge-danger' : 'badge-warning'}">${LaunchLocal.escapeHtml(s.qaStatus || '—')}</span>
                    </span></div>
                </div>
            </div>

            ${s.qaFeedback ? `
                <div class="detail-section" style="margin-top:12px;">
                    <h4 class="detail-section-title">Previous Feedback</h4>
                    <p class="text-sm">${LaunchLocal.escapeHtml(s.qaFeedback)}</p>
                </div>
            ` : ''}

            <div class="form-group" style="margin-top:16px;">
                <label class="form-label">QA Notes / Revision Instructions</label>
                <textarea class="form-input" id="qa-feedback" rows="3"
                    placeholder="Describe any issues or approval notes..."></textarea>
            </div>
        `;

        // Set existing feedback via DOM to avoid attribute-context XSS
        const fbEl = document.getElementById('qa-feedback');
        if (fbEl) fbEl.value = s.qaFeedback || '';

        document.getElementById('qa-modal-footer').innerHTML = `
            <button class="btn btn-danger btn-sm" id="qa-revision-btn" data-id="${s.id}">Request Revision</button>
            <button class="btn btn-success" id="qa-approve-btn" data-id="${s.id}">Approve Site</button>
            <button class="btn btn-secondary" id="qa-close-btn">Close</button>
        `;

        const close = () => modal.classList.remove('open');
        document.getElementById('qa-modal-close').onclick = close;
        document.getElementById('qa-close-btn').onclick = close;

        document.getElementById('qa-approve-btn').addEventListener('click', async () => {
            const feedback = document.getElementById('qa-feedback').value;
            await this.updateQAStatus(s.id, 'approved', feedback);
            close();
        });

        document.getElementById('qa-revision-btn').addEventListener('click', async () => {
            const feedback = document.getElementById('qa-feedback').value.trim();
            if (!feedback) {
                LaunchLocal.toast('Please add revision notes before requesting a revision.', 'warning');
                return;
            }
            await this.updateQAStatus(s.id, 'revision-needed', feedback);
            close();
        });

        modal.classList.add('open');
    },

    async updateQAStatus(id, status, feedback) {
        try {
            const s = this.sites.find(x => x.id === id);
            if (!s) return;

            await DB.updateDoc('sites', id, {
                qaStatus: status,
                qaFeedback: feedback,
                qaReviewer: LaunchLocal.currentUser?.uid,
                qaDate: firebase.firestore.FieldValue.serverTimestamp()
            });

            await DB.logActivity('qa_updated', 'sites',
                `${status === 'approved' ? 'approved' : 'requested revision for'} ${s.businessName}`,
                { status, feedback }, id);

            // Auto-update prospect to site-ready when approved
            if (status === 'approved' && s.prospectId) {
                try { await DB.updateDoc('prospects', s.prospectId, { status: 'site-ready' }); } catch {}
            }

            s.qaStatus = status;
            s.qaFeedback = feedback;
            this.renderContent();
            LaunchLocal.toast(
                status === 'approved' ? `${s.businessName} approved — prospect marked site-ready.` : `Revision requested for ${s.businessName}.`,
                status === 'approved' ? 'success' : 'warning'
            );
        } catch {
            LaunchLocal.toast('Failed to update QA status.', 'error');
        }
    },

    // ----- Generate flow -----

    async openRegenerate(siteId) {
        const site = this.sites.find(x => x.id === siteId);
        if (!site) return;

        // Warn if this would wipe real progress
        const hasProgress = site.qaStatus === 'approved'
            || site.status === 'files-uploaded'
            || site.filesUploadedAt;
        if (hasProgress) {
            const ok = window.confirm(
                `This site already has a built/approved version. Regenerating will reset it to a new prompt and clear QA status. Continue?`
            );
            if (!ok) return;
        }

        // Load the underlying prospect for display context
        let prospect = this.prospects.find(p => p.id === site.prospectId);
        if (!prospect && site.prospectId) {
            try {
                prospect = await DB.getDoc('prospects', site.prospectId);
            } catch { /* non-blocking */ }
        }
        if (!prospect) {
            prospect = {
                id: site.prospectId || null,
                businessName: site.businessName || '',
                industry: site.industry || ''
            };
        }

        this.regeneratingSiteId = site.id;

        // Ensure the modal is visible, then reuse the standard form
        document.getElementById('generate-modal').classList.add('open');
        this.openGenerateForm(prospect, site);
    },

    openGenerateForm(prospect, existingSite = null) {
        this.selectedProspect = prospect;
        const title = document.getElementById('generate-modal-title');
        const body = document.getElementById('generate-modal-body');
        const footer = document.getElementById('generate-modal-footer');

        const isRegen = !!existingSite;
        const source = isRegen && existingSite.formData ? existingSite.formData : null;

        title.textContent = isRegen
            ? `Regenerate Site Prompt — ${prospect.businessName}`
            : `Generate Site Prompt — ${prospect.businessName}`;

        // Map the prospect's industry (or existing template) to a default
        const defaultTemplate = isRegen && existingSite.templateUsed
            ? existingSite.templateUsed.split('-')[0]
            : this.guessTemplate(prospect.industry);

        const templateOptions = PromptGenerator.TEMPLATES.map(t =>
            `<option value="${t}"${t === defaultTemplate ? ' selected' : ''}>${PromptGenerator.TEMPLATE_LABELS[t]}</option>`
        ).join('');

        const voices = ['Friendly', 'Professional', 'Bold', 'Traditional', 'Modern', 'Warm', 'Minimal'];
        const pages  = ['Home', 'About', 'Services', 'Menu / Pricing', 'Gallery', 'Contact', 'Reviews', 'FAQ'];
        const upsells = [
            'Booking widget integration',
            'Review funnel automation',
            'Contact form automation',
            'SEO package (Google Business optimization)',
            'Social media content setup',
            'Email newsletter setup'
        ];

        body.innerHTML = `
            <form id="generate-form" class="generate-form">

                <div class="generate-form-section">
                    <h4 class="detail-section-title">Template</h4>
                    <div class="form-group">
                        <label class="form-label" for="gf-template">Industry template</label>
                        <select class="form-input" id="gf-template" name="template" required>${templateOptions}</select>
                        <small class="form-hint">Choose the template whose guidance best fits this business.</small>
                    </div>
                </div>

                <div class="generate-form-section">
                    <h4 class="detail-section-title">Business Info</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label" for="gf-businessName">Business name</label>
                            <input class="form-input" id="gf-businessName" name="businessName" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="gf-address">Address</label>
                            <input class="form-input" id="gf-address" name="address">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label" for="gf-phone">Phone</label>
                            <input class="form-input" id="gf-phone" name="phone">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="gf-email">Email</label>
                            <input class="form-input" id="gf-email" name="email">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label" for="gf-website">Existing website (if any)</label>
                            <input class="form-input" id="gf-website" name="website" placeholder="https://...">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="gf-foundedYear">Founded year (optional)</label>
                            <input type="number" class="form-input" id="gf-foundedYear" name="foundedYear"
                                min="1800" max="2026" placeholder="e.g. 1987">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label" for="gf-googleRating">Google rating</label>
                            <input class="form-input" id="gf-googleRating" name="googleRating" placeholder="e.g. 4.8">
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="gf-reviewCount">Review count</label>
                            <input class="form-input" id="gf-reviewCount" name="reviewCount" placeholder="e.g. 142">
                        </div>
                    </div>
                    <details class="form-advanced">
                        <summary>Advanced: override industry label sent to Claude</summary>
                        <div class="form-group">
                            <label class="form-label" for="gf-industry">Industry (as told to Claude)</label>
                            <input class="form-input" id="gf-industry" name="industry" placeholder="Defaults to the template label above">
                        </div>
                    </details>
                </div>

                <div class="generate-form-section">
                    <h4 class="detail-section-title">Site Content</h4>
                    <div class="form-group">
                        <div class="form-label-row">
                            <label class="form-label" for="gf-services">Primary services / offerings (one per line)</label>
                            <label class="ai-generate-toggle">
                                <input type="checkbox" name="servicesAI" id="gf-servicesAI"> Let AI decide
                            </label>
                        </div>
                        <textarea class="form-input" id="gf-services" name="services" rows="4" placeholder="Haircut &amp; style&#10;Color &amp; balayage&#10;Bridal styling"></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Hours</label>
                        <fieldset class="hours-fieldset" id="gf-hoursFieldset">
                            ${HOURS_DAYS.map(d => `
                                <div class="hours-row" data-day="${d.key}">
                                    <span class="hours-day">${d.label}</span>
                                    <input type="time" name="hours_${d.key}_open"  value="09:00">
                                    <span class="hours-sep">&ndash;</span>
                                    <input type="time" name="hours_${d.key}_close" value="17:00">
                                    <label class="hours-closed-toggle">
                                        <input type="checkbox" name="hours_${d.key}_closed"> Closed
                                    </label>
                                </div>
                            `).join('')}
                        </fieldset>
                    </div>
                    <div class="form-group">
                        <div class="form-label-row">
                            <label class="form-label" for="gf-heroAngle">Hero angle (1-2 sentence lead story)</label>
                            <label class="ai-generate-toggle">
                                <input type="checkbox" name="heroAngleAI" id="gf-heroAngleAI"> Let AI decide
                            </label>
                        </div>
                        <textarea class="form-input" id="gf-heroAngle" name="heroAngle" rows="2" placeholder="Wood-fired pizza, handmade pasta, twelve tables downtown."></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Brand voice (pick any that fit)</label>
                        <div class="chip-group">
                            ${voices.map(v => `
                                <label class="option-chip">
                                    <input type="checkbox" name="brandVoice" value="${v}"> ${v}
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="form-label-row">
                            <label class="form-label">Suggested palette</label>
                            <button type="button" class="palette-reset-btn" id="gf-paletteReset">Reset to auto-suggest</button>
                        </div>
                        <p class="palette-sub" id="gf-paletteSub">Auto-picked from industry + voice. Click a swatch to use it.</p>
                        <div class="palette-suggestions" id="gf-paletteSuggestions"></div>
                        <details class="form-override" id="gf-paletteOverride">
                            <summary>Override palette</summary>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label" for="gf-primaryColor">Primary color</label>
                                    <div class="color-picker-group">
                                        <input type="color" id="gf-primaryColor" name="primaryColor" value="#1A73E8">
                                        <input type="text" class="form-input color-hex" id="gf-primaryColorHex" value="#1A73E8">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="form-label" for="gf-accentColor">Accent color</label>
                                    <div class="color-picker-group">
                                        <input type="color" id="gf-accentColor" name="accentColor" value="#34A853">
                                        <input type="text" class="form-input color-hex" id="gf-accentColorHex" value="#34A853">
                                    </div>
                                </div>
                            </div>
                        </details>
                    </div>
                    <div class="form-group">
                        <label style="display:flex;align-items:center;gap:8px;font-size:var(--font-size-sm);cursor:pointer;color:var(--text-primary);">
                            <input type="checkbox" id="gf-themeToggle" name="themeToggle" style="cursor:pointer;">
                            <span>Include light/dark mode toggle on the site</span>
                        </label>
                        <small class="form-hint">When on, the generated site ships with both palettes and a working header switcher (persists in localStorage, respects prefers-color-scheme).</small>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Pages needed</label>
                        <div class="chip-group">
                            ${pages.map(p => `
                                <label class="option-chip">
                                    <input type="checkbox" name="pagesNeeded" value="${p}"${['Home','Services','Contact'].includes(p) ? ' checked' : ''}> ${p}
                                </label>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="generate-form-section">
                    <h4 class="detail-section-title">Upsells &amp; Notes (optional)</h4>
                    <div class="form-group">
                        <label class="form-label">Upsells to flag in the site prompt</label>
                        <div class="chip-group chip-group-stacked">
                            ${upsells.map(u => `
                                <label class="option-chip">
                                    <input type="checkbox" name="upsells" value="${LaunchLocal.escapeHtml(u)}"> ${LaunchLocal.escapeHtml(u)}
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="gf-notes">Additional notes / special requests</label>
                        <textarea class="form-input" id="gf-notes" name="notes" rows="3" placeholder="Owner wants to emphasize third-generation family business, avoid stock imagery, highlight their patio."></textarea>
                    </div>
                </div>
            </form>
        `;

        footer.innerHTML = `
            <button class="btn btn-secondary" id="generate-back-btn">${isRegen ? 'Cancel' : '&larr; Back'}</button>
            <button class="btn btn-primary" id="generate-submit-btn">Generate Prompt</button>
        `;

        // Reset per-form state
        this.paletteOverridden = false;
        this.upsellsTouched = false;
        this.paletteShortlist = [];
        this.cachedServicesValue = '';
        this.cachedHeroAngleValue = '';

        // Set pre-fill values programmatically to avoid attribute-context XSS
        // (escapeHtml doesn't escape double-quotes; value="..." is attack surface)
        const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v == null ? '' : String(v); };

        // Business basics — prospect on fresh, saved formData on regen.
        // Industry override field stays blank on fresh (falls back to template label at submit).
        setVal('gf-businessName', source ? source.businessName : prospect.businessName);
        setVal('gf-industry',     source ? source.industry    : '');
        setVal('gf-address',      source ? source.address     : prospect.address);
        setVal('gf-phone',        source ? source.phone       : prospect.phone);
        setVal('gf-email',        source ? source.email       : prospect.email);
        setVal('gf-website',      source ? source.website     : prospect.website);
        setVal('gf-googleRating', source ? source.googleRating: prospect.googleRating);
        setVal('gf-reviewCount',  source ? source.reviewCount : prospect.reviewCount);
        setVal('gf-foundedYear',  source ? source.foundedYear : '');

        const form = document.getElementById('generate-form');

        if (source) {
            // Brand voice, pages, upsells from saved CSV lists
            const restoreChecks = (name, csv) => {
                if (!csv) return;
                const wanted = new Set(csv.split(',').map(x => x.trim()).filter(Boolean));
                form.querySelectorAll(`input[name="${name}"]`).forEach(inp => {
                    inp.checked = wanted.has(inp.value);
                });
            };
            restoreChecks('brandVoice',  source.brandVoice);
            restoreChecks('pagesNeeded', source.pagesNeeded);
            restoreChecks('upsells',     source.upsells);
            this.upsellsTouched = true; // regen — don't clobber saved upsells on template change

            setVal('gf-services',  source.services);
            setVal('gf-heroAngle', source.heroAngle);
            setVal('gf-notes',     source.notes);
            this.cachedServicesValue  = source.services  || '';
            this.cachedHeroAngleValue = source.heroAngle || '';

            // AI-generate flags (saved as booleans in formData)
            const servicesAI = form.elements.servicesAI;
            const heroAngleAI = form.elements.heroAngleAI;
            if (servicesAI)  servicesAI.checked  = !!source.servicesAI;
            if (heroAngleAI) heroAngleAI.checked = !!source.heroAngleAI;

            // Theme toggle (saved as boolean)
            const themeToggleEl = form.elements.themeToggle;
            if (themeToggleEl) themeToggleEl.checked = !!source.themeToggle;

            // Structured hours
            if (source.hoursStructured) this.applyStructuredHoursToForm(form, source.hoursStructured);
        } else {
            // Fresh open — seed upsell defaults for the guessed template
            this.applyDefaultUpsells(form, defaultTemplate);
        }

        // Palette auto-suggest. Order matters: template dropdown + voice
        // checkboxes are already set above, so mood resolves correctly.
        const savedPrimary = source && source.primaryColor ? source.primaryColor : null;
        const savedAccent  = source && source.accentColor  ? source.accentColor  : null;
        this.applyPaletteAutoSuggest(form, { savedPrimary, savedAccent });

        // Apply AI-generate dim state after cached values are in place
        this.refreshAIFieldState(form, 'services',  'gf-services',  'gf-servicesAI');
        this.refreshAIFieldState(form, 'heroAngle', 'gf-heroAngle', 'gf-heroAngleAI');

        // Hours closed-toggle: disable time inputs when closed
        this.bindHoursClosedToggles(form);

        // Auto-open disclosures that contain non-default state, so the operator
        // sees the override rather than hidden surprises.
        if (source && source.industry) {
            form.querySelector('.form-advanced')?.setAttribute('open', '');
        }
        if (this.paletteOverridden) {
            form.querySelector('#gf-paletteOverride')?.setAttribute('open', '');
        }

        document.getElementById('generate-back-btn').onclick = () => {
            // The Sites tab opens this form directly from a prospect card,
            // so Back/Cancel simply closes the modal.
            document.getElementById('generate-modal').classList.remove('open');
            this.regeneratingSiteId = null;
        };
        document.getElementById('generate-back-btn').textContent = 'Cancel';
        document.getElementById('generate-submit-btn').textContent = isRegen ? 'Regenerate Prompt' : 'Generate Prompt';
        document.getElementById('generate-submit-btn').onclick = () => this.onGenerateSubmit();

        // Sync color inputs with their hex text twins
        this.bindColorSync('gf-primaryColor', 'gf-primaryColorHex');
        this.bindColorSync('gf-accentColor', 'gf-accentColorHex');

        // Live re-suggest on template/voice change; track upsell manual touches;
        // flip override flag when color pickers are used directly.
        this.bindFormDynamics(form);
    },

    // --- Palette helpers ---

    resolveMood(form) {
        const checked = Array.from(form.querySelectorAll('input[name="brandVoice"]:checked')).map(i => i.value);
        for (const v of checked) {
            if (VOICE_MOOD_MAP[v]) return VOICE_MOOD_MAP[v];
        }
        return 'warm';
    },

    hexEq(a, b) {
        return typeof a === 'string' && typeof b === 'string' && a.toLowerCase() === b.toLowerCase();
    },

    applyPaletteAutoSuggest(form, { savedPrimary = null, savedAccent = null } = {}) {
        const template = form.elements.template.value;
        const mood = this.resolveMood(form);
        const shortlist = (PALETTE_LIBRARY[template] && PALETTE_LIBRARY[template][mood]) || [];
        this.paletteShortlist = shortlist;

        let selectedIdx = null;

        if (savedPrimary || savedAccent) {
            // Try to find an exact match in the new shortlist
            const idx = shortlist.findIndex(p =>
                this.hexEq(p.primary, savedPrimary) && this.hexEq(p.accent, savedAccent)
            );
            if (idx >= 0) {
                selectedIdx = idx;
                this.paletteOverridden = false;
                // Set color inputs from the matched preset (use stored-case values)
                this.writeColorsToForm(form, shortlist[idx].primary, shortlist[idx].accent);
            } else {
                this.paletteOverridden = true;
                // Keep the saved colors on the pickers
                this.writeColorsToForm(form, savedPrimary, savedAccent);
            }
        } else if (!this.paletteOverridden && shortlist.length > 0) {
            selectedIdx = 0;
            this.writeColorsToForm(form, shortlist[0].primary, shortlist[0].accent);
        }

        this.renderPaletteSwatches(form, selectedIdx);
        this.refreshPaletteResetLink(form);
    },

    renderPaletteSwatches(form, selectedIdx) {
        const container = form.querySelector('#gf-paletteSuggestions');
        if (!container) return;
        const shortlist = this.paletteShortlist;
        if (!shortlist || shortlist.length === 0) {
            container.innerHTML = '<p class="palette-sub">No presets for this combination — use "Override palette" below.</p>';
            return;
        }
        container.innerHTML = shortlist.map((p, i) => `
            <button type="button" class="palette-card${i === selectedIdx ? ' selected' : ''}" data-idx="${i}">
                <div class="palette-swatches">
                    <span class="palette-swatch" style="background:${p.primary};"></span>
                    <span class="palette-swatch" style="background:${p.accent};"></span>
                </div>
                <span class="palette-name">${LaunchLocal.escapeHtml(p.name)}</span>
            </button>
        `).join('');
        container.querySelectorAll('.palette-card').forEach(card => {
            card.addEventListener('click', () => {
                const idx = parseInt(card.getAttribute('data-idx'), 10);
                const p = this.paletteShortlist[idx];
                if (!p) return;
                this.writeColorsToForm(form, p.primary, p.accent);
                container.querySelectorAll('.palette-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                // Swatch click is a curated pick — does NOT set override flag.
            });
        });
    },

    writeColorsToForm(form, primary, accent) {
        // Programmatic .value = x does not fire 'input', so we won't trip the
        // override listener. But we must manually sync the hex twin.
        const p  = form.querySelector('#gf-primaryColor');
        const pH = form.querySelector('#gf-primaryColorHex');
        const a  = form.querySelector('#gf-accentColor');
        const aH = form.querySelector('#gf-accentColorHex');
        if (p  && primary) p.value  = primary;
        if (pH && primary) pH.value = primary;
        if (a  && accent)  a.value  = accent;
        if (aH && accent)  aH.value = accent;
    },

    refreshPaletteResetLink(form) {
        const link = form.querySelector('#gf-paletteReset');
        if (!link) return;
        link.classList.toggle('visible', !!this.paletteOverridden);
    },

    // --- Upsell defaults ---

    applyDefaultUpsells(form, template) {
        const defaults = new Set(DEFAULT_UPSELLS_BY_TEMPLATE[template] || []);
        form.querySelectorAll('input[name="upsells"]').forEach(inp => {
            inp.checked = defaults.has(inp.value);
        });
    },

    // --- Structured hours ---

    applyStructuredHoursToForm(form, structured) {
        HOURS_DAYS.forEach(d => {
            const entry = structured[d.key] || {};
            const openEl   = form.elements[`hours_${d.key}_open`];
            const closeEl  = form.elements[`hours_${d.key}_close`];
            const closedEl = form.elements[`hours_${d.key}_closed`];
            if (openEl   && entry.open)             openEl.value   = entry.open;
            if (closeEl  && entry.close)            closeEl.value  = entry.close;
            if (closedEl) closedEl.checked = !!entry.closed;
        });
    },

    bindHoursClosedToggles(form) {
        HOURS_DAYS.forEach(d => {
            const closedEl = form.elements[`hours_${d.key}_closed`];
            const openEl   = form.elements[`hours_${d.key}_open`];
            const closeEl  = form.elements[`hours_${d.key}_close`];
            if (!closedEl || !openEl || !closeEl) return;
            const sync = () => {
                const closed = closedEl.checked;
                openEl.disabled = closed;
                closeEl.disabled = closed;
            };
            closedEl.addEventListener('change', sync);
            sync();
        });
    },

    readStructuredHours(form) {
        const out = {};
        HOURS_DAYS.forEach(d => {
            const closed = !!form.elements[`hours_${d.key}_closed`]?.checked;
            out[d.key] = {
                open:   closed ? '' : (form.elements[`hours_${d.key}_open`]?.value   || ''),
                close:  closed ? '' : (form.elements[`hours_${d.key}_close`]?.value  || ''),
                closed
            };
        });
        return out;
    },

    formatHours12(hhmm) {
        if (!hhmm) return '';
        const [hStr, mStr] = hhmm.split(':');
        let h = parseInt(hStr, 10);
        const m = mStr || '00';
        const suffix = h >= 12 ? 'PM' : 'AM';
        h = h % 12; if (h === 0) h = 12;
        return m === '00' ? `${h}:00 ${suffix}` : `${h}:${m} ${suffix}`;
    },

    hoursHumanReadable(structured) {
        // Collapse runs of adjacent matching days.
        const rows = HOURS_DAYS.map(d => ({ key: d.key, label: d.label, ...structured[d.key] }));
        const signature = (r) => r.closed ? 'CLOSED' : `${r.open}|${r.close}`;
        const lines = [];
        let i = 0;
        while (i < rows.length) {
            const sig = signature(rows[i]);
            let j = i;
            while (j + 1 < rows.length && signature(rows[j + 1]) === sig) j++;
            const start = rows[i].label;
            const end   = rows[j].label;
            const range = i === j ? start : `${start}\u2013${end}`;
            if (rows[i].closed) {
                lines.push(`${range} Closed`);
            } else if (rows[i].open && rows[i].close) {
                lines.push(`${range} ${this.formatHours12(rows[i].open)} \u2013 ${this.formatHours12(rows[i].close)}`);
            }
            i = j + 1;
        }
        return lines.join('\n');
    },

    hoursJsonLd(structured) {
        const entries = HOURS_DAYS
            .filter(d => !structured[d.key].closed && structured[d.key].open && structured[d.key].close)
            .map(d => ({
                '@type': 'OpeningHoursSpecification',
                'dayOfWeek': d.full,
                'opens':  structured[d.key].open,
                'closes': structured[d.key].close
            }));
        return JSON.stringify(entries, null, 2);
    },

    // --- AI-generate toggle ---

    refreshAIFieldState(form, fieldKey, textareaId, checkboxId) {
        const ta = form.querySelector('#' + textareaId);
        const cb = form.querySelector('#' + checkboxId);
        if (!ta || !cb) return;
        if (cb.checked) {
            // Cache current text (if any) before clearing for display
            if (ta.value.trim()) {
                if (fieldKey === 'services')  this.cachedServicesValue  = ta.value;
                if (fieldKey === 'heroAngle') this.cachedHeroAngleValue = ta.value;
            }
            ta.value = '';
            ta.disabled = true;
            ta.classList.add('is-ai-generated');
        } else {
            ta.disabled = false;
            ta.classList.remove('is-ai-generated');
            // Restore cached value
            const cached = fieldKey === 'services' ? this.cachedServicesValue : this.cachedHeroAngleValue;
            if (cached && !ta.value) ta.value = cached;
        }
    },

    // --- Dynamics: listeners for live re-suggest, override detection ---

    bindFormDynamics(form) {
        const templateEl = form.elements.template;
        templateEl.addEventListener('change', () => {
            if (!this.upsellsTouched) this.applyDefaultUpsells(form, templateEl.value);
            this.applyPaletteAutoSuggest(form);
        });

        form.querySelectorAll('input[name="brandVoice"]').forEach(inp => {
            inp.addEventListener('change', () => this.applyPaletteAutoSuggest(form));
        });

        form.querySelectorAll('input[name="upsells"]').forEach(inp => {
            inp.addEventListener('change', () => { this.upsellsTouched = true; });
        });

        // Direct edits to color picker / hex inside Override disclosure → override
        const flagOverride = () => {
            this.paletteOverridden = true;
            form.querySelectorAll('.palette-card').forEach(c => c.classList.remove('selected'));
            this.refreshPaletteResetLink(form);
        };
        ['gf-primaryColor', 'gf-primaryColorHex', 'gf-accentColor', 'gf-accentColorHex'].forEach(id => {
            const el = form.querySelector('#' + id);
            if (el) el.addEventListener('input', flagOverride);
        });

        const resetBtn = form.querySelector('#gf-paletteReset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.paletteOverridden = false;
                this.applyPaletteAutoSuggest(form);
            });
        }

        // AI-generate toggles
        const servicesCb = form.querySelector('#gf-servicesAI');
        if (servicesCb) {
            servicesCb.addEventListener('change', () => this.refreshAIFieldState(form, 'services', 'gf-services', 'gf-servicesAI'));
        }
        const heroCb = form.querySelector('#gf-heroAngleAI');
        if (heroCb) {
            heroCb.addEventListener('change', () => this.refreshAIFieldState(form, 'heroAngle', 'gf-heroAngle', 'gf-heroAngleAI'));
        }

        // Cache textarea content as operator types (so toggling AI on/off doesn't lose it)
        const servicesTa = form.querySelector('#gf-services');
        if (servicesTa) servicesTa.addEventListener('input', () => { if (!servicesTa.disabled) this.cachedServicesValue = servicesTa.value; });
        const heroTa = form.querySelector('#gf-heroAngle');
        if (heroTa) heroTa.addEventListener('input', () => { if (!heroTa.disabled) this.cachedHeroAngleValue = heroTa.value; });
    },

    bindColorSync(colorId, textId) {
        const c = document.getElementById(colorId);
        const t = document.getElementById(textId);
        if (!c || !t) return;
        c.addEventListener('input', () => { t.value = c.value; });
        t.addEventListener('input', () => {
            if (/^#[0-9a-fA-F]{6}$/.test(t.value)) c.value = t.value;
        });
    },

    guessTemplate(industry) {
        if (!industry) return 'retail';
        const i = industry.toLowerCase();
        if (/restaurant|cafe|caf\u00e9|bistro|diner|bakery|pizzeria|pub|bar|grill|food|eatery/.test(i)) return 'restaurant';
        if (/plumb|electric|hvac|roof|contract|handy|landscap|paint|lock|construct|renovat|mechanic|auto|garage/.test(i)) return 'tradesperson';
        if (/salon|spa|barber|nail|lash|brow|esthet|massage|tattoo|tan|hair|beauty/.test(i)) return 'salon';
        return 'retail';
    },

    async onGenerateSubmit() {
        const prospect = this.selectedProspect;
        if (!prospect) return;

        const submitBtn = document.getElementById('generate-submit-btn');
        const backBtn = document.getElementById('generate-back-btn');
        const originalLabel = submitBtn.textContent;
        submitBtn.disabled = true;
        backBtn.disabled = true;
        submitBtn.textContent = 'Generating...';

        try {
            const form = document.getElementById('generate-form');

            // Required
            const businessName = form.elements.businessName.value.trim();
            if (!businessName) {
                LaunchLocal.toast('Business name is required.', 'warning');
                submitBtn.disabled = false;
                backBtn.disabled = false;
                submitBtn.textContent = originalLabel;
                return;
            }

            // Compute a stable folder slug. On regen we preserve the original
            // slug so the Claude Code output path doesn't drift mid-project.
            // On fresh generate we auto-slug from businessName and make it
            // unique against any existing sites.
            const isRegen = !!this.regeneratingSiteId;
            let clientSlug = '';
            if (isRegen) {
                const existing = this.sites.find(s => s.id === this.regeneratingSiteId);
                clientSlug = existing?.clientSlug || existing?.formData?.clientSlug || '';
            }
            if (!clientSlug) {
                const base = LaunchLocal.Slug.fromBusinessName(businessName);
                if (!base) {
                    LaunchLocal.toast('Business name must contain letters or numbers.', 'warning');
                    submitBtn.disabled = false;
                    backBtn.disabled = false;
                    submitBtn.textContent = originalLabel;
                    return;
                }
                const takenSlugs = new Set(
                    this.sites
                        .filter(s => s.id !== this.regeneratingSiteId)
                        .map(s => s.clientSlug || s.formData?.clientSlug)
                        .filter(Boolean)
                );
                clientSlug = LaunchLocal.Slug.unique(base, takenSlugs);
            }

            const template = form.elements.template.value;
            const checkedValues = (name) => Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map(i => i.value);

            const servicesAI  = !!form.elements.servicesAI?.checked;
            const heroAngleAI = !!form.elements.heroAngleAI?.checked;
            const themeToggle = !!form.elements.themeToggle?.checked;
            const rawServices  = servicesAI  ? (this.cachedServicesValue  || '') : form.elements.services.value.trim();
            const rawHeroAngle = heroAngleAI ? (this.cachedHeroAngleValue || '') : form.elements.heroAngle.value.trim();

            const rawIndustry = form.elements.industry.value.trim();
            const resolvedIndustry = rawIndustry || PromptGenerator.TEMPLATE_LABELS[template] || '';

            const hoursStructured = this.readStructuredHours(form);
            const hoursHuman      = this.hoursHumanReadable(hoursStructured);
            const hoursJsonLd     = this.hoursJsonLd(hoursStructured);

            const foundedYearRaw = form.elements.foundedYear.value.trim();
            const foundedYear    = foundedYearRaw ? String(parseInt(foundedYearRaw, 10) || '') : '';

            // Stored on the site record — raw operator inputs, so regen restores the
            // original intent (blank override, cached textarea, AI flag, etc.).
            const formData = {
                prospectId:       prospect.id,
                clientSlug,
                businessName,
                industry:         rawIndustry,
                address:          form.elements.address.value.trim(),
                phone:            form.elements.phone.value.trim(),
                email:            form.elements.email.value.trim(),
                website:          form.elements.website.value.trim(),
                googleRating:     form.elements.googleRating.value.trim(),
                reviewCount:      form.elements.reviewCount.value.trim(),
                foundedYear,
                services:         rawServices,
                servicesAI,
                heroAngle:        rawHeroAngle,
                heroAngleAI,
                themeToggle,
                hoursStructured,
                brandVoice:       checkedValues('brandVoice').join(', '),
                primaryColor:     form.elements.primaryColor.value,
                accentColor:      form.elements.accentColor.value,
                pagesNeeded:      checkedValues('pagesNeeded').join(', '),
                upsells:          checkedValues('upsells').join(', '),
                notes:            form.elements.notes.value.trim()
            };

            // Prompt payload — inject AI directives when flags set; resolve industry
            // fallback; flatten structured hours into the human-readable placeholder.
            const promptPayload = {
                ...formData,
                industry: resolvedIndustry,
                services:  servicesAI  ? AI_DIRECTIVE_SERVICES : rawServices,
                heroAngle: heroAngleAI ? AI_DIRECTIVE_HERO     : rawHeroAngle,
                hours:     hoursHuman,
                hoursJsonLd,
                themeModeGuidance: themeToggle ? THEME_MODE_BOTH : THEME_MODE_LIGHT_ONLY
            };

            const promptText = await PromptGenerator.generate(template, promptPayload);
            const templateUsed = PromptGenerator.templateIdentifier(template);

            let siteId;
            if (isRegen) {
                siteId = this.regeneratingSiteId;
                await DB.updateDoc('sites', siteId, {
                    clientSlug,
                    businessName,
                    industry:     resolvedIndustry,
                    status:       'prompt-generated',
                    qaStatus:     null,
                    qaFeedback:   null,
                    qaReviewer:   null,
                    qaDate:       null,
                    filesUploadedAt: null,
                    previewVersion:  null,
                    fileCount:       null,
                    promptText,
                    promptGeneratedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    formData,
                    templateUsed
                });
            } else {
                siteId = await DB.addDoc('sites', {
                    prospectId:   prospect.id,
                    clientSlug,
                    businessName,
                    industry:     resolvedIndustry,
                    status:       'prompt-generated',
                    qaStatus:     null,
                    promptText,
                    promptGeneratedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    formData,
                    templateUsed
                });
            }

            // Bump prospect back to site-queued on fresh and regen runs
            if (prospect.id) {
                try {
                    await DB.updateDoc('prospects', prospect.id, { status: 'site-queued' });
                } catch (err) {
                    console.warn('Failed to update prospect status:', err);
                }
            }

            await DB.logActivity(
                isRegen ? 'prompt_regenerated' : 'prompt_generated',
                'sites',
                `${isRegen ? 'Regenerated' : 'Generated'} site prompt for ${businessName} (${templateUsed})`,
                { prospectId: prospect.id, template, templateUsed },
                siteId
            );

            this.regeneratingSiteId = null;

            // Refresh local state and UI. Skip the background probe: a fresh
            // prompt has no files yet, and on regenerate the old files would
            // wrongly flip status back to files-uploaded before the user has
            // even run the new prompt.
            await this.loadSites({ skipProbe: true });
            this.renderContent();

            document.getElementById('generate-modal').classList.remove('open');
            this.openPromptResult(siteId);
            LaunchLocal.toast(
                `Prompt ${isRegen ? 'regenerated' : 'generated'} for ${businessName}.`,
                'success'
            );

        } catch (err) {
            console.error('onGenerateSubmit:', err);
            LaunchLocal.toast(err.message || 'Failed to generate prompt.', 'error');
            this.regeneratingSiteId = null;
            submitBtn.disabled = false;
            backBtn.disabled = false;
            submitBtn.textContent = originalLabel;
        }
    },

    openPromptResult(siteId) {
        const s = this.sites.find(x => x.id === siteId);
        if (!s || !s.promptText) {
            LaunchLocal.toast('No prompt found for this site.', 'warning');
            return;
        }

        const modal  = document.getElementById('prompt-result-modal');
        const body   = document.getElementById('prompt-result-body');
        const footer = document.getElementById('prompt-result-footer');

        body.innerHTML = `
            <div class="alert alert-info" style="margin-bottom:var(--space-3);">
                <span>&#9432;</span>
                <span>Copy this prompt, then run <code>claude</code> from the <code>Launch Local</code> repo root and paste it. Claude builds at <code>Client-Sites/${LaunchLocal.escapeHtml(s.clientSlug || s.formData?.clientSlug || s.prospectId || 'unknown')}/</code> — files auto-upload when the session ends, and this card flips to "Awaiting QA" within ~10s.</span>
            </div>
            <div class="prompt-output-wrap">
                <button class="btn btn-primary btn-sm prompt-copy-btn" id="prompt-copy-btn">Copy to Clipboard</button>
                <pre class="prompt-output" id="prompt-output-pre">${LaunchLocal.escapeHtml(s.promptText)}</pre>
            </div>
        `;

        footer.innerHTML = `
            <button class="btn btn-secondary" id="prompt-result-close-btn">Close</button>
        `;

        document.getElementById('prompt-result-close-btn').onclick = () => modal.classList.remove('open');

        document.getElementById('prompt-copy-btn').onclick = async () => {
            try {
                await navigator.clipboard.writeText(s.promptText);
                LaunchLocal.toast('Prompt copied to clipboard.', 'success');
                const btn = document.getElementById('prompt-copy-btn');
                if (btn) {
                    btn.textContent = 'Copied!';
                    setTimeout(() => { if (btn) btn.textContent = 'Copy to Clipboard'; }, 2000);
                }
            } catch {
                // Fallback: select the text so user can Ctrl+C
                const pre = document.getElementById('prompt-output-pre');
                if (pre) {
                    const range = document.createRange();
                    range.selectNodeContents(pre);
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);
                    LaunchLocal.toast('Clipboard unavailable. Text selected — press Ctrl+C.', 'warning');
                }
            }
        };

        modal.classList.add('open');
    },

    bindEvents(container) {
        const closeGenerate = () => {
            document.getElementById('generate-modal').classList.remove('open');
            this.regeneratingSiteId = null;
        };

        container.querySelector('#qa-modal')?.addEventListener('click', e => {
            if (e.target.id === 'qa-modal') e.target.classList.remove('open');
        });
        container.querySelector('#generate-modal')?.addEventListener('click', e => {
            if (e.target.id === 'generate-modal') closeGenerate();
        });
        container.querySelector('#generate-modal-close')?.addEventListener('click', closeGenerate);
        container.querySelector('#prompt-result-modal')?.addEventListener('click', e => {
            if (e.target.id === 'prompt-result-modal') e.target.classList.remove('open');
        });
        container.querySelector('#prompt-result-close')?.addEventListener('click', () => {
            document.getElementById('prompt-result-modal').classList.remove('open');
        });
    }
};

Router.register('sites', SitesModule, 'Sites', ['admin', 'developer']);
