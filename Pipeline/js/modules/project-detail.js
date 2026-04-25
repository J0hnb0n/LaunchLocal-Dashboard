/* ============================================
   LaunchLocal — Project Detail Page
   ============================================

   Single-page view for one active job. Four tabs: Site, Sales, Clients,
   Billing. The prospect record drives the lifecycle stage (approved →
   pitched → sold); the project record holds client-side fields (domain,
   fee, renewal, revisions). Billing tab is disabled until status=sold.

   Site-tab logic delegates to SitesModule for prompt generation, probe,
   and QA so we don't duplicate the template + prompt-generator plumbing.
   ============================================ */

const ProjectDetailModule = {
    prospect: null,
    project: null,
    site: null,
    invoices: [],
    activeTab: 'overview',

    async render(container) {
        const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
        const prospectId = params.get('prospect');
        const tab = params.get('tab');
        if (tab) this.activeTab = tab;

        if (!prospectId) {
            container.innerHTML = this.notFound('Missing prospect id.');
            return;
        }

        container.innerHTML = `<div class="loading-screen"><div class="spinner spinner-lg"></div></div>`;

        try {
            await this.loadData(prospectId);
        } catch (err) {
            console.error('Project detail load:', err);
            container.innerHTML = this.notFound('Failed to load project.');
            return;
        }

        if (!this.prospect) {
            container.innerHTML = this.notFound('Project not found.');
            return;
        }

        container.innerHTML = this.getShellHTML();
        Icons.inject(container);
        this.bindShellEvents(container);
        this.renderActiveTab();

        return () => {
            this.prospect = null;
            this.project = null;
            this.site = null;
            this.invoices = [];
            this.activeTab = 'overview';
        };
    },

    async loadData(prospectId) {
        const [prospect, projects, sites, invoices] = await Promise.all([
            DB.getDoc('prospects', prospectId),
            DB.getDocs('projects', { where: [['prospectId', '==', prospectId]] }),
            DB.getDocs('sites', { where: [['prospectId', '==', prospectId]] }),
            DB.getDocs('invoices')
        ]);
        this.prospect = prospect;
        this.project = projects[0] || null;
        this.site = sites[0] || null;
        this.invoices = (invoices || []).filter((inv) =>
            inv.projectId && this.project && inv.projectId === this.project.id
        );
    },

    notFound(message) {
        const icon = window.Icons ? Icons.get('alert', 22) : '';
        return `
            <div class="empty-state">
                <div class="empty-state-icon">${icon}</div>
                <h3 class="empty-state-title">${LaunchLocal.escapeHtml(message)}</h3>
                <p class="empty-state-desc"><a href="#projects">Back to projects</a></p>
            </div>
        `;
    },

    getShellHTML() {
        const p = this.prospect;
        const proj = this.project;
        const isSold = p.status === 'sold';

        const stageBadge = ProjectsModule.stageBadge(p.status);
        const tierBadge = isSold && proj?.maintenanceTier ? `<span class="badge badge-${proj.maintenanceTier}">${proj.maintenanceTier}</span>` : '';

        const billingDisabled = !isSold;

        return `
            <div class="page-header">
                <div>
                    <div class="eyebrow"><a href="#projects">← All Projects</a></div>
                    <h2 class="page-title">${LaunchLocal.escapeHtml(proj?.clientName || p.businessName || 'Project')}</h2>
                    <p class="page-subtitle">${LaunchLocal.escapeHtml(p.address || 'No address on file')}</p>
                </div>
                <div class="page-actions" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
                    ${stageBadge}
                    ${tierBadge}
                </div>
            </div>

            <div class="card">
                <div class="card-header" style="padding:0;">
                    <div class="module-tabs module-tabs-inline" id="pd-tabs" style="width:100%;">
                        <button class="module-tab" data-tab="overview">Overview</button>
                        <button class="module-tab" data-tab="site">Site</button>
                        <button class="module-tab" data-tab="sales">Sales</button>
                        <button class="module-tab" data-tab="clients">Clients</button>
                        <button class="module-tab ${billingDisabled ? 'is-disabled' : ''}" data-tab="billing" ${billingDisabled ? 'aria-disabled="true" tabindex="-1"' : ''}>Billing</button>
                    </div>
                </div>
                <div class="card-body" id="pd-body" style="min-height:240px;">
                    <div class="loading-screen"><div class="spinner"></div></div>
                </div>
            </div>

            <!-- Borrowed modals from SitesModule for prompt gen / QA review -->
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
            <div class="modal-overlay" id="invoice-modal">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">New Invoice</h3>
                        <button class="modal-close" id="invoice-modal-close">&times;</button>
                    </div>
                    <div class="modal-body" id="invoice-modal-body"></div>
                    <div class="modal-footer" id="invoice-modal-footer"></div>
                </div>
            </div>
        `;
    },

    bindShellEvents(container) {
        const tabs = container.querySelector('#pd-tabs');
        tabs?.addEventListener('click', (e) => {
            const btn = e.target.closest('.module-tab');
            if (!btn || btn.classList.contains('is-disabled')) return;
            this.activeTab = btn.getAttribute('data-tab');
            this.renderActiveTab();
        });

        // Generic modal close wiring — each modal has its own close btn id,
        // plus the overlay background closes on click.
        container.querySelectorAll('.modal-overlay').forEach((modal) => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.remove('open');
            });
        });
    },

    renderActiveTab() {
        const body = document.getElementById('pd-body');
        if (!body) return;

        document.querySelectorAll('#pd-tabs .module-tab').forEach((t) => {
            t.classList.toggle('active', t.getAttribute('data-tab') === this.activeTab);
        });

        switch (this.activeTab) {
            case 'overview': return this.renderOverviewTab(body);
            case 'site':     return this.renderSiteTab(body);
            case 'sales':    return this.renderSalesTab(body);
            case 'clients':  return this.renderClientsTab(body);
            case 'billing':  return this.renderBillingTab(body);
            default:         return this.renderOverviewTab(body);
        }
    },

    // =========================================================
    // OVERVIEW TAB
    // =========================================================

    renderOverviewTab(body) {
        const p = this.prospect;
        const proj = this.project;
        const s = this.site;
        const isSold = p.status === 'sold';

        // Pipeline progression (full journey). `new` is always complete
        // once we're on this page since project detail only opens for
        // active jobs.
        const flow = ['new', 'approved', 'site-queued', 'site-ready', 'pitched', 'sold'];
        const stageLabel = { new: 'New', approved: 'Approved', 'site-queued': 'Site Queued', 'site-ready': 'Site Ready', pitched: 'Pitched', sold: 'Sold' };
        const currentIdx = flow.indexOf(p.status);
        const progression = flow.map((stage, i) => {
            const cls = i === currentIdx ? 'active' : i < currentIdx ? 'completed' : '';
            return `<div class="progression-step ${cls}">${stageLabel[stage]}</div>${i < flow.length - 1 ? '<div class="progression-arrow">&#8250;</div>' : ''}`;
        }).join('');

        // Next-action hint
        const nextAction = {
            approved:      'Site generation — head to the Site tab to kick off the prompt.',
            'site-queued': 'Site in progress — run the prompt in Claude Code, then approve QA.',
            'site-ready':  'Time to pitch — open the Sales tab for the cheat sheet.',
            pitched:       'Awaiting decision — log any visit notes and follow up.',
            sold:          'Live client — manage revisions, billing, and renewals from this page.'
        }[p.status] || '';

        // Score breakdown (same layout as Prospects)
        const breakdownHTML = Object.entries(p.scoreBreakdown || {})
            .filter(([, val]) => val > 0)
            .map(([key, val]) => `<tr><td>${this.scoreLabel(key)}</td><td><strong>+${val}</strong></td></tr>`)
            .join('');

        // Billing snapshot — sold clients only
        const billingSnapshot = isSold ? (() => {
            const paid = this.invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + (i.amount || 0), 0);
            const outstanding = this.invoices.filter((i) => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + (i.amount || 0), 0);
            return `
                <div class="detail-section" style="margin-top:var(--space-5);">
                    <h4 class="detail-section-title">Billing Snapshot</h4>
                    <div class="detail-grid">
                        <div>
                            <div class="detail-row"><span>Monthly Fee</span><span class="mono">${LaunchLocal.formatCurrency(proj?.monthlyFee || 0)}</span></div>
                            <div class="detail-row"><span>Renewal Date</span><span class="mono">${proj?.renewalDate || '—'}</span></div>
                            <div class="detail-row"><span>Maintenance Tier</span><span>${proj?.maintenanceTier || '—'}</span></div>
                        </div>
                        <div>
                            <div class="detail-row"><span>Collected</span><span class="mono">${LaunchLocal.formatCurrency(paid)}</span></div>
                            <div class="detail-row"><span>Outstanding</span><span class="mono ${outstanding > 0 ? 'text-warning' : ''}">${LaunchLocal.formatCurrency(outstanding)}</span></div>
                            <div class="detail-row"><span>Invoices</span><span class="mono">${this.invoices.length}</span></div>
                        </div>
                    </div>
                </div>
            `;
        })() : '';

        // Contact log (if any)
        const contactLog = (p.contactLog || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));

        // Key dates
        const fmtTs = (ts) => {
            if (!ts) return '—';
            const d = ts.toMillis ? new Date(ts.toMillis()) : new Date(ts);
            return isNaN(d) ? '—' : d.toLocaleDateString('en-CA');
        };
        const approvedDate = proj?.createdAt ? fmtTs(proj.createdAt) : '—';
        const prospectDate = p.createdAt ? fmtTs(p.createdAt) : '—';

        body.innerHTML = `
            <div class="detail-section">
                <h4 class="detail-section-title">Pipeline Progress</h4>
                <div class="status-progression">${progression}</div>
                ${nextAction ? `<p class="text-muted text-sm" style="margin-top:var(--space-3);"><strong>Next:</strong> ${nextAction}</p>` : ''}
            </div>

            <div class="detail-grid" style="margin-top:var(--space-5);">
                <div class="detail-section">
                    <h4 class="detail-section-title">Business Info</h4>
                    <div class="detail-row">
                        <span>Business Name</span>
                        <span><input class="form-input pd-ov-input" id="ov-businessName" value="${LaunchLocal.escapeHtml(p.businessName || '')}" placeholder="Business name"></span>
                    </div>
                    <div class="detail-row">
                        <span>Address</span>
                        <span><input class="form-input pd-ov-input" id="ov-address" value="${LaunchLocal.escapeHtml(p.address || '')}" placeholder="123 Main St, City, Province"></span>
                    </div>
                    <div class="detail-row">
                        <span>Website</span>
                        <span><input class="form-input pd-ov-input" id="ov-website" value="${LaunchLocal.escapeHtml(p.website || '')}" placeholder="https://…"></span>
                    </div>
                    <div class="detail-row">
                        <span>Industry</span>
                        <span>
                            <select class="form-input pd-ov-input" id="ov-industry">
                                ${['restaurant','tradesperson','salon','retail','other'].map((opt) =>
                                    `<option value="${opt}" ${opt === (p.industry || 'other') ? 'selected' : ''}>${opt}</option>`
                                ).join('')}
                            </select>
                        </span>
                    </div>
                    <div class="detail-row"><span>Google Rating</span><span>${p.googleRating ? `&#9733; ${p.googleRating} (${p.reviewCount || 0} reviews)` : '—'}</span></div>
                    ${p.facebookUrl ? `<div class="detail-row"><span>Facebook</span><span><a href="${p.facebookUrl}" target="_blank" rel="noopener">View page</a></span></div>` : ''}
                    ${p.hotLead ? `<div class="detail-row"><span>Flags</span><span><span class="badge badge-warning">&#9733; Hot Lead</span></span></div>` : ''}
                    ${LaunchLocal.Grants.renderProspectRow(p)}
                </div>

                <div class="detail-section">
                    <h4 class="detail-section-title">Contact</h4>
                    <div class="detail-row">
                        <span>Name</span>
                        <span><input class="form-input pd-ov-input" id="ov-contactName" value="${LaunchLocal.escapeHtml(p.contactName || '')}" placeholder="Owner / primary contact"></span>
                    </div>
                    <div class="detail-row">
                        <span>Phone</span>
                        <span><input class="form-input pd-ov-input" id="ov-phone" value="${LaunchLocal.escapeHtml(p.phone || '')}" placeholder="(905) 555-0123"></span>
                    </div>
                    <div class="detail-row">
                        <span>Email</span>
                        <span><input type="email" class="form-input pd-ov-input" id="ov-email" value="${LaunchLocal.escapeHtml(p.email || '')}" placeholder="owner@example.com"></span>
                    </div>

                    <h4 class="detail-section-title" style="margin-top:var(--space-5);">
                        Score Breakdown &nbsp;
                        <span class="score-pill ${this.scoreClass(p.prospectScore)}">${p.prospectScore}</span>
                    </h4>
                    <table class="score-breakdown-table">
                        <thead><tr><th>Factor</th><th>Points</th></tr></thead>
                        <tbody>${breakdownHTML || '<tr><td colspan="2" class="text-muted">No breakdown recorded.</td></tr>'}</tbody>
                    </table>

                    <div style="margin-top:var(--space-4);">
                        <div class="detail-row"><span>Prospect added</span><span class="mono">${prospectDate}</span></div>
                        <div class="detail-row"><span>Approved</span><span class="mono">${approvedDate}</span></div>
                        ${s ? `<div class="detail-row"><span>Site status</span><span>${LaunchLocal.escapeHtml(s.qaStatus || s.status || '—')}</span></div>` : ''}
                    </div>
                </div>
            </div>

            <div class="project-card-actions" style="margin-top:var(--space-4);">
                <button class="btn btn-primary" id="ov-save-btn"><span data-icon="check"></span>Save Changes</button>
            </div>

            ${billingSnapshot}

            ${p.notes ? `
                <div class="detail-section" style="margin-top:var(--space-5);">
                    <h4 class="detail-section-title">Notes</h4>
                    <p class="text-sm">${LaunchLocal.escapeHtml(p.notes)}</p>
                </div>
            ` : ''}

            ${contactLog.length > 0 ? `
                <div class="detail-section" style="margin-top:var(--space-5);">
                    <h4 class="detail-section-title">Contact History</h4>
                    ${contactLog.map((c) => `
                        <div class="contact-log-entry">
                            <span class="log-date">${LaunchLocal.escapeHtml(c.date || '')}</span> — ${LaunchLocal.escapeHtml(c.note || '')}
                            ${c.outcome ? `<span class="chip" style="margin-left:8px;">${LaunchLocal.escapeHtml(c.outcome)}</span>` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;

        Icons.inject(body);
        document.getElementById('ov-save-btn')?.addEventListener('click', () => this.saveOverview());
    },

    async saveOverview() {
        const p = this.prospect;
        if (!p) return;
        const btn = document.getElementById('ov-save-btn');

        const val = (id) => document.getElementById(id)?.value?.trim() ?? '';
        const updates = {};
        const fields = {
            businessName: val('ov-businessName'),
            address:      val('ov-address'),
            website:      val('ov-website') || null,
            industry:     val('ov-industry'),
            contactName:  val('ov-contactName') || null,
            phone:        val('ov-phone') || null,
            email:        val('ov-email') || null
        };

        if (!fields.businessName) {
            LaunchLocal.toast('Business name cannot be empty.', 'warning');
            return;
        }

        for (const [key, next] of Object.entries(fields)) {
            const curr = p[key] ?? (typeof next === 'string' ? '' : null);
            // Treat '' and null as equivalent so we don't write empty-string
            // changes when the field was already null.
            const changed = (curr || null) !== (next || null);
            if (changed) updates[key] = next;
        }

        if (Object.keys(updates).length === 0) {
            LaunchLocal.toast('No changes to save.', 'info', 2000);
            return;
        }

        btn?.classList.add('btn-loading');
        try {
            await DB.updateDoc('prospects', p.id, updates);
            await DB.logActivity('prospect_edited', 'prospects',
                `updated ${p.businessName || 'prospect'}: ${Object.keys(updates).join(', ')}`,
                updates, p.id);

            Object.assign(p, updates);

            // If the business name changed, mirror it onto the project's
            // clientName so the header + cards stay aligned (but don't
            // clobber an already-customized clientName).
            if (updates.businessName && this.project && (!this.project.clientName || this.project.clientName === p.businessName)) {
                await DB.updateDoc('projects', this.project.id, { clientName: updates.businessName });
                this.project.clientName = updates.businessName;
            }

            LaunchLocal.toast('Changes saved.', 'success');
            this.renderActiveTab();
        } catch (err) {
            console.error('saveOverview failed:', err);
            LaunchLocal.toast('Failed to save changes.', 'error');
        } finally {
            btn?.classList.remove('btn-loading');
        }
    },

    scoreClass(score) {
        if (score >= 80) return 'score-hot';
        if (score >= 50) return 'score-high';
        if (score >= 20) return 'score-medium';
        return 'score-low';
    },

    scoreLabel(key) {
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
    },

    // =========================================================
    // SITE TAB
    // =========================================================

    async renderSiteTab(body) {
        const p = this.prospect;
        const s = this.site;

        if (!s) {
            body.innerHTML = `
                <div class="empty-state" style="padding:40px 16px;">
                    <div class="empty-state-icon">&#10010;</div>
                    <h3 class="empty-state-title">Ready to generate site</h3>
                    <p class="empty-state-desc">Create a site prompt for Claude Code — the build will land in <code>Client-Sites/${LaunchLocal.escapeHtml(LaunchLocal.Slug.fromBusinessName(p.businessName) || p.id)}/</code>.</p>
                    <button class="btn btn-primary" id="pd-generate-btn">Generate Prompt</button>
                </div>
            `;
            document.getElementById('pd-generate-btn')?.addEventListener('click', () => this.openGenerateForm(p, null));
            return;
        }

        // Have a site doc. Pick the right view based on status.
        if (s.status === 'prompt-generated' && !s.qaStatus) {
            body.innerHTML = `
                <div class="detail-section">
                    <h4 class="detail-section-title">Prompt Ready</h4>
                    <p class="text-sm">Prompt generated — run it in Claude Code. Files auto-upload when the session ends; this view flips to "Awaiting QA" within ~10 seconds.</p>
                </div>
                <div class="project-card-actions">
                    <button class="btn btn-primary" id="pd-view-prompt-btn">View Prompt</button>
                    <button class="btn btn-success" id="pd-check-btn">Refresh</button>
                    <button class="btn btn-ghost" id="pd-regenerate-btn">Regenerate</button>
                </div>
            `;
            document.getElementById('pd-view-prompt-btn')?.addEventListener('click', () => this.openPromptResult(s));
            document.getElementById('pd-check-btn')?.addEventListener('click', () => this.refreshSite());
            document.getElementById('pd-regenerate-btn')?.addEventListener('click', () => this.openRegenerate());
            return;
        }

        // Built + possibly approved
        const qaConfig = {
            pending: { badge: 'badge-warning', label: 'Awaiting QA' },
            approved: { badge: 'badge-success', label: 'Approved' },
            'revision-needed': { badge: 'badge-danger', label: 'Needs Revision' }
        };
        const cfg = qaConfig[s.qaStatus] || { badge: 'badge-neutral', label: s.qaStatus || '—' };

        const previewUrl = SitesModule.previewUrlFor(s);
        const previewBlock = previewUrl ? `
            <div class="site-preview-frame-wrap">
                <div class="site-preview-frame-toolbar">
                    <span class="site-preview-frame-url">${LaunchLocal.escapeHtml(previewUrl)}</span>
                    <a class="btn btn-ghost btn-sm" href="${LaunchLocal.escapeHtml(previewUrl)}" target="_blank" rel="noopener">Open in new tab &#8599;</a>
                </div>
                <iframe class="site-preview-frame" src="${LaunchLocal.escapeHtml(previewUrl)}" title="Site preview" loading="lazy"></iframe>
            </div>
        ` : `
            <div class="alert alert-info" style="margin-bottom:16px;">
                <span>&#8505;</span>
                <span>No upload detected yet. Run the prompt in Claude Code — files auto-upload when the session ends.</span>
            </div>
        `;

        body.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:var(--space-3);flex-wrap:wrap;">
                <span class="badge ${cfg.badge}">${cfg.label}</span>
                <span class="industry-tag">${LaunchLocal.escapeHtml(s.templateUsed || 'default')}</span>
            </div>
            ${previewBlock}
            ${s.qaFeedback ? `
                <div class="detail-section" style="margin-top:12px;">
                    <h4 class="detail-section-title">Last QA Feedback</h4>
                    <p class="text-sm">${LaunchLocal.escapeHtml(s.qaFeedback)}</p>
                </div>` : ''}
            <div class="project-card-actions" style="margin-top:var(--space-4);">
                ${s.qaStatus === 'pending' ? `<button class="btn btn-success" id="pd-qa-approve-btn">Approve Site</button>` : ''}
                <button class="btn btn-secondary" id="pd-qa-review-btn">QA Review</button>
                <button class="btn btn-ghost" id="pd-regenerate-btn">Regenerate</button>
                ${!previewUrl ? `<button class="btn btn-ghost" id="pd-check-btn">Refresh</button>` : ''}
            </div>
        `;

        document.getElementById('pd-qa-approve-btn')?.addEventListener('click', () => this.updateQAStatus('approved', ''));
        document.getElementById('pd-qa-review-btn')?.addEventListener('click', () => this.openQA());
        document.getElementById('pd-regenerate-btn')?.addEventListener('click', () => this.openRegenerate());
        document.getElementById('pd-check-btn')?.addEventListener('click', () => this.refreshSite());
    },

    // ----- Site helpers (delegate to SitesModule for heavy lifting) -----

    openGenerateForm(prospect, existingSite) {
        // Load SitesModule's state so its helpers work
        SitesModule.sites = this.site ? [this.site] : [];
        SitesModule.prospects = [prospect];
        SitesModule.selectedProspect = prospect;
        SitesModule.regeneratingSiteId = existingSite ? existingSite.id : null;

        document.getElementById('generate-modal').classList.add('open');
        SitesModule.openGenerateForm(prospect, existingSite);

        // Intercept submit so we can refresh THIS page, not the Sites page.
        const submitBtn = document.getElementById('generate-submit-btn');
        const origSubmit = submitBtn.onclick;
        submitBtn.onclick = async () => {
            try {
                await SitesModule.onGenerateSubmit();
            } finally {
                await this.loadData(prospect.id);
                this.renderActiveTab();
            }
        };
    },

    openRegenerate() {
        const s = this.site;
        if (!s) return;
        const hasProgress = s.qaStatus === 'approved' || s.status === 'files-uploaded' || s.filesUploadedAt;
        if (hasProgress) {
            const ok = window.confirm('This site already has a built/approved version. Regenerating will reset it and clear QA status. Continue?');
            if (!ok) return;
        }
        this.openGenerateForm(this.prospect, s);
    },

    openPromptResult(site) {
        SitesModule.sites = [site];
        SitesModule.openPromptResult(site.id);
    },

    async refreshSite() {
        const s = this.site;
        if (!s) return;
        SitesModule.sites = [s];
        await SitesModule.refreshSite(s.id);
        await this.loadData(this.prospect.id);
        this.renderActiveTab();
    },

    openQA() {
        const s = this.site;
        if (!s) return;
        SitesModule.sites = [s];
        SitesModule.openQA(s.id);

        // SitesModule.openQA already wired approve/revision buttons to call
        // updateQAStatus; replace those handlers with ours so we can refresh
        // this page deterministically after the write (no setTimeout race).
        const approveBtn = document.getElementById('qa-approve-btn');
        if (approveBtn) {
            approveBtn.replaceWith(approveBtn.cloneNode(true));
            document.getElementById('qa-approve-btn').addEventListener('click', async () => {
                const feedback = document.getElementById('qa-feedback')?.value || '';
                await this.updateQAStatus('approved', feedback);
                document.getElementById('qa-modal')?.classList.remove('open');
            });
        }
        const revisionBtn = document.getElementById('qa-revision-btn');
        if (revisionBtn) {
            revisionBtn.replaceWith(revisionBtn.cloneNode(true));
            document.getElementById('qa-revision-btn').addEventListener('click', async () => {
                const feedback = document.getElementById('qa-feedback')?.value.trim() || '';
                if (!feedback) {
                    LaunchLocal.toast('Please add revision notes before requesting a revision.', 'warning');
                    return;
                }
                await this.updateQAStatus('revision-needed', feedback);
                document.getElementById('qa-modal')?.classList.remove('open');
            });
        }
    },

    async updateQAStatus(status, feedback) {
        const s = this.site;
        if (!s) return;
        SitesModule.sites = [s];
        await SitesModule.updateQAStatus(s.id, status, feedback);
        await this.loadData(this.prospect.id);
        this.renderActiveTab();
    },

    // =========================================================
    // SALES TAB
    // =========================================================

    renderSalesTab(body) {
        const p = this.prospect;
        const s = this.site;
        const siteReady = s && s.qaStatus === 'approved';
        const contactLog = (p.contactLog || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));

        const pricing = this.getPricing(p);

        let stageActions = '';
        if (p.status === 'site-ready') {
            stageActions = `
                <button class="btn btn-secondary" id="pd-pitched-btn">Mark Pitched</button>
                <button class="btn btn-secondary" id="pd-visit-btn">Log Visit</button>
            `;
        } else if (p.status === 'pitched') {
            stageActions = `
                <button class="btn btn-success" id="pd-sold-btn">Mark Sold</button>
                <button class="btn btn-secondary" id="pd-visit-btn">Log Visit</button>
            `;
        } else if (p.status === 'sold') {
            const isAdmin = LaunchLocal.currentUser?.role === 'admin';
            stageActions = `
                <p class="text-muted">Client is sold — see the Clients tab for ongoing work.</p>
                ${isAdmin ? `<button class="btn btn-ghost btn-sm" id="pd-rollback-btn" style="color: var(--danger);">Roll back to Prospect</button>` : ''}
            `;
        } else {
            stageActions = `
                <p class="text-muted text-sm">Sales actions unlock once the site has been QA-approved.</p>
                <button class="btn btn-ghost btn-sm" id="pd-visit-btn">Log Visit</button>
            `;
        }

        // --- Cheat-sheet content (formerly the modal) ---
        const beforeItems = [
            p.website
                ? `<li class="con">Outdated website (${LaunchLocal.escapeHtml(p.website)})</li>`
                : `<li class="con">No website whatsoever</li>`,
            p.scoreBreakdown?.noSSL ? `<li class="con">No SSL — Chrome marks it "Not Secure"</li>` : '',
            p.scoreBreakdown?.noMobile ? `<li class="con">Not mobile-friendly — 60%+ of searches are mobile</li>` : '',
            p.scoreBreakdown?.pageSpeed ? `<li class="con">Slow load speed — visitors bounce in under 3s</li>` : '',
            `<li class="con">Missing out on local search traffic</li>`,
            `<li class="con">Competitors with modern sites are outranking them</li>`
        ].filter(Boolean).join('');

        const afterItems = [
            `<li class="pro">Modern, mobile-first design</li>`,
            `<li class="pro">SSL secured (https://)</li>`,
            `<li class="pro">PageSpeed score 95+</li>`,
            `<li class="pro">Google Business Profile integration</li>`,
            `<li class="pro">Click-to-call &amp; contact form</li>`,
            `<li class="pro">Live in under 48 hours</li>`
        ].join('');

        const talkingPoints = [
            `<li><strong>Open with their reviews:</strong> "You have ${p.reviewCount || 'a lot of'} Google reviews — imagine how many more customers you'd get if people could actually find your website."</li>`,
            p.prospectScore >= 70 ? `<li><strong>Create urgency:</strong> "This is a high-opportunity area — your competitors are already investing in their online presence."</li>` : '',
            !p.website ? `<li><strong>No-risk offer:</strong> "We've already built your site — you'll see it today before you decide anything."</li>` : '',
            `<li><strong>Local credibility:</strong> "We only work with Hamilton businesses. We're not some overseas agency — we're right here."</li>`,
            `<li><strong>Speed advantage:</strong> "Most agencies take 3 months and charge $10k. We launch in 48 hours."</li>`
        ].filter(Boolean).join('');

        body.innerHTML = `
            <div class="detail-grid">
                <div class="detail-section">
                    <h4 class="detail-section-title">Contact</h4>
                    <div class="detail-row"><span>Phone</span><span>${LaunchLocal.escapeHtml(p.phone || '—')}</span></div>
                    <div class="detail-row"><span>Email</span><span>${LaunchLocal.escapeHtml(p.email || '—')}</span></div>
                    <div class="detail-row"><span>Website</span><span>${p.website ? `<a href="${p.website}" target="_blank" rel="noopener">${LaunchLocal.escapeHtml(p.website)}</a>` : '<em>None</em>'}</span></div>
                    <div class="detail-row"><span>Google</span><span>${p.googleRating ? `&#9733; ${p.googleRating} (${p.reviewCount || 0})` : '—'}</span></div>
                </div>
                <div class="detail-section">
                    <h4 class="detail-section-title">Recommended Pricing</h4>
                    <div class="detail-row"><span>One-time build</span><span class="mono">${pricing.build}</span></div>
                    <div class="detail-row"><span>Monthly maintenance</span><span class="mono">${pricing.maintenance}</span></div>
                    <div class="detail-row"><span>Upsells</span><span>${pricing.upsells.join(' &bull; ')}</span></div>
                </div>
            </div>

            <div class="detail-section" style="margin-top:var(--space-5);">
                <h4 class="detail-section-title">Before vs After</h4>
                <div class="comparison-grid">
                    <div class="comparison-col old">
                        <div class="comparison-header">THEIR CURRENT SITUATION</div>
                        <ul class="comparison-list">${beforeItems}</ul>
                    </div>
                    <div class="comparison-col new">
                        <div class="comparison-header">WITH LAUNCHLOCAL</div>
                        <ul class="comparison-list">${afterItems}</ul>
                    </div>
                </div>
            </div>

            <div class="detail-section" style="margin-top:var(--space-5);">
                <h4 class="detail-section-title">Talking Points</h4>
                <ul class="talking-points">${talkingPoints}</ul>
            </div>

            <details class="pd-collapse" style="margin-top:var(--space-5);">
                <summary><span class="pd-collapse-chevron">▸</span> Sales Script &mdash; <span class="text-muted">full call playbook</span></summary>
                <div class="pd-collapse-body">
                    ${this.renderSalesScript(p)}
                </div>
            </details>

            <details class="pd-collapse" style="margin-top:var(--space-3);">
                <summary><span class="pd-collapse-chevron">▸</span> Government Grants &mdash; <span class="text-muted">open to see matches</span></summary>
                <div class="pd-collapse-body">
                    ${LaunchLocal.Grants.renderCheatsheetBlock(p)}
                </div>
            </details>

            <div class="detail-section" style="margin-top:var(--space-5);">
                <h4 class="detail-section-title">Stage Actions</h4>
                <div class="project-card-actions">${stageActions}</div>
                ${(() => { const u = SitesModule.previewUrlFor(s); return siteReady && u ? `<a class="btn btn-ghost btn-sm" href="${LaunchLocal.escapeHtml(u)}" target="_blank" rel="noopener" style="margin-top:8px;">Open built site &#8599;</a>` : ''; })()}
            </div>

            <div class="detail-section" style="margin-top:var(--space-5);">
                <h4 class="detail-section-title">Contact History</h4>
                ${contactLog.length > 0
                    ? contactLog.map((c) => `
                        <div class="contact-log-entry">
                            <span class="log-date">${LaunchLocal.escapeHtml(c.date || '')}</span> — ${LaunchLocal.escapeHtml(c.note || '')}
                            ${c.outcome ? ` <span class="chip">${LaunchLocal.escapeHtml(c.outcome)}</span>` : ''}
                        </div>`).join('')
                    : '<p class="text-muted text-sm">No contact history yet.</p>'
                }
            </div>
        `;

        document.getElementById('pd-pitched-btn')?.addEventListener('click', () => this.advanceStatus('pitched'));
        document.getElementById('pd-sold-btn')?.addEventListener('click', () => this.advanceStatus('sold'));
        document.getElementById('pd-visit-btn')?.addEventListener('click', () => this.openVisitLog());
        document.getElementById('pd-rollback-btn')?.addEventListener('click', () => this.rollbackToProspect());
    },

    openVisitLog() {
        SalesModule.prospects = [this.prospect];
        SalesModule.openVisitLog(this.prospect.id);

        document.getElementById('visit-save')?.addEventListener('click', () => {
            setTimeout(async () => {
                await this.loadData(this.prospect.id);
                this.renderActiveTab();
            }, 300);
        });
    },

    /**
     * Roll a sold client back to a site-ready prospect. Deletes the project
     * doc + any invoices linked to the prospect; resets prospect.status to
     * 'site-ready'. Site files in Storage are kept untouched.
     *
     * Admin-only — the gate is also enforced by the button visibility, but
     * Firestore rules ultimately back-stop this.
     */
    async rollbackToProspect() {
        const p = this.prospect;
        const proj = this.project;
        if (p.status !== 'sold') {
            LaunchLocal.toast('Only sold clients can be rolled back.', 'warning');
            return;
        }

        // Quick count of invoices we'd delete, for a clearer confirm prompt
        let invoiceCount = 0;
        try {
            const invs = await DB.getDocs('invoices', { where: [['prospectId', '==', p.id]] });
            invoiceCount = invs.length;
        } catch { /* fall through — confirm without count */ }

        const ok = window.confirm(
            `Roll ${p.businessName} back from a client to a prospect?\n\n`
            + `This will:\n`
            + `  • delete the project record (revisions, comms log, sale info)\n`
            + (invoiceCount > 0 ? `  • delete ${invoiceCount} invoice${invoiceCount === 1 ? '' : 's'} linked to this prospect\n` : '')
            + `  • set the prospect back to "site-ready"\n\n`
            + `Site files in Storage and the QA-approved site doc are kept.\n`
            + `This cannot be undone.`
        );
        if (!ok) return;

        try {
            if (proj) {
                await DB.deleteDoc('projects', proj.id);
            }

            const invs = await DB.getDocs('invoices', { where: [['prospectId', '==', p.id]] });
            for (const inv of invs) {
                await DB.deleteDoc('invoices', inv.id);
            }

            await DB.updateDoc('prospects', p.id, { status: 'site-ready' });

            await DB.logActivity(
                'project_rolled_back',
                'projects',
                `Reset ${p.businessName} from client back to prospect (site-ready)`,
                { prospectId: p.id, projectId: proj ? proj.id : null, invoicesDeleted: invs.length },
                proj ? proj.id : p.id
            );

            LaunchLocal.toast(
                invs.length > 0
                    ? `${p.businessName} rolled back. Deleted project + ${invs.length} invoice${invs.length === 1 ? '' : 's'}.`
                    : `${p.businessName} rolled back to prospect.`,
                'success'
            );

            // Send the operator to the prospect's pre-sale view
            setTimeout(() => { window.location.hash = '#prospects'; }, 1200);
        } catch (err) {
            console.error('rollbackToProspect failed:', err);
            LaunchLocal.toast('Failed to roll back. Check console for details.', 'error');
        }
    },

    async advanceStatus(newStatus) {
        const p = this.prospect;
        try {
            const wasSold = p.status === 'sold';
            await DB.updateDoc('prospects', p.id, { status: newStatus });
            await DB.logActivity(
                newStatus === 'sold' ? 'deal_closed' : 'status_changed',
                'sales',
                newStatus === 'sold' ? `SOLD — ${p.businessName}` : `moved ${p.businessName} to ${newStatus}`,
                { status: newStatus }, p.id
            );
            p.status = newStatus;

            // ensureProjectForProspect guards against dupes so this is safe.
            if (newStatus === 'sold' && !wasSold && ProspectsModule.ensureProjectForProspect) {
                await ProspectsModule.ensureProjectForProspect(p);
            }

            await this.loadData(p.id);
            // Refresh shell + header since stage badge moved
            document.getElementById('module-content').innerHTML = this.getShellHTML();
            Icons.inject(document.getElementById('module-content'));
            this.bindShellEvents(document.getElementById('module-content'));
            if (newStatus === 'sold') this.activeTab = 'clients';
            this.renderActiveTab();
            LaunchLocal.toast(
                newStatus === 'sold'
                    ? `Deal closed! ${p.businessName} is now a client.`
                    : `${p.businessName} marked ${newStatus}.`,
                newStatus === 'sold' ? 'success' : 'info'
            );
        } catch {
            LaunchLocal.toast('Failed to update status.', 'error');
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

    /**
     * Full sales call playbook — adapted Alex Hormozi / CLOSER framework
     * for local-business website sales. Reads top-to-bottom during a call.
     * Injected prospect-specific bits keep the scripts concrete.
     */
    renderSalesScript(p) {
        const bizName = LaunchLocal.escapeHtml(p.businessName || 'their business');
        const reviewCount = p.reviewCount || 0;
        const industry = LaunchLocal.escapeHtml(p.industry || 'local');
        const hasWebsite = !!p.website;
        const pricing = this.getPricing(p);

        return `
            <div class="script-intro">
                <p class="text-sm"><strong>Framework:</strong> CLOSER &mdash; <em>Clarify, Label, Overview, Sell, Explain, Reinforce</em>. Work the call in order. Don't pitch until you've discovered. Don't close until you've handled objections.</p>
                <p class="text-sm"><strong>Core rule:</strong> You're not here to sell. You're here to decide whether ${bizName} is a fit. If they're not, say so and move on &mdash; your time is more valuable than any single deal.</p>
            </div>

            <h5 class="script-step">1 &middot; Pre-Call (60 seconds before dialing)</h5>
            <ul class="script-list">
                <li>Open their built site in another tab &mdash; you'll screenshare or walk them through it live.</li>
                <li>Scan their Google reviews: ${reviewCount} to reference. Find one or two recent ones you can quote.</li>
                <li>Check their existing site${hasWebsite ? ' — look for SSL warnings, mobile failures, slow load, outdated copyright' : ' (they don\'t have one)'}.</li>
                <li>Mindset: confident, calm, genuinely curious. You are the expert. Act like it.</li>
            </ul>

            <h5 class="script-step">2 &middot; The Opening (first 30 seconds)</h5>
            <div class="script-callout">
                "Hi [owner name], this is [your name] with LaunchLocal. Quick 30 seconds &mdash; we only work with ${industry} businesses in [their area], and ${bizName} came up on my list because ${hasWebsite ? 'your site is missing some basics that are costing you traffic' : 'you\'re running a 5-star business with zero online presence'}. Got a minute to hear why I called?"
            </div>
            <p class="text-sm text-muted">Why this works: specific reason, permission-based, frames you as selective (not desperate).</p>

            <h5 class="script-step">3 &middot; Clarify (C) &mdash; understand their world</h5>
            <p class="text-sm">Ask. Listen. Don't pitch yet.</p>
            <ul class="script-list">
                <li>"Walk me through how customers find you right now &mdash; is it mostly foot traffic, word of mouth, or online?"</li>
                <li>"When's the last time you really pushed to grow your online presence?"</li>
                <li>"If you had 10 more of the <em>right</em> customers walking in next month, would that change anything for you?"</li>
            </ul>

            <h5 class="script-step">4 &middot; Label (L) &mdash; name their problem back to them</h5>
            <div class="script-callout">
                "So what I'm hearing is &mdash; you've got a great business, ${reviewCount ? `${reviewCount} people have said so publicly, ` : ''}but anyone searching online can't find you, can't trust you when they do, or can't easily reach you. Is that fair?"
            </div>
            <p class="text-sm text-muted">Goal: get them to say "yes" out loud. That's the first micro-commitment.</p>

            <h5 class="script-step">5 &middot; Overview past pain (O) &mdash; make them feel the cost of inaction</h5>
            <ul class="script-list">
                <li>"What have you tried in the past to fix this? How did that go?"</li>
                <li>"Any idea what that cost you &mdash; in dollars, in time, in frustration?"</li>
                <li>"If nothing changes in the next 6 months, what does that look like?"</li>
            </ul>
            <p class="text-sm text-muted">Do NOT rescue them here. Let the silence sit. They need to feel it.</p>

            <h5 class="script-step">6 &middot; Sell the vision (S) &mdash; paint the future state</h5>
            <p class="text-sm">Be specific, not generic. Use THEIR details.</p>
            <div class="script-callout">
                "Imagine this: someone in [neighborhood] pulls out their phone at 9pm looking for a ${industry} business. They search. ${bizName} shows up first. They see your ${p.googleRating ? `${p.googleRating}-star rating` : 'reviews'}, they click 'Call,' and your phone rings. That's this time next month &mdash; if we start today."
            </div>

            <h5 class="script-step">7 &middot; Present the offer</h5>
            <p class="text-sm"><strong>Walk them through the site you already built for them.</strong> This is your unfair advantage. Nobody else pitches a finished product.</p>
            <ul class="script-list">
                <li>Show it on their phone (they will too). "This is yours. Built for you. Not a template."</li>
                <li>Anchor the price: "A typical agency quotes ${industry} businesses $8k&ndash;$12k and takes 3 months."</li>
                <li>Drop your price: "${pricing.build} one-time, ${pricing.maintenance} to keep it running, live in 48 hours."</li>
                <li>Explain the value equation in plain terms: <em>Dream outcome (new customers) &divide; Time &amp; effort (none &mdash; we do it all) = highest-leverage thing you'll buy this year.</em></li>
            </ul>

            <h5 class="script-step">8 &middot; Explain away concerns (E) &mdash; objection scripts</h5>

            <div class="objection">
                <strong class="objection-label">"I need to think about it."</strong>
                <p class="text-sm"><em>Translation: vague = something specific is wrong. Force specificity.</em></p>
                <div class="script-callout">"Totally fair. Just so I don't leave you hanging &mdash; is it the price, the timing, or whether this will actually work for you? Those are the three things people usually mean when they say that."</div>
            </div>

            <div class="objection">
                <strong class="objection-label">"It's too expensive."</strong>
                <p class="text-sm"><em>Math it out. Lifetime value &gt; one-time cost, always.</em></p>
                <div class="script-callout">"Compared to what? Let me ask &mdash; what's one new ${industry} customer worth to you over a year? If this brings you even ONE more per month, we've paid for ourselves five times over. Does that math work for you?"</div>
            </div>

            <div class="objection">
                <strong class="objection-label">"I already have a website."</strong>
                <p class="text-sm"><em>Open it. Show them what's broken. Don't editorialize &mdash; point at the facts.</em></p>
                <div class="script-callout">"Can we look at it together right now? Sometimes what seems fine actually has issues Google is punishing you for. I'll take 30 seconds."</div>
                <p class="text-sm">Then point at: missing SSL, not mobile-friendly, slow load, old copyright year, no Google Business link. Facts, not opinions.</p>
            </div>

            <div class="objection">
                <strong class="objection-label">"I don't need more customers / I'm too busy already."</strong>
                <div class="script-callout">"Good &mdash; that's a great problem. Most owners I talk to would kill for that. Question though: are all your current customers the <em>right</em> kind? Would you take more if they were higher-ticket / easier / closer?"</div>
            </div>

            <div class="objection">
                <strong class="objection-label">"Just send me some info by email."</strong>
                <p class="text-sm"><em>Email kills deals. 95% never open, 99% never reply. Redirect to live show.</em></p>
                <div class="script-callout">"I could, but honestly the email would say nothing you don't already know. The thing that actually matters is seeing your site &mdash; not a brochure, your <em>actual</em> site we built. Can I take 60 seconds and show you?"</div>
            </div>

            <div class="objection">
                <strong class="objection-label">"I need to talk to my [spouse/partner]."</strong>
                <p class="text-sm"><em>Often real, sometimes a stall. Find out which.</em></p>
                <div class="script-callout">"Completely fair. One question &mdash; if they said yes tomorrow, would YOU be ready to move forward today? I just want to make sure I'm not coming back to a different objection."</div>
                <p class="text-sm">If real: book the three-way call now. "What time tomorrow works for both of you?" Never leave scheduling open.</p>
            </div>

            <h5 class="script-step">9 &middot; Reinforce &amp; close (R) &mdash; two-option close</h5>
            <p class="text-sm"><strong>Never ask yes/no.</strong> Offer two yesses.</p>
            <div class="script-callout">
                "So &mdash; want to start with just the website, or should we roll the Google Business setup in too since you're already missing calls from searches? Either works, I just need to know which one."
            </div>

            <h5 class="script-step">10 &middot; The Silence Rule</h5>
            <p class="text-sm">After you ask the closing question: <strong>SHUT UP.</strong> First person to talk loses. It will feel long. Count to 30 if you have to. Let them think.</p>

            <h5 class="script-step">11 &middot; If it's a yes</h5>
            <ul class="script-list">
                <li>Don't oversell. Say "awesome" and move to logistics.</li>
                <li>Collect deposit on the spot if possible &mdash; card, e-transfer, whatever removes friction.</li>
                <li>Set the next touchpoint: "I'll have the site live by [date]. You'll hear from me tomorrow with the domain question."</li>
            </ul>

            <h5 class="script-step">12 &middot; If it's a no (or soft no)</h5>
            <ul class="script-list">
                <li>"Totally fair. Can I ask &mdash; what would have to be different for this to be a yes?" (future-pacing)</li>
                <li>Log the real objection. Don't guess &mdash; ask.</li>
                <li>End warm: "Appreciate the time. I'll check back in [timeframe] in case anything changes." Book the follow-up in their calendar while you're on the phone.</li>
            </ul>

            <h5 class="script-step">13 &middot; Follow-Up Cadence</h5>
            <ul class="script-list">
                <li><strong>Same day:</strong> one text or short email &mdash; "great talking, here's the site link if you want to share it." Nothing salesy.</li>
                <li><strong>48 hours:</strong> quick call, not email. One new data point (a recent competitor launch, a local search stat, a review they just got).</li>
                <li><strong>1 week:</strong> new angle, not "checking in." Bring news.</li>
                <li><strong>2+ weeks with no engagement:</strong> archive and move on. You only have so many hours.</li>
            </ul>

            <div class="script-footer">
                <p class="text-sm text-muted"><strong>Remember:</strong> people don't buy the best offer. They buy the clearest offer from the person they trust the most. Be clear. Be direct. Don't waste their time.</p>
            </div>
        `;
    },

    // =========================================================
    // CLIENTS TAB (post-sale)
    // =========================================================

    renderClientsTab(body) {
        const proj = this.project;
        if (!proj) {
            // Safety net for legacy prospects sold before auto-create shipped,
            // or any record where the project doc somehow went missing.
            body.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">${Icons.get('folder', 22)}</div>
                    <h3 class="empty-state-title">No project record yet</h3>
                    <p class="empty-state-desc">Project records are now created automatically at approval. This one is missing — create it now to unlock revisions, billing, and renewals.</p>
                    <button class="btn btn-primary" id="pd-create-project-btn">Create Project Record</button>
                </div>
            `;
            Icons.inject(body);
            document.getElementById('pd-create-project-btn')?.addEventListener('click', async () => {
                await ProspectsModule.ensureProjectForProspect(this.prospect);
                await this.loadData(this.prospect.id);
                this.renderActiveTab();
                LaunchLocal.toast('Project record created.', 'success');
            });
            return;
        }

        const isAdmin = ['admin', 'developer'].includes(LaunchLocal.currentUser?.role);
        const statusOptions = ['onboarding', 'active', 'maintenance', 'renewal-due', 'churned'];
        const tierOptions = ['basic', 'standard', 'premium'];

        const commLog = (proj.communicationLog || []).length > 0
            ? (proj.communicationLog || [])
                .slice()
                .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
                .map((c) => `
                    <div class="comm-log-entry">
                        <span class="log-date">${LaunchLocal.escapeHtml(c.date || '')}</span>${LaunchLocal.escapeHtml(c.note || '')}
                    </div>`).join('')
            : '<p class="text-muted text-sm">No communications logged yet.</p>';

        const revisions = (proj.revisions || []).length > 0
            ? (proj.revisions || []).map((r) => `
                <div class="revision-item status-${r.status || 'pending'}">
                    <div class="revision-desc">${LaunchLocal.escapeHtml(r.description || '')}</div>
                    <div class="revision-meta">
                        <span class="badge badge-${r.status === 'pending' ? 'warning' : 'success'}">${r.status || 'pending'}</span>
                        <span>${LaunchLocal.escapeHtml(r.requestedAt || '')}</span>
                        ${r.status === 'pending' ? `<button class="btn btn-ghost btn-sm rev-complete-btn" data-rev-id="${r.id}" style="margin-left:auto;">Mark complete</button>` : ''}
                    </div>
                </div>`).join('')
            : '<p class="text-muted text-sm">No revision requests.</p>';

        body.innerHTML = `
            <div class="detail-grid">
                <div class="detail-section">
                    <h4 class="detail-section-title">Client Info</h4>
                    <div class="detail-row"><span>Client</span><span>${LaunchLocal.escapeHtml(proj.clientName || '—')}</span></div>
                    <div class="detail-row">
                        <span>Domain</span>
                        <span>${isAdmin
                            ? `<input class="form-input" id="pd-edit-domain" value="${LaunchLocal.escapeHtml(proj.domainName || '')}" placeholder="example.com" style="max-width:220px;padding:4px 8px;font-size:var(--font-size-sm);">`
                            : (proj.domainName || '—')}</span>
                    </div>
                    <div class="detail-row">
                        <span>Status</span>
                        <span>
                            <select class="form-input" id="pd-edit-status" style="max-width:200px;padding:4px 8px;font-size:var(--font-size-sm);">
                                ${statusOptions.map((s) => `<option value="${s}" ${s === proj.status ? 'selected' : ''}>${s}</option>`).join('')}
                            </select>
                        </span>
                    </div>
                    <div class="detail-row">
                        <span>Maintenance Tier</span>
                        <span>${isAdmin ? `
                            <select class="form-input" id="pd-edit-tier" style="max-width:160px;padding:4px 8px;font-size:var(--font-size-sm);">
                                <option value="">— none —</option>
                                ${tierOptions.map((t) => `<option value="${t}" ${t === proj.maintenanceTier ? 'selected' : ''}>${t}</option>`).join('')}
                            </select>
                        ` : (proj.maintenanceTier || '—')}</span>
                    </div>
                    <div class="detail-row"><span>Start Date</span><span class="mono">${proj.startDate || '—'}</span></div>
                    <div class="detail-row">
                        <span>Renewal Date</span>
                        <span>${isAdmin
                            ? `<input class="form-input" id="pd-edit-renewal" type="date" value="${proj.renewalDate || ''}" style="max-width:170px;padding:4px 8px;font-size:var(--font-size-sm);">`
                            : `<span class="mono">${proj.renewalDate || '—'}</span>`}</span>
                    </div>
                </div>
                <div class="detail-section">
                    <h4 class="detail-section-title">Automation Opportunities</h4>
                    ${(proj.automationFlags || []).length > 0
                        ? (proj.automationFlags || []).map((f) => `<div class="automation-flag" style="margin-bottom:6px;display:inline-flex;"><span data-icon="bolt"></span>${LaunchLocal.escapeHtml(f)}</div>`).join('')
                        : '<p class="text-muted text-sm">No opportunities flagged.</p>'
                    }
                </div>
            </div>

            <div class="detail-section" style="margin-top:var(--space-5);">
                <h4 class="detail-section-title"><span data-icon="edit"></span>&nbsp;Revision Requests</h4>
                ${revisions}
                <div style="margin-top:var(--space-3);display:flex;gap:var(--space-2);">
                    <input type="text" class="form-input" id="pd-new-revision" placeholder="Describe a new revision request…" style="flex:1;">
                    <button class="btn btn-primary btn-sm" id="pd-add-revision"><span data-icon="plus"></span>Add</button>
                </div>
            </div>

            <div class="detail-section" style="margin-top:var(--space-5);">
                <h4 class="detail-section-title"><span data-icon="mail"></span>&nbsp;Communication Log</h4>
                ${commLog}
                <div style="margin-top:var(--space-3);">
                    <textarea class="form-input" id="pd-new-comm" placeholder="Log a new contact or note…" rows="2"></textarea>
                    <div style="display:flex;justify-content:flex-end;margin-top:var(--space-2);">
                        <button class="btn btn-primary btn-sm" id="pd-add-comm"><span data-icon="plus"></span>Add Note</button>
                    </div>
                </div>
            </div>

            <div class="project-card-actions" style="margin-top:var(--space-5);">
                <button class="btn btn-primary" id="pd-save-client"><span data-icon="check"></span>Save Changes</button>
            </div>
        `;
        Icons.inject(body);

        document.getElementById('pd-save-client')?.addEventListener('click', () => this.saveProjectChanges());
        document.getElementById('pd-add-revision')?.addEventListener('click', () => this.addRevision());
        document.getElementById('pd-add-comm')?.addEventListener('click', () => this.addCommunication());
        body.querySelectorAll('.rev-complete-btn').forEach((btn) => {
            btn.addEventListener('click', () => this.markRevisionComplete(btn.getAttribute('data-rev-id')));
        });
    },

    async saveProjectChanges() {
        const proj = this.project;
        if (!proj) return;
        const isAdmin = ['admin', 'developer'].includes(LaunchLocal.currentUser?.role);
        const statusEl = document.getElementById('pd-edit-status');
        const updates = {};

        const newStatus = statusEl?.value;
        if (newStatus && newStatus !== proj.status) updates.status = newStatus;

        if (isAdmin) {
            const newDomain = document.getElementById('pd-edit-domain').value.trim();
            const newTier = document.getElementById('pd-edit-tier').value;
            const newRenewal = document.getElementById('pd-edit-renewal').value;
            if (newDomain !== (proj.domainName || '')) updates.domainName = newDomain || null;
            if (newTier !== (proj.maintenanceTier || '')) updates.maintenanceTier = newTier || null;
            if (newRenewal !== (proj.renewalDate || '')) updates.renewalDate = newRenewal || null;
        }

        if (Object.keys(updates).length === 0) {
            LaunchLocal.toast('No changes to save.', 'info', 2000);
            return;
        }

        try {
            await DB.updateDoc('projects', proj.id, updates);
            await DB.logActivity('project_updated', 'projects',
                `updated ${proj.clientName}: ${Object.keys(updates).join(', ')}`, updates, proj.id);
            Object.assign(proj, updates);
            LaunchLocal.toast('Project updated.', 'success');
            this.renderActiveTab();
        } catch (e) {
            LaunchLocal.toast('Update failed: ' + e.message, 'error');
        }
    },

    async addRevision() {
        const proj = this.project;
        if (!proj) return;
        const input = document.getElementById('pd-new-revision');
        const desc = input.value.trim();
        if (!desc) { LaunchLocal.toast('Describe the revision.', 'warning', 2000); return; }

        const today = new Date().toISOString().slice(0, 10);
        const rev = { id: 'r' + Date.now(), description: desc, status: 'pending', requestedAt: today };
        const revisions = [...(proj.revisions || []), rev];
        try {
            await DB.updateDoc('projects', proj.id, { revisions });
            proj.revisions = revisions;
            input.value = '';
            await DB.logActivity('revision_requested', 'projects', `new revision on ${proj.clientName}`, { description: desc.slice(0, 60) }, proj.id);
            LaunchLocal.toast('Revision added.', 'success', 2000);
            this.renderActiveTab();
        } catch (e) {
            LaunchLocal.toast('Failed to add revision: ' + e.message, 'error');
        }
    },

    async markRevisionComplete(revId) {
        const proj = this.project;
        if (!proj) return;
        const revisions = (proj.revisions || []).map((r) =>
            r.id === revId ? { ...r, status: 'complete', completedAt: new Date().toISOString().slice(0, 10) } : r
        );
        try {
            await DB.updateDoc('projects', proj.id, { revisions });
            proj.revisions = revisions;
            await DB.logActivity('revision_completed', 'projects', `completed revision on ${proj.clientName}`, {}, proj.id);
            LaunchLocal.toast('Revision marked complete.', 'success', 2000);
            this.renderActiveTab();
        } catch (e) {
            LaunchLocal.toast('Failed to update revision: ' + e.message, 'error');
        }
    },

    async addCommunication() {
        const proj = this.project;
        if (!proj) return;
        const input = document.getElementById('pd-new-comm');
        const note = input.value.trim();
        if (!note) { LaunchLocal.toast('Please enter a note.', 'warning', 2000); return; }

        const today = new Date().toISOString().slice(0, 10);
        const entry = { date: today, note };
        const log = [entry, ...(proj.communicationLog || [])];
        try {
            await DB.updateDoc('projects', proj.id, { communicationLog: log, lastContactDate: today });
            proj.communicationLog = log;
            proj.lastContactDate = today;
            input.value = '';
            await DB.logActivity('project_note_added', 'projects', `logged note on ${proj.clientName}`, { note: note.slice(0, 60) }, proj.id);
            LaunchLocal.toast('Note added.', 'success', 2000);
            this.renderActiveTab();
        } catch (e) {
            LaunchLocal.toast('Failed to add note: ' + e.message, 'error');
        }
    },

    // =========================================================
    // BILLING TAB (per-project)
    // =========================================================

    renderBillingTab(body) {
        const proj = this.project;
        if (this.prospect.status !== 'sold') {
            body.innerHTML = `
                <div class="empty-state">
                    <p class="empty-state-desc">Billing unlocks once the deal is closed.</p>
                </div>
            `;
            return;
        }
        if (!proj) {
            body.innerHTML = `<div class="empty-state"><p class="empty-state-desc">No project record yet.</p></div>`;
            return;
        }

        const invoices = this.invoices.slice().sort((a, b) => (b.issuedDate || '').localeCompare(a.issuedDate || ''));
        const isAdmin = LaunchLocal.currentUser?.role === 'admin';

        const totalBilled = invoices.filter((i) => i.status !== 'draft').reduce((s, i) => s + (i.amount || 0), 0);
        const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + (i.amount || 0), 0);
        const totalPending = invoices.filter((i) => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + (i.amount || 0), 0);

        body.innerHTML = `
            <div class="stats-row">
                <div class="stat-chip"><span class="stat-num">${LaunchLocal.formatCurrency(proj.monthlyFee || 0)}</span><span>Monthly</span></div>
                <div class="stat-chip"><span class="stat-num">${LaunchLocal.formatCurrency(totalBilled)}</span><span>Billed</span></div>
                <div class="stat-chip"><span class="stat-num">${LaunchLocal.formatCurrency(totalPaid)}</span><span>Collected</span></div>
                <div class="stat-chip ${totalPending > 0 ? 'stat-chip-warn' : ''}"><span class="stat-num">${LaunchLocal.formatCurrency(totalPending)}</span><span>Outstanding</span></div>
            </div>

            <div class="detail-section" style="margin-top:var(--space-4);">
                <h4 class="detail-section-title">Billing Terms</h4>
                <div class="detail-row">
                    <span>Monthly Fee (CAD)</span>
                    <span>${isAdmin
                        ? `<input type="number" class="form-input" id="pd-fee" min="0" step="100" value="${((proj.monthlyFee || 0) / 100).toFixed(2)}" style="max-width:140px;padding:4px 8px;font-size:var(--font-size-sm);text-align:right;">`
                        : `<span class="mono">${LaunchLocal.formatCurrency(proj.monthlyFee || 0)}</span>`}</span>
                </div>
                ${isAdmin ? `<div style="margin-top:var(--space-2);display:flex;justify-content:flex-end;"><button class="btn btn-primary btn-sm" id="pd-save-fee">Save Fee</button></div>` : ''}
            </div>

            <div class="detail-section" style="margin-top:var(--space-5);">
                <div style="display:flex;align-items:center;justify-content:space-between;">
                    <h4 class="detail-section-title">Invoices</h4>
                    <button class="btn btn-primary btn-sm" id="pd-new-invoice"><span data-icon="plus"></span>New Invoice</button>
                </div>
                ${invoices.length === 0 ? `
                    <p class="text-muted text-sm" style="margin-top:var(--space-3);">No invoices yet.</p>
                ` : `
                    <div class="table-wrapper" style="margin-top:var(--space-3);">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th style="text-align:right;">Amount</th>
                                    <th>Status</th>
                                    <th>Issued</th>
                                    <th>Due</th>
                                    <th style="text-align:right;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${invoices.map((inv) => this.renderInvoiceRow(inv)).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;
        Icons.inject(body);

        document.getElementById('pd-new-invoice')?.addEventListener('click', () => this.openInvoiceModal());
        document.getElementById('pd-save-fee')?.addEventListener('click', () => this.saveFee());
        body.querySelectorAll('[data-action]').forEach((btn) => {
            btn.addEventListener('click', () => this.handleInvoiceAction(btn.getAttribute('data-action'), btn.getAttribute('data-id')));
        });
    },

    renderInvoiceRow(inv) {
        let actions = '';
        if (inv.status === 'draft') {
            actions = `<button class="btn btn-subtle btn-sm" data-action="send" data-id="${inv.id}">Mark Sent</button>`;
        } else if (inv.status === 'sent' || inv.status === 'overdue') {
            actions = `<button class="btn btn-primary btn-sm" data-action="pay" data-id="${inv.id}">Mark Paid</button>`;
        } else if (inv.status === 'paid') {
            actions = `<span class="chip chip-success"><span data-icon="check"></span>Paid ${inv.paidDate || ''}</span>`;
        }
        return `
            <tr>
                <td><span class="chip">${LaunchLocal.escapeHtml(inv.type || '—')}</span></td>
                <td style="text-align:right;"><strong class="mono">${LaunchLocal.formatCurrency(inv.amount || 0)}</strong></td>
                <td><span class="badge badge-${inv.status}">${inv.status}</span></td>
                <td class="td-sub">${inv.issuedDate || '—'}</td>
                <td class="td-sub">${inv.dueDate || '—'}</td>
                <td style="text-align:right;">${actions}</td>
            </tr>
        `;
    },

    async saveFee() {
        const proj = this.project;
        if (!proj) return;
        const input = document.getElementById('pd-fee');
        const dollars = parseFloat(input.value);
        if (isNaN(dollars) || dollars < 0) {
            LaunchLocal.toast('Please enter a valid amount.', 'warning');
            return;
        }
        const cents = Math.round(dollars * 100);
        try {
            await DB.updateDoc('projects', proj.id, { monthlyFee: cents });
            proj.monthlyFee = cents;
            LaunchLocal.toast('Monthly fee updated.', 'success');
            this.renderActiveTab();
        } catch (e) {
            LaunchLocal.toast('Failed to update fee: ' + e.message, 'error');
        }
    },

    openInvoiceModal() {
        const proj = this.project;
        const defaultType = proj.maintenanceTier ? 'maintenance' : 'project';
        const defaultAmount = (proj.maintenanceTier && proj.monthlyFee) ? (proj.monthlyFee / 100).toFixed(2) : '';

        const body = document.getElementById('invoice-modal-body');
        body.innerHTML = `
            <div class="form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);">
                <div>
                    <label class="form-label">Amount (CAD) *</label>
                    <input type="number" class="form-input" id="inv-amount" value="${defaultAmount}" placeholder="2500.00" min="0" step="0.01">
                </div>
                <div>
                    <label class="form-label">Type *</label>
                    <select class="form-input" id="inv-type">
                        <option value="project" ${defaultType === 'project' ? 'selected' : ''}>Project</option>
                        <option value="maintenance" ${defaultType === 'maintenance' ? 'selected' : ''}>Maintenance</option>
                        <option value="automation">Automation</option>
                        <option value="other">Other</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Due Date *</label>
                <input type="date" class="form-input" id="inv-due">
            </div>
            <div class="form-group">
                <label class="form-label">Notes</label>
                <textarea class="form-input" id="inv-notes" rows="2" placeholder="Optional notes..."></textarea>
            </div>
            <label class="option-chip" style="margin-top:var(--space-2);">
                <input type="checkbox" id="inv-send-immediately">
                Mark as "sent" instead of "draft"
            </label>
        `;

        const footer = document.getElementById('invoice-modal-footer');
        footer.innerHTML = `
            <button class="btn btn-secondary" id="inv-cancel">Cancel</button>
            <button class="btn btn-primary" id="inv-save"><span data-icon="check"></span><span class="btn-text">Create Invoice</span></button>
        `;
        Icons.inject(footer);

        const modal = document.getElementById('invoice-modal');
        modal.classList.add('open');
        document.getElementById('invoice-modal-close').onclick = () => modal.classList.remove('open');
        document.getElementById('inv-cancel').onclick = () => modal.classList.remove('open');
        document.getElementById('inv-save').onclick = () => this.createInvoice();
    },

    async createInvoice() {
        const proj = this.project;
        const amount = parseFloat(document.getElementById('inv-amount').value);
        const type = document.getElementById('inv-type').value;
        const due = document.getElementById('inv-due').value;
        const notes = document.getElementById('inv-notes').value;
        const sendNow = document.getElementById('inv-send-immediately').checked;

        if (!amount || !due) {
            LaunchLocal.toast('Amount and due date are required.', 'warning');
            return;
        }

        const saveBtn = document.getElementById('inv-save');
        saveBtn.classList.add('btn-loading');
        try {
            const amountCents = Math.round(amount * 100);
            const rate = type === 'project' ? 0.15 : 0.10;
            const today = new Date().toISOString().slice(0, 10);
            await DB.addDoc('invoices', {
                clientName: proj.clientName,
                projectId: proj.id,
                amount: amountCents,
                type,
                status: sendNow ? 'sent' : 'draft',
                issuedDate: sendNow ? today : null,
                dueDate: due,
                paidDate: null,
                stripeInvoiceId: null,
                commissionRate: rate,
                commissionAmount: Math.round(amountCents * rate),
                salesRepId: LaunchLocal.currentUser?.uid,
                lineItems: [{ description: `${type.charAt(0).toUpperCase() + type.slice(1)} — ${proj.clientName}`, amount: amountCents }],
                notes
            });
            await DB.logActivity('invoice_created', 'billing', `created ${sendNow ? 'sent' : 'draft'} invoice for ${proj.clientName}`, { projectId: proj.id });
            document.getElementById('invoice-modal').classList.remove('open');
            LaunchLocal.toast(sendNow ? 'Invoice created and sent.' : 'Invoice created as draft.', 'success');
            await this.loadData(this.prospect.id);
            this.renderActiveTab();
        } catch (e) {
            LaunchLocal.toast('Failed to create invoice: ' + e.message, 'error');
        } finally {
            saveBtn.classList.remove('btn-loading');
        }
    },

    async handleInvoiceAction(action, id) {
        const inv = this.invoices.find((i) => i.id === id);
        if (!inv) return;
        const today = new Date().toISOString().slice(0, 10);
        try {
            if (action === 'send') {
                await DB.updateDoc('invoices', id, { status: 'sent', issuedDate: today });
                await DB.logActivity('invoice_sent', 'billing', `marked invoice sent for ${inv.clientName}`, {}, id);
            } else if (action === 'pay') {
                await DB.updateDoc('invoices', id, { status: 'paid', paidDate: today });
                await DB.logActivity('invoice_paid', 'billing', `recorded payment for ${inv.clientName} (${LaunchLocal.formatCurrency(inv.amount || 0)})`, {}, id);
            }
            await this.loadData(this.prospect.id);
            this.renderActiveTab();
        } catch (e) {
            LaunchLocal.toast('Update failed: ' + e.message, 'error');
        }
    }
};

Router.register('project-detail', ProjectDetailModule, 'Project', ['admin', 'developer', 'sales']);
