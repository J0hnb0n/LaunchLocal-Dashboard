/* ============================================
   LaunchLocal — Sales Module
   ============================================ */

const SalesModule = {
    prospects: [],
    sites: [],
    filterState: null,
    _filterBar: null,
    pitchQueue: [],
    followupQueue: [],

    async render(container) {
        container.innerHTML = this.getShellHTML();
        await this.loadData();
        this.bindEvents(container);
        this.bindQueueDelegation(container);
        this.mountFilterBar(container);
        return () => {
            try { this._filterBar?.destroy(); } catch (_) {}
            this._filterBar = null;
            this.prospects = [];
            this.sites = [];
            this.filterState = null;
            this.pitchQueue = [];
            this.followupQueue = [];
        };
    },

    getShellHTML() {
        return `
            <div class="page-header">
                <div>
                    <h2 class="page-title">Sales</h2>
                    <p class="page-subtitle">Pitch queue, brief + live script, and visit logging.</p>
                </div>
            </div>

            <div id="sales-filter-bar"></div>

            <div class="section-header">
                <h3 class="section-title">
                    Pitch Queue
                    <span id="pitch-count" class="badge badge-primary">0</span>
                </h3>
                <p class="section-subtitle">Prospects with approved sites — ready to pitch today.</p>
            </div>
            <div id="pitch-queue">
                <div class="loading-screen"><div class="spinner spinner-lg"></div></div>
            </div>

            <div class="section-header" style="margin-top:32px;">
                <h3 class="section-title">
                    Follow-Up Queue
                    <span id="followup-count" class="badge badge-warning">0</span>
                </h3>
                <p class="section-subtitle">Prospects you've pitched — awaiting a decision.</p>
            </div>
            <div id="followup-queue">
                <div class="loading-screen"><div class="spinner spinner-lg"></div></div>
            </div>

            <!-- Pitch Brief Modal (tabs: Brief | Live Script | Comparison) -->
            <div class="modal-overlay" id="cheatsheet-modal" role="dialog" aria-modal="true" aria-labelledby="cs-title">
                <div class="modal modal-xl">
                    <div class="modal-header">
                        <h3 class="modal-title" id="cs-title">Pitch Brief</h3>
                        <button class="modal-close" id="cs-close" aria-label="Close">&times;</button>
                    </div>
                    <div class="modal-tabs" id="cs-tabs" role="tablist" aria-label="Pitch brief sections">
                        <button class="modal-tab active" data-cstab="brief" role="tab" aria-selected="true" aria-controls="cs-panel-brief" id="cs-tab-brief">Brief</button>
                        <button class="modal-tab" data-cstab="script" role="tab" aria-selected="false" aria-controls="cs-panel-script" id="cs-tab-script" tabindex="-1">Live Script</button>
                        <button class="modal-tab" data-cstab="comparison" role="tab" aria-selected="false" aria-controls="cs-panel-comparison" id="cs-tab-comparison" tabindex="-1">Comparison</button>
                    </div>
                    <div class="modal-body" id="cs-body">
                        <div class="cs-tab-panel active" data-cspanel="brief" id="cs-panel-brief" role="tabpanel" aria-labelledby="cs-tab-brief"></div>
                        <div class="cs-tab-panel" data-cspanel="script" id="cs-panel-script" role="tabpanel" aria-labelledby="cs-tab-script" hidden></div>
                        <div class="cs-tab-panel" data-cspanel="comparison" id="cs-panel-comparison" role="tabpanel" aria-labelledby="cs-tab-comparison" hidden></div>
                    </div>
                    <div class="modal-footer" id="cs-footer"></div>
                </div>
            </div>

            <!-- Log Visit Modal -->
            <div class="modal-overlay" id="visit-modal" role="dialog" aria-modal="true" aria-labelledby="visit-title">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title" id="visit-title">Log Visit</h3>
                        <button class="modal-close" id="visit-close" aria-label="Close">&times;</button>
                    </div>
                    <div class="modal-body" id="visit-body"></div>
                    <div class="modal-footer" id="visit-footer"></div>
                </div>
            </div>
        `;
    },

    async loadData() {
        try {
            [this.prospects, this.sites] = await Promise.all([
                DB.getDocs('prospects'),
                DB.getDocs('sites', { where: [['qaStatus', '==', 'approved']] })
            ]);
            this.renderQueues();
        } catch {
            LaunchLocal.toast('Failed to load sales data.', 'error');
        }
    },

    /**
     * FilterBar entry point — funnels through the same renderQueues path.
     */
    applyFilter(state) {
        this.filterState = state;
        this.renderQueues();
    },

    /** Apply current filter state to a queue list. */
    _applyFilterToList(list) {
        const fs = this.filterState;
        if (!fs) return list;
        const q = (fs.search || '').toLowerCase().trim();
        const industry = (fs.selects && fs.selects.industry) || 'all';
        const qf = fs.quickFilters || {};
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });

        return list.filter(p => {
            if (q) {
                const hay = `${p.businessName || ''} ${p.address || ''}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            if (industry !== 'all' && (p.industry || '') !== industry) return false;
            if (qf.hasPhone && !p.phone) return false;
            if (qf.hasEmail && !p.email) return false;
            if (qf.overdueFollowup) {
                if (!p.nextFollowUp || p.nextFollowUp >= today) return false;
            }
            return true;
        });
    },

    _sortList(list) {
        const fs = this.filterState;
        const sortBy = (fs && fs.sort) || 'score-desc';
        const lastDate = (p) => {
            const log = p.contactLog || [];
            return log.length ? (log[log.length - 1].date || '') : '';
        };
        const arr = list.slice();
        switch (sortBy) {
            case 'name':
                arr.sort((a, b) => (a.businessName || '').localeCompare(b.businessName || ''));
                break;
            case 'days-since':
                // Oldest last-touch first (i.e., longest since pitch)
                arr.sort((a, b) => (lastDate(a) || '').localeCompare(lastDate(b) || ''));
                break;
            case 'score-desc':
            default:
                arr.sort((a, b) => (b.prospectScore || 0) - (a.prospectScore || 0));
                break;
        }
        return arr;
    },

    renderQueues() {
        const fs = this.filterState || { pills: { queueType: 'all' } };
        const queueType = (fs.pills && fs.pills.queueType) || 'all';

        const pitchableAll = this.prospects.filter(p => p.status === 'site-ready');
        const followupAll  = this.prospects.filter(p => p.status === 'pitched');

        // Stash full lists for the pill count callbacks
        this.pitchQueue = pitchableAll;
        this.followupQueue = followupAll;

        const pitchable = this._sortList(this._applyFilterToList(pitchableAll));
        const followup  = this._sortList(this._applyFilterToList(followupAll));

        const pitchCount = document.getElementById('pitch-count');
        const followCount = document.getElementById('followup-count');
        if (pitchCount) pitchCount.textContent = pitchable.length;
        if (followCount) followCount.textContent = followup.length;

        // Hide entire queue blocks when the queueType pill restricts to one
        const pitchSection  = document.getElementById('pitch-queue')?.previousElementSibling;
        const followSection = document.getElementById('followup-queue')?.previousElementSibling;
        const pitchEl       = document.getElementById('pitch-queue');
        const followEl      = document.getElementById('followup-queue');

        const showPitch    = queueType === 'all' || queueType === 'pitch';
        const showFollowup = queueType === 'all' || queueType === 'followup';

        if (pitchEl) pitchEl.style.display = showPitch ? '' : 'none';
        if (pitchSection && pitchSection.classList.contains('section-header')) {
            pitchSection.style.display = showPitch ? '' : 'none';
        }
        if (followEl) followEl.style.display = showFollowup ? '' : 'none';
        if (followSection && followSection.classList.contains('section-header')) {
            followSection.style.display = showFollowup ? '' : 'none';
        }

        if (showPitch) this.renderQueue('pitch-queue', pitchable, true);
        if (showFollowup) this.renderQueue('followup-queue', followup, false);
    },

    industryOptions() {
        const set = new Set();
        for (const p of this.prospects) {
            if (['site-ready', 'pitched'].includes(p.status) && p.industry) set.add(p.industry);
        }
        return [{ value: 'all', label: 'All industries' }]
            .concat([...set].sort().map(i => ({ value: i, label: i })));
    },

    mountFilterBar(container) {
        const host = container.querySelector('#sales-filter-bar');
        if (!host || !LaunchLocal.FilterBar) return;
        try { this._filterBar?.destroy(); } catch (_) {}
        this._filterBar = LaunchLocal.FilterBar.mount(host, {
            search: { placeholder: 'Search sales pipeline…', fields: ['businessName', 'address'] },
            pills: {
                key: 'queueType',
                options: [
                    { key: 'all',      label: 'All' },
                    { key: 'pitch',    label: 'Pitch queue', count: () => (this.pitchQueue || []).length },
                    { key: 'followup', label: 'Follow-up',   count: () => (this.followupQueue || []).length }
                ]
            },
            selects: [
                { key: 'industry', label: 'Industry', options: this.industryOptions() }
            ],
            quickFilters: [
                { key: 'hasPhone',        label: 'Has phone' },
                { key: 'hasEmail',        label: 'Has email' },
                { key: 'overdueFollowup', label: 'Overdue follow-up' }
            ],
            sort: {
                options: [
                    { value: 'score-desc', label: 'Score (high to low)' },
                    { value: 'days-since', label: 'Days since pitch' },
                    { value: 'name',       label: 'Name (A to Z)' }
                ],
                default: 'score-desc'
            },
            urlState: true,
            onChange: (state) => this.applyFilter(state)
        });
    },

    renderQueue(containerId, prospects, isPitch) {
        const el = document.getElementById(containerId);
        if (!el) return;

        if (prospects.length === 0) {
            el.innerHTML = LaunchLocal.EmptyState.render({
                icon: isPitch ? 'handshake' : 'check',
                title: isPitch ? 'No pitch-ready prospects' : 'All caught up',
                desc: isPitch
                    ? 'No prospects in pitch-ready status. Approve sites in QA to populate this queue.'
                    : 'No open follow-ups. All pitched prospects have been resolved.',
                variant: 'compact'
            });
            Icons.inject(el);
            return;
        }

        el.innerHTML = `
            <div class="table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Business</th>
                            <th>Industry</th>
                            <th>Score</th>
                            <th>Contact</th>
                            <th>Last Touch</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${prospects.map(p => this.renderRow(p, isPitch)).join('')}
                    </tbody>
                </table>
            </div>
        `;

        // Per-row click handlers are installed once via bindQueueDelegation()
        // on the module container. No re-binding needed on each renderQueues() pass.
    },

    renderRow(p, isPitch) {
        const scoreClass = this.getScoreClass(p.prospectScore);
        const lastContact = (p.contactLog || []).slice(-1)[0]?.date || '—';
        const siteUrl = this.getSiteUrlForProspect(p.id);
        const siteLinkBtn = siteUrl
            ? `<a class="btn btn-ghost btn-sm" href="${LaunchLocal.escapeHtml(siteUrl)}" target="_blank" rel="noopener" title="Preview built site">View Site &#8599;</a>`
            : '';

        return `
            <tr>
                <td>
                    <div class="td-name">${LaunchLocal.escapeHtml(p.businessName)}</div>
                    <div class="td-sub">${LaunchLocal.escapeHtml(p.address || '—')}</div>
                </td>
                <td><span class="industry-tag">${LaunchLocal.escapeHtml(p.industry || '—')}</span></td>
                <td><span class="score-pill ${scoreClass}">${p.prospectScore}</span></td>
                <td>
                    <div class="td-name">${LaunchLocal.escapeHtml(p.phone || '—')}</div>
                    <div class="td-sub">${LaunchLocal.escapeHtml(p.email || '—')}</div>
                </td>
                <td class="td-sub">${lastContact}</td>
                <td>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;">
                        ${siteLinkBtn}
                        ${isPitch ? `<button class="btn btn-primary btn-sm cheatsheet-btn" data-action="cheatsheet" data-id="${p.id}">Cheat Sheet</button>` : ''}
                        <button class="btn btn-secondary btn-sm visit-btn" data-action="visit" data-id="${p.id}">Log Visit</button>
                        ${isPitch ? `<button class="btn btn-secondary btn-sm pitched-btn" data-action="pitched" data-id="${p.id}">Mark Pitched</button>` : ''}
                        ${!isPitch ? `<button class="btn btn-success btn-sm sold-btn" data-action="sold" data-id="${p.id}">Mark Sold</button>` : ''}
                        ${!isPitch ? `<button class="btn btn-ghost btn-sm cooloff-btn" data-action="cool-off" data-id="${p.id}" title="Move back to pitch queue (cool off — not dead)">Cool Off</button>` : ''}
                    </div>
                </td>
            </tr>
        `;
    },

    getSiteUrlForProspect(prospectId) {
        const site = this.sites.find(s => s.prospectId === prospectId && s.filesUploadedAt);
        return site ? SitesModule.previewUrlFor(site) : null;
    },

    openCheatsheet(id) {
        const p = this.prospects.find(x => x.id === id);
        if (!p) return;

        const modal = document.getElementById('cheatsheet-modal');
        document.getElementById('cs-title').textContent = `Pitch Brief — ${p.businessName}`;

        // Render all three tab panels
        const briefPanel      = modal.querySelector('[data-cspanel="brief"]');
        const scriptPanel     = modal.querySelector('[data-cspanel="script"]');
        const comparisonPanel = modal.querySelector('[data-cspanel="comparison"]');

        briefPanel.innerHTML      = this.renderBriefPanel(p);
        scriptPanel.innerHTML     = LaunchLocal.SalesScript.render(p);
        comparisonPanel.innerHTML = this.renderComparisonPanel(p);

        // Wire script-panel interactivity (avg-ticket persistence, print, reset)
        LaunchLocal.SalesScript.bind(scriptPanel, {
            onAvgTicketChange: (prospectId, val) => this.persistAvgTicket(prospectId, val)
        });

        // Tab switching (with WAI-ARIA tabs pattern: aria-selected, tabindex, hidden panels)
        const tabs = modal.querySelectorAll('.modal-tab');
        const panels = modal.querySelectorAll('.cs-tab-panel');
        const activate = (t) => {
            const target = t.getAttribute('data-cstab');
            tabs.forEach(x => {
                const isActive = x === t;
                x.classList.toggle('active', isActive);
                x.setAttribute('aria-selected', isActive ? 'true' : 'false');
                x.setAttribute('tabindex', isActive ? '0' : '-1');
            });
            panels.forEach(x => {
                const matches = x.getAttribute('data-cspanel') === target;
                x.classList.toggle('active', matches);
                if (matches) x.removeAttribute('hidden'); else x.setAttribute('hidden', '');
            });
            // Re-render script tab if avg ticket changed in another tab session
            if (target === 'script') {
                const fresh = this.prospects.find(x => x.id === p.id) || p;
                scriptPanel.innerHTML = LaunchLocal.SalesScript.render(fresh);
                LaunchLocal.SalesScript.bind(scriptPanel, {
                    onAvgTicketChange: (pid, v) => this.persistAvgTicket(pid, v)
                });
            }
        };
        tabs.forEach(t => {
            t.onclick = () => activate(t);
            // Arrow-key roving tabindex for the tablist
            t.addEventListener('keydown', (e) => {
                const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
                if (!keys.includes(e.key)) return;
                e.preventDefault();
                const list = Array.from(tabs);
                const idx = list.indexOf(t);
                let next = idx;
                if (e.key === 'ArrowRight') next = (idx + 1) % list.length;
                if (e.key === 'ArrowLeft')  next = (idx - 1 + list.length) % list.length;
                if (e.key === 'Home') next = 0;
                if (e.key === 'End')  next = list.length - 1;
                list[next].focus();
                activate(list[next]);
            });
        });
        // Default to Brief tab on every open
        if (tabs[0]) activate(tabs[0]);

        // Footer
        const siteUrl = this.getSiteUrlForProspect(p.id);
        const siteLinkBtn = siteUrl
            ? `<a class="btn btn-primary" href="${LaunchLocal.escapeHtml(siteUrl)}" target="_blank" rel="noopener">Open Their Site &#8599;</a>`
            : '';

        document.getElementById('cs-footer').innerHTML = `
            <button class="btn btn-secondary" id="cs-close-btn">Close</button>
            ${siteLinkBtn}
            <button class="btn btn-success cs-sold-btn" data-id="${p.id}">Mark as Sold</button>
        `;

        document.getElementById('cs-close').onclick = () => modal.classList.remove('open');
        document.getElementById('cs-close-btn').onclick = () => modal.classList.remove('open');
        modal.querySelector('.cs-sold-btn')?.addEventListener('click', () => {
            this.moveStatus(p.id, 'sold');
            modal.classList.remove('open');
        });

        modal.classList.add('open');
    },

    /* ---------- Tab 1: Brief ---------- */
    renderBriefPanel(p) {
        const pricing = LaunchLocal.SalesScript.getSmartPricing(p);
        const upsells = this.getUpsells(p);

        return `
            <div class="cheatsheet-grid">

                <div class="cs-section">
                    <h4 class="cs-section-title">Talking Points</h4>
                    <ul class="talking-points">
                        <li>
                            <strong>Open with their reviews:</strong>
                            "You have ${p.reviewCount || 'a lot of'} Google reviews — imagine how many more customers you'd get if people could actually find your website."
                        </li>
                        ${p.prospectScore >= 70 ? `
                        <li>
                            <strong>Create urgency:</strong>
                            "This is a high-opportunity area — your competitors are already investing in their online presence."
                        </li>` : ''}
                        ${!p.website ? `
                        <li>
                            <strong>No-risk offer:</strong>
                            "We've already built your site — you'll see it today before you decide anything."
                        </li>` : ''}
                        <li>
                            <strong>Local credibility:</strong>
                            "We only work with local businesses. We're not some overseas agency — we're right here."
                        </li>
                        <li>
                            <strong>Speed advantage:</strong>
                            "Most agencies take 3 months and charge $10k. We launch in 14 days."
                        </li>
                    </ul>
                </div>

                <div class="cs-section cs-pricing-section">
                    <h4 class="cs-section-title">Smart Pricing</h4>
                    <div class="pricing-recommendation">
                        <div class="pricing-item">
                            <div class="pricing-label">One-Time Build</div>
                            <div class="pricing-value">${LaunchLocal.escapeHtml(pricing.buildDisplay)}</div>
                        </div>
                        <div class="pricing-item">
                            <div class="pricing-label">Monthly Maintenance</div>
                            <div class="pricing-value">${LaunchLocal.escapeHtml(pricing.maintenanceDisplay)}</div>
                        </div>
                    </div>
                    <div class="pricing-tier-row">
                        <span class="badge badge-${pricing.tier === 'premium' ? 'success' : pricing.tier === 'value' ? 'warning' : 'primary'}">
                            ${LaunchLocal.escapeHtml(pricing.tierLabel)} tier
                        </span>
                        <span class="text-muted text-sm">${LaunchLocal.escapeHtml(pricing.reasoning)}</span>
                    </div>
                    <div class="pricing-upsell">
                        <strong>Upsell opportunities:</strong> ${upsells.join(' &bull; ')}
                    </div>
                </div>

                ${LaunchLocal.Grants.renderCheatsheetBlock(p)}

            </div>
        `;
    },

    /* ---------- Tab 3: Comparison ---------- */
    renderComparisonPanel(p) {
        return `
            <div class="cheatsheet-grid">
                <div class="cs-section cs-full">
                    <h4 class="cs-section-title">Before vs After</h4>
                    <div class="comparison-grid">
                        <div class="comparison-col old">
                            <div class="comparison-header">THEIR CURRENT SITUATION</div>
                            <ul class="comparison-list">
                                ${p.website
                                    ? `<li class="con">Outdated website (${LaunchLocal.escapeHtml(p.website)})</li>`
                                    : '<li class="con">No website whatsoever</li>'}
                                ${p.scoreBreakdown?.noSSL ? '<li class="con">No SSL — Chrome marks it as "Not Secure"</li>' : ''}
                                ${p.scoreBreakdown?.noMobile ? '<li class="con">Not mobile-friendly — 60%+ of searches are mobile</li>' : ''}
                                ${p.scoreBreakdown?.pageSpeed ? '<li class="con">Slow load speed — visitors bounce in under 3s</li>' : ''}
                                <li class="con">Missing out on local search traffic</li>
                                <li class="con">Competitors with modern sites are outranking them</li>
                            </ul>
                        </div>
                        <div class="comparison-col new">
                            <div class="comparison-header">WITH LAUNCHLOCAL</div>
                            <ul class="comparison-list">
                                <li class="pro">Modern, mobile-first design</li>
                                <li class="pro">SSL secured (https://)</li>
                                <li class="pro">PageSpeed score 95+</li>
                                <li class="pro">Google Business Profile integration</li>
                                <li class="pro">Click-to-call &amp; contact form</li>
                                <li class="pro">Live in 14 days — guaranteed</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /* ---------- Persist avgTicket back to the prospect ---------- */
    async persistAvgTicket(prospectId, value) {
        try {
            await DB.updateDoc('prospects', prospectId, { avgTicket: value });
            const p = this.prospects.find(x => x.id === prospectId);
            if (p) p.avgTicket = value;
        } catch {
            // Non-critical — don't toast on every keystroke. Console is enough.
            window.log?.warn('Failed to persist avgTicket', prospectId, value);
        }
    },

    openVisitLog(id) {
        const p = this.prospects.find(x => x.id === id);
        if (!p) return;

        const modal = document.getElementById('visit-modal');
        document.getElementById('visit-title').textContent = `Log Visit — ${p.businessName}`;

        document.getElementById('visit-body').innerHTML = `
            <div class="form-group">
                <label class="form-label">Visit Date</label>
                <input type="date" class="form-input" id="visit-date"
                    value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
                <label class="form-label">Notes</label>
                <textarea class="form-input" id="visit-notes" rows="3"
                    placeholder="What happened? What was their reaction?"></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Outcome</label>
                <select class="form-input" id="visit-outcome">
                    <option value="interested">Interested — Following up</option>
                    <option value="not-in">Not in — Will try again</option>
                    <option value="no">Not interested</option>
                    <option value="sold">Sold!</option>
                </select>
            </div>
            ${(p.contactLog || []).length > 0 ? `
                <div class="detail-section" style="margin-top:16px;">
                    <h4 class="detail-section-title">Previous Contacts</h4>
                    ${p.contactLog.map(c => `
                        <div class="contact-log-entry">
                            <span class="log-date">${c.date}</span> — ${LaunchLocal.escapeHtml(c.note)}
                        </div>`).join('')}
                </div>
            ` : ''}
        `;

        document.getElementById('visit-footer').innerHTML = `
            <button class="btn btn-secondary" id="visit-cancel">Cancel</button>
            <button class="btn btn-primary" id="visit-save" data-id="${p.id}">Save Visit</button>
        `;

        const close = () => modal.classList.remove('open');
        document.getElementById('visit-close').onclick = close;
        document.getElementById('visit-cancel').onclick = close;

        document.getElementById('visit-save').addEventListener('click', async () => {
            const date = document.getElementById('visit-date').value;
            const notes = document.getElementById('visit-notes').value.trim();
            const outcome = document.getElementById('visit-outcome').value;

            if (!notes) { LaunchLocal.toast('Please add visit notes.', 'warning'); return; }

            await this.logVisit(p.id, date, notes, outcome);
            close();
        });

        modal.classList.add('open');
    },

    async logVisit(id, date, notes, outcome) {
        try {
            const p = this.prospects.find(x => x.id === id);
            if (!p) return;

            // Always update the contact log + outcome — that's the
            // module-specific side effect that stays here.
            const contactLog = [...(p.contactLog || []), { date, note: notes, outcome }];
            await DB.updateDoc('prospects', id, { contactLog });
            await DB.logActivity('visit_logged', 'sales',
                `logged visit to ${p.businessName} — ${outcome}`,
                { date, outcome }, id);
            p.contactLog = contactLog;

            // Outcome-driven status changes route through the centralized
            // pipeline so validation + project creation happen uniformly.
            const targetStatus = outcome === 'sold' ? 'sold'
                                : outcome === 'no'   ? 'archived'
                                : null;
            if (targetStatus && targetStatus !== p.status) {
                const r = await LaunchLocal.Pipeline.advanceProspect(
                    id, p.status, targetStatus, { reason: `visit-outcome:${outcome}`, silent: true }
                );
                if (r.ok) p.status = targetStatus;
            }

            this.renderQueues();
            LaunchLocal.toast('Visit logged.', 'success');
        } catch {
            LaunchLocal.toast('Failed to log visit.', 'error');
        }
    },

    async moveStatus(id, status) {
        const p = this.prospects.find(x => x.id === id);
        if (!p) return;
        const result = await LaunchLocal.Pipeline.advanceProspect(
            id, p.status, status, { reason: 'sales-button' }
        );
        if (result.ok) {
            p.status = status;
            this.renderQueues();
        }
    },

    /**
     * Soft-revert a pitched prospect back into the pitch queue. Used when a
     * deal has cooled off but isn't dead — keeps it visible on Sales without
     * forcing an archive. Only valid from `pitched`; the centralized
     * pipeline rejects other transitions.
     */
    async coolOff(id) {
        const p = this.prospects.find(x => x.id === id);
        if (!p) return;
        if (p.status !== 'pitched') {
            LaunchLocal.toast('Cool Off only applies to pitched prospects.', 'warning');
            return;
        }
        const result = await LaunchLocal.Pipeline.advanceProspect(
            id, 'pitched', 'site-ready', { reason: 'cool-off' }
        );
        if (result.ok) {
            p.status = 'site-ready';
            this.renderQueues();
        }
    },

    /**
     * Project-creation side effect now lives inside Pipeline.advanceProspect
     * (which calls ProspectsModule.ensureProjectForProspect — the canonical
     * implementation). Kept as a thin shim for any external caller.
     */
    async ensureProjectForProspect(p) {
        if (window.ProspectsModule?.ensureProjectForProspect) {
            return ProspectsModule.ensureProjectForProspect(p);
        }
    },

    /**
     * Legacy shim — kept for any external caller. Prefer
     * LaunchLocal.SalesScript.getSmartPricing(p) directly.
     */
    getPricing(p) {
        const sp = LaunchLocal.SalesScript.getSmartPricing(p);
        return {
            build: sp.buildDisplay,
            maintenance: sp.maintenanceDisplay,
            tier: sp.tierLabel,
            upsells: this.getUpsells(p)
        };
    },

    getUpsells(p) {
        const upsells = [];
        if (['salon', 'restaurant'].includes(p.industry)) upsells.push('Online booking ($50/mo)');
        upsells.push('Google Ads setup ($300 one-time)');
        if (!p.facebookUrl) upsells.push('Facebook page setup ($200)');
        return upsells;
    },

    getScoreClass(score) {
        if (score >= 80) return 'score-hot';
        if (score >= 50) return 'score-high';
        if (score >= 20) return 'score-medium';
        return 'score-low';
    },

    bindEvents(container) {
        ['#cheatsheet-modal', '#visit-modal'].forEach(sel => {
            container.querySelector(sel)?.addEventListener('click', e => {
                if (e.target === e.currentTarget) e.target.classList.remove('open');
            });
        });
    },

    /**
     * Single delegated click listener for both pitch + follow-up queues.
     * Replaces the previous pattern of attaching listeners to every row
     * action button on each renderQueues() pass.
     */
    bindQueueDelegation(container) {
        container.addEventListener('click', (e) => {
            const actionEl = e.target.closest('[data-action]');
            if (!actionEl) return;
            // Only handle actions that originate inside the queue tables
            if (!actionEl.closest('#pitch-queue, #followup-queue')) return;
            const id = actionEl.getAttribute('data-id');
            if (!id) return;
            switch (actionEl.getAttribute('data-action')) {
                case 'cheatsheet': this.openCheatsheet(id); break;
                case 'visit':      this.openVisitLog(id); break;
                case 'pitched':    this.moveStatus(id, 'pitched'); break;
                case 'sold':       this.moveStatus(id, 'sold'); break;
                case 'cool-off':   this.coolOff(id); break;
            }
        });
    }
};

Router.register('sales', SalesModule, 'Sales', ['admin', 'sales']);

// Sidebar nav badge — pitched prospects with follow-ups due today + overdue.
// danger if any overdue, warning if today only, info otherwise.
if (window.LaunchLocal && LaunchLocal.NavBadge) {
    LaunchLocal.NavBadge.register('sales', async () => {
        try {
            if (!LaunchLocal.db) return { count: 0 };
            const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });
            const snap = await LaunchLocal.db.collection('prospects')
                .where('status', '==', 'pitched')
                .get();
            let overdue = 0;
            let todayCount = 0;
            snap.forEach((d) => {
                const f = d.data().nextFollowUp;
                if (!f) return;
                if (f < today) overdue++;
                else if (f === today) todayCount++;
            });
            if (overdue > 0) return { count: overdue + todayCount, severity: 'danger' };
            if (todayCount > 0) return { count: todayCount, severity: 'warning' };
            return { count: 0 };
        } catch (_) {
            return { count: 0 };
        }
    });
}
