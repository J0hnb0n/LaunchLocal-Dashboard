/* ============================================
   LaunchLocal — Sales Module
   ============================================ */

const SalesModule = {
    prospects: [],
    sites: [],

    async render(container) {
        container.innerHTML = this.getShellHTML();
        await this.loadData();
        this.bindEvents(container);
        return () => { this.prospects = []; this.sites = []; };
    },

    getShellHTML() {
        return `
            <div class="page-header">
                <div>
                    <h2 class="page-title">Sales</h2>
                    <p class="page-subtitle">Pitch queue, cheat sheets, and visit logging.</p>
                </div>
            </div>

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

            <!-- Cheat Sheet Modal -->
            <div class="modal-overlay" id="cheatsheet-modal">
                <div class="modal modal-xl">
                    <div class="modal-header">
                        <h3 class="modal-title" id="cs-title">Sales Cheat Sheet</h3>
                        <button class="modal-close" id="cs-close">&times;</button>
                    </div>
                    <div class="modal-body" id="cs-body"></div>
                    <div class="modal-footer" id="cs-footer"></div>
                </div>
            </div>

            <!-- Log Visit Modal -->
            <div class="modal-overlay" id="visit-modal">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title" id="visit-title">Log Visit</h3>
                        <button class="modal-close" id="visit-close">&times;</button>
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

    renderQueues() {
        const pitchable = this.prospects.filter(p => p.status === 'site-ready');
        const followup = this.prospects.filter(p => p.status === 'pitched');

        document.getElementById('pitch-count').textContent = pitchable.length;
        document.getElementById('followup-count').textContent = followup.length;

        this.renderQueue('pitch-queue', pitchable, true);
        this.renderQueue('followup-queue', followup, false);
    },

    renderQueue(containerId, prospects, isPitch) {
        const el = document.getElementById(containerId);
        if (!el) return;

        if (prospects.length === 0) {
            el.innerHTML = `
                <div class="empty-state" style="padding:24px 0;">
                    <p class="empty-state-desc">${isPitch
                        ? 'No prospects in pitch-ready status. Approve sites in QA to populate this queue.'
                        : 'No open follow-ups. All pitched prospects have been resolved.'
                    }</p>
                </div>
            `;
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

        if (isPitch) {
            el.querySelectorAll('.cheatsheet-btn').forEach(btn =>
                btn.addEventListener('click', () => this.openCheatsheet(btn.getAttribute('data-id'))));
            el.querySelectorAll('.pitched-btn').forEach(btn =>
                btn.addEventListener('click', () => this.moveStatus(btn.getAttribute('data-id'), 'pitched')));
        } else {
            el.querySelectorAll('.sold-btn').forEach(btn =>
                btn.addEventListener('click', () => this.moveStatus(btn.getAttribute('data-id'), 'sold')));
        }
        el.querySelectorAll('.visit-btn').forEach(btn =>
            btn.addEventListener('click', () => this.openVisitLog(btn.getAttribute('data-id'))));
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
                        ${isPitch ? `<button class="btn btn-primary btn-sm cheatsheet-btn" data-id="${p.id}">Cheat Sheet</button>` : ''}
                        <button class="btn btn-secondary btn-sm visit-btn" data-id="${p.id}">Log Visit</button>
                        ${isPitch ? `<button class="btn btn-secondary btn-sm pitched-btn" data-id="${p.id}">Mark Pitched</button>` : ''}
                        ${!isPitch ? `<button class="btn btn-success btn-sm sold-btn" data-id="${p.id}">Mark Sold</button>` : ''}
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
        document.getElementById('cs-title').textContent = `Sales Cheat Sheet — ${p.businessName}`;
        const pricing = this.getPricing(p);

        document.getElementById('cs-body').innerHTML = `
            <div class="cheatsheet-grid">

                <div class="cs-section cs-full">
                    <h4 class="cs-section-title">Before vs After</h4>
                    <div class="comparison-grid">
                        <div class="comparison-col old">
                            <div class="comparison-header">THEIR CURRENT SITUATION</div>
                            <ul class="comparison-list">
                                ${p.website
                                    ? `<li class="con">Outdated website (${p.website})</li>`
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
                                <li class="pro">Live in under 48 hours</li>
                            </ul>
                        </div>
                    </div>
                </div>

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
                            "We only work with Hamilton businesses. We're not some overseas agency — we're right here."
                        </li>
                        <li>
                            <strong>Speed advantage:</strong>
                            "Most agencies take 3 months and charge $10k. We launch in 48 hours."
                        </li>
                    </ul>
                </div>

                <div class="cs-section cs-pricing-section">
                    <h4 class="cs-section-title">Recommended Pricing</h4>
                    <div class="pricing-recommendation">
                        <div class="pricing-item">
                            <div class="pricing-label">One-Time Build</div>
                            <div class="pricing-value">${pricing.build}</div>
                        </div>
                        <div class="pricing-item">
                            <div class="pricing-label">Monthly Maintenance</div>
                            <div class="pricing-value">${pricing.maintenance}</div>
                        </div>
                    </div>
                    <div class="pricing-upsell">
                        <strong>Upsell opportunities:</strong> ${pricing.upsells.join(' &bull; ')}
                    </div>
                </div>

                ${LaunchLocal.Grants.renderCheatsheetBlock(p)}

            </div>
        `;

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
        document.querySelector('.cs-sold-btn')?.addEventListener('click', () => {
            this.moveStatus(p.id, 'sold');
            modal.classList.remove('open');
        });

        modal.classList.add('open');
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

            const contactLog = [...(p.contactLog || []), { date, note: notes, outcome }];
            const updates = { contactLog };
            const wasSold = p.status === 'sold';
            if (outcome === 'sold') updates.status = 'sold';
            if (outcome === 'no') updates.status = 'archived';

            await DB.updateDoc('prospects', id, updates);
            await DB.logActivity('visit_logged', 'sales', `logged visit to ${p.businessName} — ${outcome}`, { date, outcome }, id);

            p.contactLog = contactLog;
            if (updates.status) p.status = updates.status;

            if (updates.status === 'sold' && !wasSold) {
                await this.ensureProjectForProspect(p);
            }

            this.renderQueues();
            LaunchLocal.toast('Visit logged.', 'success');
        } catch {
            LaunchLocal.toast('Failed to log visit.', 'error');
        }
    },

    async moveStatus(id, status) {
        try {
            const p = this.prospects.find(x => x.id === id);
            if (!p) return;
            const wasSold = p.status === 'sold';
            await DB.updateDoc('prospects', id, { status });
            await DB.logActivity(status === 'sold' ? 'deal_closed' : 'status_changed', 'sales',
                status === 'sold' ? `SOLD — ${p.businessName}` : `moved ${p.businessName} to ${status}`,
                { status }, id);
            p.status = status;

            if (status === 'sold' && !wasSold) {
                await this.ensureProjectForProspect(p);
            }

            this.renderQueues();
            LaunchLocal.toast(
                status === 'sold' ? `Deal closed! ${p.businessName} is now a client.` : `${p.businessName} marked as ${status}.`,
                status === 'sold' ? 'success' : 'info'
            );
        } catch {
            LaunchLocal.toast('Failed to update status.', 'error');
        }
    },

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
                `created project for new client ${p.businessName}`,
                { prospectId: p.id }, projectId);
        } catch (err) {
            console.warn('ensureProjectForProspect failed:', err);
        }
    },

    getPricing(p) {
        const build = p.prospectScore >= 70 ? '$2,500' : '$1,800';
        const maintenance = '$150/mo';
        const upsells = [];
        if (['salon', 'restaurant'].includes(p.industry)) upsells.push('Online booking ($50/mo)');
        upsells.push('Google Ads setup ($300 one-time)');
        if (!p.facebookUrl) upsells.push('Facebook page setup ($200)');
        return { build, maintenance, upsells };
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
    }
};

Router.register('sales', SalesModule, 'Sales', ['admin', 'sales']);
