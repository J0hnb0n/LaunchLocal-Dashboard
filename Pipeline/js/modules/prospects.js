/* ============================================
   LaunchLocal — Prospects Module
   ============================================

   Shows only `new` prospects. As soon as one is approved, it leaves this
   list and shows up in the Projects module as an active job. Archive is
   accessible via the header toggle — archived records never re-enter the
   pipeline (Scouting dedups against the full prospects collection).
   ============================================ */

const ProspectsModule = {
    prospects: [],
    searchQuery: '',
    viewMode: 'new', // 'new' | 'archived'
    expandedId: null,

    async render(container) {
        container.innerHTML = this.getShellHTML();
        Icons.inject(container);
        this.bindEvents(container);
        await this.loadProspects();
        return () => {
            this.prospects = [];
            this.searchQuery = '';
            this.viewMode = 'new';
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
                    <h2 class="page-title">Prospects</h2>
                    <p class="page-subtitle">New leads awaiting approval. Approved prospects move to Projects.</p>
                </div>
                <div class="page-actions">
                    <button class="btn btn-ghost btn-sm" id="archive-toggle-btn" title="View archived prospects">
                        <span data-icon="trash"></span>
                        <span class="btn-text" id="archive-toggle-label">View Archived</span>
                    </button>
                </div>
            </div>

            <div class="filter-bar">
                <input type="text" class="form-input filter-search" id="prospect-search"
                    placeholder="Search by business name or location…">
                ${newBtn}
            </div>

            <div id="prospect-list">
                <div class="loading-screen"><div class="spinner spinner-lg"></div></div>
            </div>

            <!-- Manual Prospect Entry Modal -->
            <div class="modal-overlay" id="new-prospect-modal">
                <div class="modal modal-lg">
                    <div class="modal-header">
                        <h3 class="modal-title">New Prospect</h3>
                        <button class="modal-close" id="new-prospect-close">&times;</button>
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
                                <input class="form-input" id="np-website" name="website" placeholder="https://… (leave blank if none)">
                                <small class="form-hint">Leaving this blank scores the lead higher (no-website is the biggest opportunity signal).</small>
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
                list.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">&#9888;</div>
                        <h3 class="empty-state-title">Failed to Load</h3>
                        <p class="empty-state-desc">Could not fetch prospects. Try refreshing.</p>
                    </div>
                `;
            }
        }
    },

    renderList() {
        const list = document.getElementById('prospect-list');
        if (!list) return;

        const targetStatus = this.viewMode === 'archived' ? 'archived' : 'new';
        let filtered = this.prospects.filter((p) => p.status === targetStatus);

        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            filtered = filtered.filter((p) =>
                (p.businessName || '').toLowerCase().includes(q) ||
                (p.address || '').toLowerCase().includes(q)
            );
        }

        if (filtered.length === 0) {
            const isArchivedView = this.viewMode === 'archived';
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">&#128269;</div>
                    <h3 class="empty-state-title">${isArchivedView ? 'No archived prospects' : 'No new prospects'}</h3>
                    <p class="empty-state-desc">${isArchivedView
                        ? 'Archived prospects will appear here and can be restored.'
                        : 'Use Scouting to import nearby businesses, or click + New Prospect to add one manually.'
                    }</p>
                </div>
            `;
            return;
        }

        list.innerHTML = `<div class="prospect-cards">${filtered.map((p) => this.renderCard(p)).join('')}</div>`;

        list.querySelectorAll('.prospect-card').forEach((card) => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('button, input, a, select, textarea')) return;
                this.toggleExpand(card.getAttribute('data-id'));
            });
        });
        list.querySelectorAll('.hot-toggle').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleHotLead(btn.getAttribute('data-id'), btn.getAttribute('data-hot') === 'true');
            });
        });

        Icons.inject(list);
        if (this.expandedId) this.bindExpandedHandlers(this.expandedId);
    },

    renderCard(p) {
        const scoreClass = this.getScoreClass(p.prospectScore);
        const hotBtn = p.hotLead
            ? `<button class="hot-toggle hot-active" data-id="${p.id}" data-hot="true" title="Remove hot lead flag">&#9733;</button>`
            : `<button class="hot-toggle" data-id="${p.id}" data-hot="false" title="Flag as hot lead">&#9734;</button>`;
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
            <div class="prospect-card ${isExpanded ? 'expanded' : ''}" data-id="${p.id}">
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
                        <div class="score-pill ${scoreClass}">${p.prospectScore}</div>
                        <div class="expand-caret" aria-hidden="true">${isExpanded ? '▲' : '▼'}</div>
                    </div>
                </div>
                ${expandedBody}
            </div>
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
            ? `<button class="btn btn-sm btn-secondary restore-btn" data-id="${p.id}">Restore to New</button>`
            : `
                <button class="btn btn-sm btn-primary approve-btn" data-id="${p.id}" title="Approve and move to Projects">
                    Approve &rarr;
                </button>
                <button class="btn btn-sm btn-ghost archive-btn" data-id="${p.id}">Archive</button>
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
                        <button class="btn btn-sm btn-primary followup-set-btn" data-id="${p.id}">Set</button>
                        ${p.nextFollowUp ? `<button class="btn btn-sm btn-ghost followup-clear-btn" data-id="${p.id}">Clear</button>` : ''}
                        ${followupChipHtml}
                    </div>
                </div>

                <div class="prospect-card-actions">
                    ${actionButtons}
                    <button class="btn btn-sm btn-ghost timeline-btn" data-id="${p.id}">
                        <span data-icon="timeline"></span>Timeline
                    </button>
                </div>
            </div>
        `;
    },

    bindExpandedHandlers(id) {
        const card = document.querySelector(`.prospect-card[data-id="${id}"]`);
        if (!card) return;
        Icons.inject(card);

        card.querySelector('.approve-btn')?.addEventListener('click', () => this.changeStatus(id, 'approved'));
        card.querySelector('.archive-btn')?.addEventListener('click', () => this.changeStatus(id, 'archived'));
        card.querySelector('.restore-btn')?.addEventListener('click', () => this.changeStatus(id, 'new'));
        card.querySelector('.timeline-btn')?.addEventListener('click', () => {
            window.location.hash = `#timeline?prospect=${id}`;
        });
        card.querySelector('.followup-set-btn')?.addEventListener('click', () => {
            const dateInput = card.querySelector('.followup-date-input');
            const date = dateInput?.value;
            if (!date) { LaunchLocal.toast('Please select a date.', 'warning'); return; }
            this.setFollowUp(id, date);
        });
        card.querySelector('.followup-clear-btn')?.addEventListener('click', () => this.setFollowUp(id, null));
    },

    toggleExpand(id) {
        this.expandedId = this.expandedId === id ? null : id;
        this.renderList();
    },

    bindEvents(container) {
        const searchInput = container.querySelector('#prospect-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.trim();
                this.expandedId = null;
                this.renderList();
            });
        }

        container.querySelector('#archive-toggle-btn')?.addEventListener('click', () => {
            this.viewMode = this.viewMode === 'archived' ? 'new' : 'archived';
            this.expandedId = null;
            const label = container.querySelector('#archive-toggle-label');
            if (label) label.textContent = this.viewMode === 'archived' ? 'View New' : 'View Archived';
            this.renderList();
        });

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
            await DB.logActivity('prospect_created_manual', 'prospects',
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
        try {
            const p = this.prospects.find((x) => x.id === id);
            if (!p) return;
            const oldStatus = p.status;
            await DB.updateDoc('prospects', id, { status: newStatus });
            await DB.logActivity('status_changed', 'prospects',
                `changed ${p.businessName} from ${oldStatus} to ${newStatus}`,
                { oldStatus, newStatus }, id);
            p.status = newStatus;

            // Create the project record at approval time — from here forward
            // the job lives in the Projects module, not in Prospects.
            if (newStatus === 'approved' && oldStatus !== 'approved') {
                await this.ensureProjectForProspect(p);
            }

            this.expandedId = null;
            this.renderList();

            const msg = newStatus === 'approved'
                ? `${p.businessName} approved — moved to Projects.`
                : newStatus === 'archived'
                    ? `${p.businessName} archived.`
                    : `${p.businessName} restored.`;
            LaunchLocal.toast(msg, newStatus === 'approved' ? 'success' : 'info');
        } catch {
            LaunchLocal.toast('Failed to update status.', 'error');
        }
    },

    /**
     * Create a project doc the first time a prospect is approved. Called
     * from changeStatus when transitioning new → approved; safe to call
     * repeatedly (existence check guards against dupes).
     */
    async ensureProjectForProspect(p) {
        try {
            const existing = await DB.getDocs('projects', { where: [['prospectId', '==', p.id]] });
            if (existing.length > 0) return;

            const today = new Date().toISOString().slice(0, 10);
            const projectId = await DB.addDoc('projects', {
                prospectId: p.id,
                clientName: p.businessName,
                domainName: null,
                status: 'onboarding',
                maintenanceTier: 'basic',
                monthlyFee: 15000,
                startDate: today,
                renewalDate: null,
                communicationLog: [],
                revisions: [],
                automationFlags: []
            });
            await DB.logActivity('project_created', 'projects',
                `created project for approved prospect ${p.businessName}`,
                { prospectId: p.id }, projectId);
        } catch (err) {
            console.warn('ensureProjectForProspect failed:', err);
        }
    },

    async toggleHotLead(id, current) {
        try {
            const p = this.prospects.find((x) => x.id === id);
            if (!p) return;
            const newVal = !current;
            await DB.updateDoc('prospects', id, { hotLead: newVal });
            await DB.logActivity('hot_lead_toggled', 'prospects',
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

Router.register('prospects', ProspectsModule, 'Prospects', ['admin', 'sales']);
