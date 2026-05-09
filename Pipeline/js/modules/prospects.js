/* ============================================
   LaunchLocal — Scanner Module (was Prospects)
   ============================================

   Shows only `new` prospects. As soon as one is approved, it leaves this
   list and shows up in the Prelim Site Works module as an active job.
   Archive is accessible via the header toggle — archived records never
   re-enter the pipeline (Scouting dedups against the full prospects
   collection).
   ============================================ */

const ProspectsModule = {
    prospects: [],
    expandedId: null,
    filterState: null, // populated by FilterBar.onChange
    _filterBar: null,

    async render(container) {
        container.innerHTML = this.getShellHTML();
        Icons.inject(container);
        this.bindEvents(container);
        this.bindListDelegation(container);
        await this.loadProspects();
        // Mount FilterBar AFTER prospects load so industry options reflect data
        this.mountFilterBar(container);
        return () => {
            try { this._filterBar?.destroy(); } catch (_) {}
            this._filterBar = null;
            this.prospects = [];
            this.filterState = null;
            this.expandedId = null;
        };
    },

    getShellHTML() {
        const canCreate = ['admin', 'sales'].includes(LaunchLocal.currentUser?.role);
        const newBtn = canCreate
            ? `<button class="btn btn-primary" id="new-prospect-btn" style="flex-shrink:0;">&#43; New Prospect</button>`
            : '';
        return `
            <div class="page-header">
                <div>
                    <h2 class="page-title">Scanner</h2>
                    <p class="page-subtitle">New leads awaiting approval. Approved prospects move to Prelim Site Works.</p>
                </div>
                <div class="page-actions">
                    ${newBtn}
                </div>
            </div>

            <div id="prospect-filter-bar"></div>

            <div id="prospect-list">
                <div class="loading-screen"><div class="spinner spinner-lg"></div></div>
            </div>

            <!-- Manual Prospect Entry Modal -->
            <div class="modal-overlay" id="new-prospect-modal" role="dialog" aria-modal="true" aria-labelledby="new-prospect-title">
                <div class="modal modal-lg">
                    <div class="modal-header">
                        <h3 class="modal-title" id="new-prospect-title">New Prospect</h3>
                        <button class="modal-close" id="new-prospect-close" aria-label="Close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="new-prospect-form" class="generate-form">
                            <div class="form-group">
                                <label class="form-label" for="np-businessName">Business name <span style="color:var(--danger);">*</span></label>
                                <input class="form-input" id="np-businessName" name="businessName" required maxlength="120">
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label" for="np-industry">Industry <span style="color:var(--danger);">*</span></label>
                                    <select class="form-input" id="np-industry" name="industry" required>
                                        <option value="">Choose one…</option>
                                        <option value="restaurant">Restaurant / Food</option>
                                        <option value="tradesperson">Tradesperson / Auto</option>
                                        <option value="salon">Salon / Spa</option>
                                        <option value="retail">Retail</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label" for="np-address">Address</label>
                                    <input class="form-input" id="np-address" name="address" placeholder="123 Main St, Hamilton, ON">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label" for="np-phone">Phone</label>
                                    <input class="form-input" id="np-phone" name="phone" placeholder="(905) 555-0123">
                                </div>
                                <div class="form-group">
                                    <label class="form-label" for="np-email">Email</label>
                                    <input type="email" class="form-input" id="np-email" name="email" placeholder="owner@example.com">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="np-website">Existing website</label>
                                <input class="form-input" id="np-website" name="website" placeholder="https://… (leave blank if none)" aria-describedby="np-website-hint">
                                <small class="form-hint" id="np-website-hint">Leaving this blank scores the lead higher (no-website is the biggest opportunity signal).</small>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label" for="np-googleRating">Google rating (optional)</label>
                                    <input type="number" class="form-input" id="np-googleRating" name="googleRating"
                                        min="0" max="5" step="0.1" placeholder="e.g. 4.8">
                                </div>
                                <div class="form-group">
                                    <label class="form-label" for="np-reviewCount">Review count (optional)</label>
                                    <input type="number" class="form-input" id="np-reviewCount" name="reviewCount"
                                        min="0" step="1" placeholder="e.g. 142">
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label" for="np-notes">Notes / context</label>
                                <textarea class="form-input" id="np-notes" name="notes" rows="3"
                                    placeholder="How you met them, referral source, what they asked for, anything worth remembering."></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="new-prospect-cancel">Cancel</button>
                        <button class="btn btn-primary" id="new-prospect-save">
                            <span class="btn-text">Save Prospect</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    async loadProspects() {
        try {
            this.prospects = await DB.getDocs('prospects', { orderBy: [['prospectScore', 'desc']] });
            this.renderList();
        } catch (error) {
            const list = document.getElementById('prospect-list');
            if (list) {
                list.innerHTML = LaunchLocal.EmptyState.render({
                    icon: 'alert',
                    title: 'Failed to Load',
                    desc: 'Could not fetch prospects. Try refreshing.',
                    variant: 'inline-error'
                });
            }
        }
    },

    /**
     * FilterBar entry point. State shape lives in filter-bar.js docs.
     * The Scanner cares about: search, status (select), industry (select),
     * scoreBand (pill), quickFilters (hotLead/hasWebsite/noWebsite/
     * followupDue/noContact14), and sort.
     */
    applyFilter(state) {
        this.filterState = state;
        this.expandedId = null;
        this.renderList();
    },

    renderList() {
        const list = document.getElementById('prospect-list');
        if (!list) return;

        // Defaults — useful before FilterBar has emitted its first state
        const fs = this.filterState || {
            search: '',
            pills: { scoreBand: 'all' },
            selects: { status: 'all', industry: 'all' },
            quickFilters: {},
            sort: 'score-desc'
        };

        const statusFilter = (fs.selects && fs.selects.status) || 'all';
        const industry = (fs.selects && fs.selects.industry) || 'all';
        const scoreBand = (fs.pills && fs.pills.scoreBand) || 'all';
        const q = (fs.search || '').toLowerCase().trim();
        const qf = fs.quickFilters || {};

        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });
        const fourteenDaysAgo = (() => {
            const d = new Date(); d.setDate(d.getDate() - 14);
            return d.toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });
        })();

        let filtered = this.prospects.filter((p) => {
            // Status select — default behavior matches the old viewMode='new'
            if (statusFilter === 'all') {
                // "All" still excludes the post-Scanner pipeline statuses
                if (!['new', 'approved', 'archived'].includes(p.status)) return false;
            } else if (p.status !== statusFilter) {
                return false;
            }

            if (industry && industry !== 'all' && p.industry !== industry) return false;

            const s = p.prospectScore || 0;
            if (scoreBand === 'hot' && s < 80) return false;
            if (scoreBand === 'high' && (s < 50 || s >= 80)) return false;
            if (scoreBand === 'med' && (s < 20 || s >= 50)) return false;
            if (scoreBand === 'low' && s >= 20) return false;

            if (q) {
                const hay = `${p.businessName || ''} ${p.address || ''}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }

            if (qf.hotLead && !p.hotLead) return false;
            if (qf.hasWebsite && !p.website) return false;
            if (qf.noWebsite && p.website) return false;
            if (qf.followupDue) {
                if (!p.nextFollowUp || p.nextFollowUp > today) return false;
            }
            if (qf.noContact14) {
                const log = p.contactLog || [];
                const last = log.length ? (log[log.length - 1].date || '') : '';
                if (last && last >= fourteenDaysAgo) return false;
            }
            return true;
        });

        // Sort
        const cmpName = (a, b) => (a.businessName || '').localeCompare(b.businessName || '');
        const cmpFollowup = (a, b) => {
            const av = a.nextFollowUp || '￿';
            const bv = b.nextFollowUp || '￿';
            return av.localeCompare(bv);
        };
        const createdMs = (p) => {
            const c = p.createdAt;
            if (!c) return 0;
            if (typeof c.toMillis === 'function') return c.toMillis();
            const t = new Date(c).getTime();
            return isNaN(t) ? 0 : t;
        };
        switch (fs.sort) {
            case 'score-asc':    filtered.sort((a, b) => (a.prospectScore || 0) - (b.prospectScore || 0)); break;
            case 'name':         filtered.sort(cmpName); break;
            case 'followup':     filtered.sort(cmpFollowup); break;
            case 'created-desc': filtered.sort((a, b) => createdMs(b) - createdMs(a)); break;
            case 'created-asc':  filtered.sort((a, b) => createdMs(a) - createdMs(b)); break;
            case 'score-desc':
            default:             filtered.sort((a, b) => (b.prospectScore || 0) - (a.prospectScore || 0)); break;
        }

        if (filtered.length === 0) {
            const isArchivedView = statusFilter === 'archived';
            list.innerHTML = LaunchLocal.EmptyState.render({
                icon: 'search',
                title: isArchivedView ? 'No archived prospects' : 'No matching prospects',
                desc: isArchivedView
                    ? 'Archived prospects will appear here and can be restored.'
                    : 'Try clearing filters, or use Scouting to import nearby businesses.',
                ctaLabel: isArchivedView ? null : 'Open Scouting',
                ctaHref: isArchivedView ? null : '#scouting'
            });
            Icons.inject(list);
            return;
        }

        list.innerHTML = `<div class="prospect-cards">${filtered.map((p) => this.renderCard(p)).join('')}</div>`;

        // Delegated listener installed once per render() in bindListDelegation.
        // Card-level click toggles expansion (handled in delegate).
        Icons.inject(list);
    },

    /**
     * Build the unique-industry list from currently-loaded prospects so the
     * Industry select reflects what's actually scannable.
     */
    industryOptions() {
        const set = new Set();
        for (const p of this.prospects) {
            if (p.industry) set.add(p.industry);
        }
        const sorted = [...set].sort();
        return [{ value: 'all', label: 'All industries' }]
            .concat(sorted.map(i => ({ value: i, label: i })));
    },

    mountFilterBar(container) {
        const host = container.querySelector('#prospect-filter-bar');
        if (!host || !LaunchLocal.FilterBar) return;
        try { this._filterBar?.destroy(); } catch (_) {}
        this._filterBar = LaunchLocal.FilterBar.mount(host, {
            search: { placeholder: 'Search prospects…', fields: ['businessName', 'address'] },
            pills: {
                key: 'scoreBand',
                options: [
                    { key: 'all',  label: 'All' },
                    { key: 'hot',  label: 'Hot 80+' },
                    { key: 'high', label: 'High 50-79' },
                    { key: 'med',  label: 'Med 20-49' },
                    { key: 'low',  label: 'Low <20' }
                ]
            },
            selects: [
                { key: 'industry', label: 'Industry', options: this.industryOptions() },
                {
                    key: 'status', label: 'Status', options: [
                        { value: 'all',      label: 'All' },
                        { value: 'new',      label: 'New' },
                        { value: 'approved', label: 'Approved' },
                        { value: 'archived', label: 'Archived' }
                    ]
                }
            ],
            quickFilters: [
                { key: 'hotLead',     label: 'Hot leads only' },
                { key: 'hasWebsite',  label: 'Has website' },
                { key: 'noWebsite',   label: 'No website' },
                { key: 'followupDue', label: 'Follow-up due' },
                { key: 'noContact14', label: 'No contact 14d+' }
            ],
            sort: {
                options: [
                    { value: 'score-desc',   label: 'Score (high to low)' },
                    { value: 'score-asc',    label: 'Score (low to high)' },
                    { value: 'name',         label: 'Name (A to Z)' },
                    { value: 'followup',     label: 'Follow-up date' },
                    { value: 'created-desc', label: 'Newest first' },
                    { value: 'created-asc',  label: 'Oldest first' }
                ],
                default: 'score-desc'
            },
            urlState: true,
            onChange: (state) => this.applyFilter(state)
        });
    },

    renderCard(p) {
        const scoreClass = this.getScoreClass(p.prospectScore);
        const hotBtn = p.hotLead
            ? `<button class="hot-toggle hot-active" data-action="toggle-hot" data-id="${p.id}" data-hot="true" title="Remove hot lead flag">&#9733;</button>`
            : `<button class="hot-toggle" data-action="toggle-hot" data-id="${p.id}" data-hot="false" title="Flag as hot lead">&#9734;</button>`;
        const websiteChip = p.website
            ? `<span class="meta-chip ${p.website.startsWith('https') ? '' : 'chip-warn'}">${p.website.startsWith('https') ? '' : '&#9888;&nbsp;'}Has Website</span>`
            : `<span class="meta-chip chip-danger">No Website</span>`;
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });
        const followUpHTML = p.nextFollowUp ? (() => {
            const cls = p.nextFollowUp < today ? 'followup-overdue' : p.nextFollowUp === today ? 'followup-today' : 'followup-upcoming';
            const label = p.nextFollowUp < today ? `Overdue: ${p.nextFollowUp}` : p.nextFollowUp === today ? 'Follow-up: Today' : `Follow-up: ${p.nextFollowUp}`;
            return `<span class="followup-chip ${cls}">${label}</span>`;
        })() : '';

        const isExpanded = this.expandedId === p.id;
        const expandedBody = isExpanded ? this.renderExpandedBody(p) : '';

        return `
            <article class="prospect-card ${isExpanded ? 'expanded' : ''}" data-id="${p.id}" aria-label="Prospect: ${LaunchLocal.escapeHtml(p.businessName)}" aria-expanded="${isExpanded ? 'true' : 'false'}">
                <div class="prospect-card-body">
                    <div class="prospect-card-info">
                        <div class="prospect-card-name">
                            ${LaunchLocal.escapeHtml(p.businessName)}
                            ${hotBtn}
                        </div>
                        <div class="prospect-card-address">${LaunchLocal.escapeHtml(p.address || '—')}</div>
                        <div class="prospect-card-meta">
                            <span class="industry-tag">${LaunchLocal.escapeHtml(p.industry || 'other')}</span>
                            ${p.googleRating ? `<span class="meta-chip">&#9733; ${p.googleRating} &nbsp;(${p.reviewCount})</span>` : ''}
                            ${websiteChip}
                            ${followUpHTML}
                        </div>
                    </div>
                    <div class="prospect-card-right">
                        <div class="score-pill ${scoreClass}" aria-label="Score: ${p.prospectScore}">${p.prospectScore}</div>
                        <div class="expand-caret" aria-hidden="true">${isExpanded ? '▲' : '▼'}</div>
                    </div>
                </div>
                ${expandedBody}
            </article>
        `;
    },

    renderExpandedBody(p) {
        const breakdownHTML = Object.entries(p.scoreBreakdown || {})
            .filter(([, val]) => val > 0)
            .map(([key, val]) => `<tr><td>${this.getScoreLabel(key)}</td><td><strong>+${val}</strong></td></tr>`)
            .join('');

        const contactLogHTML = (p.contactLog || []).length > 0
            ? (p.contactLog || []).map((c) => `
                <div class="contact-log-entry">
                    <span class="log-date">${LaunchLocal.escapeHtml(c.date || '')}</span> — ${LaunchLocal.escapeHtml(c.note || '')}
                </div>`).join('')
            : '<p class="text-muted text-sm">No contact history yet.</p>';

        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });
        const followupChipHtml = p.nextFollowUp ? (() => {
            const cls = p.nextFollowUp < today ? 'followup-overdue' : p.nextFollowUp === today ? 'followup-today' : 'followup-upcoming';
            const label = p.nextFollowUp < today ? `Overdue: ${p.nextFollowUp}` : p.nextFollowUp === today ? 'Follow-up: Today' : `Follow-up: ${p.nextFollowUp}`;
            return `<span class="followup-chip ${cls}">${label}</span>`;
        })() : '';

        const isArchived = p.status === 'archived';
        const actionButtons = isArchived
            ? `<button class="btn btn-sm btn-secondary restore-btn" data-action="restore" data-id="${p.id}">Restore to New</button>`
            : `
                <button class="btn btn-sm btn-success approve-btn" data-action="approve" data-id="${p.id}" title="Approve and move to Prelim Site Works">
                    Approve &rarr;
                </button>
                <button class="btn btn-sm btn-ghost archive-btn" data-action="archive" data-id="${p.id}">Archive</button>
            `;

        return `
            <div class="prospect-card-expanded">
                <div class="detail-grid">
                    <div class="detail-section">
                        <h4 class="detail-section-title">Business Info</h4>
                        <div class="detail-row"><span>Address</span><span>${LaunchLocal.escapeHtml(p.address || '—')}</span></div>
                        <div class="detail-row"><span>Phone</span><span>${LaunchLocal.escapeHtml(p.phone || '—')}</span></div>
                        <div class="detail-row"><span>Email</span><span>${LaunchLocal.escapeHtml(p.email || '—')}</span></div>
                        <div class="detail-row"><span>Website</span><span>${p.website ? `<a href="${p.website}" target="_blank" rel="noopener">${LaunchLocal.escapeHtml(p.website)}</a>` : '<em>No website</em>'}</span></div>
                        <div class="detail-row"><span>Industry</span><span>${LaunchLocal.escapeHtml(p.industry || '—')}</span></div>
                        <div class="detail-row"><span>Google Rating</span><span>${p.googleRating ? `&#9733; ${p.googleRating} (${p.reviewCount} reviews)` : '—'}</span></div>
                        ${LaunchLocal.Grants.renderProspectRow(p)}
                    </div>
                    <div class="detail-section">
                        <h4 class="detail-section-title">
                            Score Breakdown &nbsp;
                            <span class="score-pill ${this.getScoreClass(p.prospectScore)}">${p.prospectScore}</span>
                        </h4>
                        <table class="score-breakdown-table">
                            <thead><tr><th>Factor</th><th>Points</th></tr></thead>
                            <tbody>${breakdownHTML || '<tr><td colspan="2" class="text-muted">No breakdown recorded.</td></tr>'}</tbody>
                        </table>
                    </div>
                </div>

                <div class="detail-section" style="margin-top:16px;">
                    <h4 class="detail-section-title">Notes</h4>
                    <p class="text-sm">${LaunchLocal.escapeHtml(p.notes || 'No notes added.')}</p>
                </div>

                <div class="detail-section" style="margin-top:16px;">
                    <h4 class="detail-section-title">Contact History</h4>
                    ${contactLogHTML}
                </div>

                <div class="detail-section" style="margin-top:16px;">
                    <h4 class="detail-section-title">Follow-up Reminder</h4>
                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                        <input type="date" class="form-input followup-date-input" data-id="${p.id}"
                            value="${p.nextFollowUp || ''}" style="max-width:180px;">
                        <button class="btn btn-sm btn-primary followup-set-btn" data-action="followup-set" data-id="${p.id}">Set</button>
                        ${p.nextFollowUp ? `<button class="btn btn-sm btn-ghost followup-clear-btn" data-action="followup-clear" data-id="${p.id}">Clear</button>` : ''}
                        ${followupChipHtml}
                    </div>
                </div>

                <div class="prospect-card-actions">
                    ${actionButtons}
                    <button class="btn btn-sm btn-ghost timeline-btn" data-action="timeline" data-id="${p.id}">
                        <span data-icon="timeline"></span>Timeline
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Install a single delegated click listener on the prospect-list
     * container. Replaces the previous pattern of attaching a listener to
     * every card and every action button on each render() pass.
     */
    bindListDelegation(container) {
        const list = container.querySelector('#prospect-list');
        if (!list) return;
        list.addEventListener('click', (e) => {
            const actionEl = e.target.closest('[data-action]');
            if (actionEl && list.contains(actionEl)) {
                e.stopPropagation();
                const id = actionEl.getAttribute('data-id');
                const action = actionEl.getAttribute('data-action');
                switch (action) {
                    case 'toggle-hot': {
                        const isHot = actionEl.getAttribute('data-hot') === 'true';
                        this.toggleHotLead(id, isHot);
                        return;
                    }
                    case 'approve':  this.changeStatus(id, 'approved'); return;
                    case 'archive':  this.changeStatus(id, 'archived'); return;
                    case 'restore':  this.changeStatus(id, 'new'); return;
                    case 'timeline': window.location.hash = `#timeline?prospect=${id}`; return;
                    case 'followup-set': {
                        const card = actionEl.closest('.prospect-card');
                        const date = card?.querySelector('.followup-date-input')?.value;
                        if (!date) { LaunchLocal.toast('Please select a date.', 'warning'); return; }
                        this.setFollowUp(id, date);
                        return;
                    }
                    case 'followup-clear': this.setFollowUp(id, null); return;
                }
            }

            // Card-level click toggles expansion. Skip when the click landed
            // on an interactive descendant (input/select/textarea/anchor or
            // any data-action element handled above).
            const card = e.target.closest('.prospect-card');
            if (!card || !list.contains(card)) return;
            if (e.target.closest('button, input, a, select, textarea, [data-action]')) return;
            this.toggleExpand(card.getAttribute('data-id'));
        });
    },

    toggleExpand(id) {
        this.expandedId = this.expandedId === id ? null : id;
        this.renderList();
    },

    bindEvents(container) {
        // Search and status (incl. archived view) are owned by FilterBar.
        // Manual prospect entry
        const newModal = container.querySelector('#new-prospect-modal');
        const closeNew = () => newModal?.classList.remove('open');
        container.querySelector('#new-prospect-btn')?.addEventListener('click', () => this.openCreateModal());
        container.querySelector('#new-prospect-close')?.addEventListener('click', closeNew);
        container.querySelector('#new-prospect-cancel')?.addEventListener('click', closeNew);
        newModal?.addEventListener('click', (e) => {
            if (e.target.id === 'new-prospect-modal') closeNew();
        });
        container.querySelector('#new-prospect-save')?.addEventListener('click', () => this.saveNewProspect());
    },

    openCreateModal() {
        const form = document.getElementById('new-prospect-form');
        if (form) form.reset();
        document.getElementById('new-prospect-modal')?.classList.add('open');
        setTimeout(() => document.getElementById('np-businessName')?.focus(), 50);
    },

    async saveNewProspect() {
        const form = document.getElementById('new-prospect-form');
        if (!form) return;
        if (!form.reportValidity()) return;

        const getVal = (id) => document.getElementById(id)?.value?.trim() || '';
        const businessName = getVal('np-businessName');
        const industry = getVal('np-industry');
        if (!businessName || !industry) {
            LaunchLocal.toast('Business name and industry are required.', 'warning');
            return;
        }

        const ratingRaw = getVal('np-googleRating');
        const reviewCountRaw = getVal('np-reviewCount');
        const googleRating = ratingRaw !== '' ? parseFloat(ratingRaw) : null;
        const reviewCount = reviewCountRaw !== '' ? parseInt(reviewCountRaw, 10) : 0;
        const website = getVal('np-website') || null;

        const prospect = {
            businessName,
            industry,
            address: getVal('np-address') || '',
            phone: getVal('np-phone') || null,
            email: getVal('np-email') || null,
            website,
            googleRating: (typeof googleRating === 'number' && !isNaN(googleRating)) ? googleRating : null,
            reviewCount: isNaN(reviewCount) ? 0 : reviewCount,
            googlePlaceId: null,
            facebookUrl: null,
            lat: null,
            lng: null,
            status: 'new',
            notes: getVal('np-notes'),
            contactLog: [],
            assignedTo: LaunchLocal.currentUser?.uid || null,
            scanBatchId: null
        };

        const { score, breakdown } = Scoring.calculate(prospect);

        const saveBtn = document.getElementById('new-prospect-save');
        saveBtn?.classList.add('btn-loading');
        if (saveBtn) saveBtn.disabled = true;

        try {
            const id = await DB.addDoc('prospects', {
                ...prospect,
                prospectScore: score,
                scoreBreakdown: breakdown,
                hotLead: Scoring.isHotLead(score)
            });
            await DB.logActivity('prospect_created_manual', 'scanner',
                `manually added ${businessName} to the pipeline`,
                { industry, source: 'manual' }, id);

            document.getElementById('new-prospect-modal')?.classList.remove('open');
            LaunchLocal.toast(`${businessName} added to the pipeline.`, 'success');
            await this.loadProspects();
        } catch (err) {
            console.error('saveNewProspect failed:', err);
            LaunchLocal.toast('Failed to save prospect. Please try again.', 'error');
        } finally {
            saveBtn?.classList.remove('btn-loading');
            if (saveBtn) saveBtn.disabled = false;
        }
    },

    async changeStatus(id, newStatus) {
        const p = this.prospects.find((x) => x.id === id);
        if (!p) return;

        // Centralized transition — validates legality, writes status, logs to
        // activityLog (module: 'pipeline'), runs side effects, toasts. Project
        // doc creation is deferred to the sold transition and handled inside
        // Pipeline.advanceProspect via ensureProjectForProspect below.
        const result = await LaunchLocal.Pipeline.advanceProspect(
            id, p.status, newStatus, { reason: 'scanner-button' }
        );
        if (result.ok) {
            p.status = newStatus;
            this.expandedId = null;
            this.renderList();
        }
    },

    /**
     * Create a project doc the first time a prospect transitions to sold.
     * Tier-aware default monthlyFee (cents) — pulls SmartPricing reco when
     * available, falls back to TIER_DEFAULTS keyed off
     * `prospect.maintenanceTier`. Safe to call repeatedly (existence check).
     */
    async ensureProjectForProspect(p) {
        try {
            const existing = await DB.getDocs('projects', { where: [['prospectId', '==', p.id]] });
            if (existing.length > 0) return;

            const tier = p.maintenanceTier || 'basic';
            const monthlyFee = LaunchLocal.Pipeline.resolveMonthlyFee(p);
            const today = new Date().toISOString().slice(0, 10);
            const projectId = await DB.addDoc('projects', {
                prospectId: p.id,
                clientName: p.businessName,
                domainName: null,
                status: 'onboarding',
                maintenanceTier: tier,
                monthlyFee,
                startDate: today,
                renewalDate: null,
                communicationLog: [],
                revisions: [],
                automationFlags: []
            });
            await DB.logActivity('project_created', 'active-projects',
                `created project for new client ${p.businessName}`,
                { prospectId: p.id, tier, monthlyFee }, projectId);
        } catch (err) {
            window.log?.warn('ensureProjectForProspect failed:', err);
        }
    },

    async toggleHotLead(id, current) {
        try {
            const p = this.prospects.find((x) => x.id === id);
            if (!p) return;
            const newVal = !current;
            await DB.updateDoc('prospects', id, { hotLead: newVal });
            await DB.logActivity('hot_lead_toggled', 'scanner',
                `${newVal ? 'flagged' : 'unflagged'} ${p.businessName} as hot lead`, {}, id);
            p.hotLead = newVal;
            this.renderList();
            LaunchLocal.toast(`${p.businessName} ${newVal ? 'flagged as hot lead' : 'hot lead removed'}`, 'info');
        } catch {
            LaunchLocal.toast('Failed to update hot lead status.', 'error');
        }
    },

    async setFollowUp(id, date) {
        try {
            const p = this.prospects.find((x) => x.id === id);
            if (!p) return;
            await DB.updateDoc('prospects', id, { nextFollowUp: date || null });
            p.nextFollowUp = date || null;
            this.renderList();
            LaunchLocal.toast(date ? `Follow-up set for ${date}` : 'Follow-up cleared.', date ? 'success' : 'info');
        } catch {
            LaunchLocal.toast('Failed to update follow-up.', 'error');
        }
    },

    getScoreClass(score) {
        if (score >= 80) return 'score-hot';
        if (score >= 50) return 'score-high';
        if (score >= 20) return 'score-medium';
        return 'score-low';
    },

    getScoreLabel(key) {
        const labels = {
            noWebsite: 'No website found',
            noSSL: 'No SSL certificate',
            noMobile: 'Not mobile-responsive',
            pageSpeed: 'Slow PageSpeed score',
            facebook: 'Facebook page, no website',
            googleRating: 'Strong Google rating (4.0+)',
            oldCopyright: 'Outdated copyright date',
            professional: 'Professional site (deduction)'
        };
        return labels[key] || key;
    }
};

Router.register('scanner', ProspectsModule, 'Scanner', ['admin', 'sales']);

// Sidebar nav badge — prospects with status='new' (awaiting review).
// Severity: info.
if (window.LaunchLocal && LaunchLocal.NavBadge) {
    LaunchLocal.NavBadge.register('scanner', async () => {
        try {
            if (!LaunchLocal.db) return { count: 0 };
            const snap = await LaunchLocal.db.collection('prospects')
                .where('status', '==', 'new')
                .get();
            const n = snap.size || 0;
            if (n > 0) return { count: n, severity: 'info' };
            return { count: 0 };
        } catch (_) {
            return { count: 0 };
        }
    });
}
