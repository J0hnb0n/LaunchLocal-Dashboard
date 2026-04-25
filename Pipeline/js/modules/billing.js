/* ============================================
   LaunchLocal — Billing Module (full workflow)
   ============================================ */

const BillingModule = {
    invoices: [],
    projects: [],
    activeTab: 'all',
    activeAging: 'all',
    activeMainTab: 'invoices',

    async render(container) {
        container.innerHTML = this.getShellHTML();
        Icons.inject(container);
        await this.loadData();
        this.bindEvents(container);
        return () => {
            this.invoices = [];
            this.projects = [];
            this.activeTab = 'all';
            this.activeAging = 'all';
            this.activeMainTab = 'invoices';
        };
    },

    getShellHTML() {
        return `
            <div class="page-header">
                <div>
                    <div class="eyebrow">Revenue Operations</div>
                    <h2 class="page-title">Billing</h2>
                    <p class="page-subtitle">Review and approve invoices across every active project. Create invoices from inside each project's Billing tab.</p>
                </div>
            </div>

            <div class="kpi-grid" id="billing-kpis">
                <div class="loading-screen" style="min-height:80px;grid-column:1/-1;"><div class="spinner"></div></div>
            </div>

            <div class="card" style="margin-top:var(--space-5);">
                <div class="card-header">
                    <div class="module-tabs module-tabs-inline" id="billing-main-tabs">
                        <button class="module-tab active" data-main-tab="invoices">Invoices</button>
                        <button class="module-tab" data-main-tab="commissions">Commissions</button>
                    </div>
                </div>

                <div id="invoices-panel">
                    <div style="padding: var(--space-4) var(--space-5) 0;display:flex;gap:var(--space-3);flex-wrap:wrap;align-items:center;border-top:1px solid var(--border);">
                        <div class="module-tabs module-tabs-inline" id="invoice-tabs" style="flex:1;">
                            <button class="module-tab active" data-tab="all">All</button>
                            <button class="module-tab" data-tab="draft">Draft</button>
                            <button class="module-tab" data-tab="sent">Sent</button>
                            <button class="module-tab" data-tab="paid">Paid</button>
                            <button class="module-tab" data-tab="overdue">Overdue</button>
                        </div>
                    </div>

                    <div style="padding: 0 var(--space-5) var(--space-3);">
                        <div class="aging-buckets" id="aging-buckets">
                            <button class="aging-bucket active" data-aging="all">All Ages</button>
                            <button class="aging-bucket" data-aging="0-30">0–30d <span class="count" id="aging-0-30">0</span></button>
                            <button class="aging-bucket" data-aging="30-60">30–60d <span class="count" id="aging-30-60">0</span></button>
                            <button class="aging-bucket" data-aging="60-90">60–90d <span class="count" id="aging-60-90">0</span></button>
                            <button class="aging-bucket" data-aging="90+">90d+ <span class="count" id="aging-90">0</span></button>
                        </div>
                    </div>

                    <div id="invoice-table">
                        <div class="loading-screen" style="min-height:100px;"><div class="spinner spinner-lg"></div></div>
                    </div>
                </div>

                <div id="commissions-panel" style="display:none;">
                    <div style="padding: var(--space-4) var(--space-5) 0;border-top:1px solid var(--border);">
                        <h3 class="card-title" style="margin-bottom:var(--space-3);">Commission Summary</h3>
                    </div>
                    <div class="card-body" id="commission-body">
                        <div class="loading-screen" style="min-height:80px;"><div class="spinner"></div></div>
                    </div>
                </div>
            </div>

        `;
    },

    async loadData() {
        try {
            const [invoices, projects] = await Promise.all([
                DB.getDocs('invoices', { orderBy: [['createdAt', 'desc']] }),
                DB.getDocs('projects')
            ]);
            // Auto-flag overdue on load (sent invoices past due)
            const today = new Date().toISOString().slice(0, 10);
            for (const inv of invoices) {
                if (inv.status === 'sent' && inv.dueDate && inv.dueDate < today) {
                    inv.status = 'overdue';
                    // persist in background — non-blocking
                    DB.updateDoc('invoices', inv.id, { status: 'overdue' }).catch(() => {});
                }
            }
            this.invoices = invoices;
            this.projects = projects;
            this.renderKPIs();
            this.renderTable();
            this.renderCommissions();
            this.renderAgingCounts();
        } catch (e) {
            console.error(e);
            LaunchLocal.toast('Failed to load billing data.', 'error');
        }
    },

    switchMainTab(tab) {
        this.activeMainTab = tab;
        document.querySelectorAll('#billing-main-tabs .module-tab').forEach((t) => {
            t.classList.toggle('active', t.getAttribute('data-main-tab') === tab);
        });
        document.getElementById('invoices-panel').style.display = tab === 'invoices' ? '' : 'none';
        document.getElementById('commissions-panel').style.display = tab === 'commissions' ? '' : 'none';
    },

    renderKPIs() {
        const el = document.getElementById('billing-kpis');
        if (!el) return;

        const totalBilled = this.invoices.filter((i) => i.status !== 'draft').reduce((s, i) => s + (i.amount || 0), 0);
        const totalPaid = this.invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + (i.amount || 0), 0);
        const totalPending = this.invoices.filter((i) => i.status === 'sent').reduce((s, i) => s + (i.amount || 0), 0);
        const totalOverdue = this.invoices.filter((i) => i.status === 'overdue').reduce((s, i) => s + (i.amount || 0), 0);

        el.innerHTML = `
            <div class="kpi-card">
                <div class="kpi-card-header"><span class="kpi-card-label">Total Billed</span><div class="kpi-card-icon blue" data-icon="wallet"></div></div>
                <div class="kpi-card-value"><span class="mono">${LaunchLocal.formatCurrency(totalBilled)}</span></div>
                <div class="kpi-card-change">${this.invoices.filter((i) => i.status !== 'draft').length} invoices issued</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-card-header"><span class="kpi-card-label">Collected</span><div class="kpi-card-icon green" data-icon="check"></div></div>
                <div class="kpi-card-value"><span class="mono">${LaunchLocal.formatCurrency(totalPaid)}</span></div>
                <div class="kpi-card-change positive">${this.invoices.filter((i) => i.status === 'paid').length} paid</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-card-header"><span class="kpi-card-label">Outstanding</span><div class="kpi-card-icon amber" data-icon="clock"></div></div>
                <div class="kpi-card-value"><span class="mono">${LaunchLocal.formatCurrency(totalPending)}</span></div>
                <div class="kpi-card-change">${this.invoices.filter((i) => i.status === 'sent').length} awaiting payment</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-card-header"><span class="kpi-card-label">Overdue</span><div class="kpi-card-icon red" data-icon="alert"></div></div>
                <div class="kpi-card-value"><span class="mono">${LaunchLocal.formatCurrency(totalOverdue)}</span></div>
                <div class="kpi-card-change ${totalOverdue > 0 ? 'negative' : ''}">${this.invoices.filter((i) => i.status === 'overdue').length} overdue</div>
            </div>
        `;
        Icons.inject(el);
    },

    agingBucketOf(inv) {
        if (inv.status === 'paid' || inv.status === 'draft' || inv.status === 'void') return null;
        if (!inv.dueDate) return null;
        const days = Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        if (days < 0) return '0-30'; // not yet due but upcoming in this bucket
        if (days <= 30) return '0-30';
        if (days <= 60) return '30-60';
        if (days <= 90) return '60-90';
        return '90+';
    },

    renderAgingCounts() {
        const counts = { '0-30': 0, '30-60': 0, '60-90': 0, '90+': 0 };
        this.invoices.forEach((inv) => {
            const b = this.agingBucketOf(inv);
            if (b) counts[b]++;
        });
        document.getElementById('aging-0-30').textContent = counts['0-30'];
        document.getElementById('aging-30-60').textContent = counts['30-60'];
        document.getElementById('aging-60-90').textContent = counts['60-90'];
        document.getElementById('aging-90').textContent = counts['90+'];
    },

    renderTable() {
        const container = document.getElementById('invoice-table');
        if (!container) return;

        let filtered = this.activeTab === 'all'
            ? this.invoices
            : this.invoices.filter((i) => i.status === this.activeTab);

        if (this.activeAging !== 'all') {
            filtered = filtered.filter((inv) => this.agingBucketOf(inv) === this.activeAging);
        }

        const tabLabels = { all: 'All', draft: 'Draft', sent: 'Sent', paid: 'Paid', overdue: 'Overdue' };
        document.querySelectorAll('#invoice-tabs .module-tab').forEach((tab) => {
            const t = tab.getAttribute('data-tab');
            const cnt = t === 'all' ? this.invoices.length : this.invoices.filter((i) => i.status === t).length;
            tab.textContent = cnt > 0 ? `${tabLabels[t]} (${cnt})` : tabLabels[t];
        });

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="margin: var(--space-4);">
                    <div class="empty-state-icon">${Icons.get('wallet', 22)}</div>
                    <h3 class="empty-state-title">No invoices in this view</h3>
                    <p class="empty-state-desc">Adjust the filter above, or create a new invoice.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="table-wrapper" style="border:none;border-radius:0;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Client / Project</th>
                            <th>Type</th>
                            <th style="text-align:right;">Amount</th>
                            <th>Status</th>
                            <th>Issued</th>
                            <th>Due</th>
                            <th style="text-align:right;">Commission</th>
                            <th style="text-align:right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.map((inv) => this.renderRow(inv)).join('')}
                    </tbody>
                </table>
            </div>
        `;

        Icons.inject(container);
        container.querySelectorAll('[data-action]').forEach((btn) => {
            btn.addEventListener('click', () => this.handleRowAction(btn.getAttribute('data-action'), btn.getAttribute('data-id')));
        });
    },

    renderRow(inv) {
        const project = this.projects.find((p) => p.id === inv.projectId);
        const projectHref = project?.prospectId ? `#project-detail?prospect=${project.prospectId}&tab=billing` : null;
        const projectLabel = project ? `<div class="td-sub">${projectHref ? `<a href="${projectHref}">→ ${LaunchLocal.escapeHtml(project.domainName || project.clientName)}</a>` : `→ ${LaunchLocal.escapeHtml(project.domainName || project.clientName)}`}</div>` : '';
        const dueCls = inv.status === 'overdue' ? 'text-danger' : '';

        let actions = '';
        if (inv.status === 'draft') {
            actions = `<button class="btn btn-subtle btn-sm" data-action="approve" data-id="${inv.id}">Approve &amp; Send</button>`;
        } else if (inv.status === 'sent' || inv.status === 'overdue') {
            actions = `<button class="btn btn-primary btn-sm" data-action="pay" data-id="${inv.id}">Mark Paid</button>`;
        } else if (inv.status === 'paid') {
            actions = `<span class="chip chip-success"><span data-icon="check"></span>Paid ${inv.paidDate || ''}</span>`;
        }

        return `
            <tr>
                <td>
                    <div class="td-name">${LaunchLocal.escapeHtml(inv.clientName || '—')}</div>
                    ${projectLabel}
                </td>
                <td><span class="chip">${inv.type || '—'}</span></td>
                <td style="text-align:right;"><strong class="mono">${LaunchLocal.formatCurrency(inv.amount || 0)}</strong></td>
                <td><span class="badge badge-${inv.status}">${inv.status}</span></td>
                <td class="td-sub">${inv.issuedDate || '—'}</td>
                <td class="td-sub ${dueCls}">${inv.dueDate || '—'}</td>
                <td style="text-align:right;" class="td-sub">${LaunchLocal.formatCurrency(inv.commissionAmount || 0)}</td>
                <td style="text-align:right;">${actions}</td>
            </tr>
        `;
    },

    async handleRowAction(action, id) {
        const inv = this.invoices.find((i) => i.id === id);
        if (!inv) return;
        try {
            const today = new Date().toISOString().slice(0, 10);
            if (action === 'approve' || action === 'send') {
                await DB.updateDoc('invoices', id, { status: 'sent', issuedDate: today });
                Object.assign(inv, { status: 'sent', issuedDate: today });
                await DB.logActivity('invoice_sent', 'billing', `approved & sent invoice for ${inv.clientName}`, {}, id);
                LaunchLocal.toast('Invoice approved and sent.', 'success', 2000);
            } else if (action === 'pay') {
                await DB.updateDoc('invoices', id, { status: 'paid', paidDate: today });
                Object.assign(inv, { status: 'paid', paidDate: today });
                await DB.logActivity('invoice_paid', 'billing', `recorded payment for ${inv.clientName} (${LaunchLocal.formatCurrency(inv.amount || 0)})`, {}, id);
                LaunchLocal.toast('Payment recorded.', 'success');
            }
            this.renderKPIs();
            this.renderTable();
            this.renderCommissions();
            this.renderAgingCounts();
        } catch (e) {
            LaunchLocal.toast('Update failed: ' + e.message, 'error');
        }
    },

    renderCommissions() {
        const container = document.getElementById('commission-body');
        if (!container) return;

        const paid = this.invoices.filter((i) => i.status === 'paid');
        const total = paid.reduce((s, i) => s + (i.commissionAmount || 0), 0);
        const fromProjects = paid.filter((i) => i.type === 'project').reduce((s, i) => s + (i.commissionAmount || 0), 0);
        const fromMaint = paid.filter((i) => i.type === 'maintenance').reduce((s, i) => s + (i.commissionAmount || 0), 0);
        const pending = this.invoices.filter((i) => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + (i.commissionAmount || 0), 0);

        // Per-rep breakdown
        const byRep = {};
        this.invoices.forEach((inv) => {
            const rep = inv.salesRepId || 'unassigned';
            if (!byRep[rep]) byRep[rep] = { paid: 0, pending: 0, count: 0 };
            byRep[rep].count++;
            if (inv.status === 'paid') byRep[rep].paid += (inv.commissionAmount || 0);
            else if (inv.status === 'sent' || inv.status === 'overdue') byRep[rep].pending += (inv.commissionAmount || 0);
        });

        container.innerHTML = `
            <div class="commission-grid">
                <div class="commission-item commission-total">
                    <div class="commission-label">Total Earned</div>
                    <div class="commission-value">${LaunchLocal.formatCurrency(total)}</div>
                    <div class="commission-sub">Paid invoices</div>
                </div>
                <div class="commission-item">
                    <div class="commission-label">From Projects</div>
                    <div class="commission-value">${LaunchLocal.formatCurrency(fromProjects)}</div>
                    <div class="commission-sub">15% rate</div>
                </div>
                <div class="commission-item">
                    <div class="commission-label">From Maintenance</div>
                    <div class="commission-value">${LaunchLocal.formatCurrency(fromMaint)}</div>
                    <div class="commission-sub">10% rate</div>
                </div>
                <div class="commission-item">
                    <div class="commission-label">Pending</div>
                    <div class="commission-value ${pending > 0 ? 'text-warning' : ''}">${LaunchLocal.formatCurrency(pending)}</div>
                    <div class="commission-sub">Awaiting payment</div>
                </div>
            </div>

            <div style="margin-top: var(--space-5);">
                <h4 class="detail-section-title">By Sales Rep</h4>
                <div class="table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr><th>Rep ID</th><th>Invoices</th><th style="text-align:right;">Earned</th><th style="text-align:right;">Pending</th></tr>
                        </thead>
                        <tbody>
                            ${Object.entries(byRep).map(([rep, data]) => `
                                <tr>
                                    <td class="mono" style="font-size:var(--font-size-xs);">${LaunchLocal.escapeHtml(rep)}</td>
                                    <td>${data.count}</td>
                                    <td style="text-align:right;" class="mono">${LaunchLocal.formatCurrency(data.paid)}</td>
                                    <td style="text-align:right;" class="mono ${data.pending > 0 ? 'text-warning' : ''}">${LaunchLocal.formatCurrency(data.pending)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    bindEvents(container) {
        container.addEventListener('click', (e) => {
            const mainTab = e.target.closest('#billing-main-tabs .module-tab');
            if (mainTab) this.switchMainTab(mainTab.getAttribute('data-main-tab'));
        });

        container.addEventListener('click', (e) => {
            const tab = e.target.closest('#invoice-tabs .module-tab');
            if (tab) {
                container.querySelectorAll('#invoice-tabs .module-tab').forEach((t) => t.classList.remove('active'));
                tab.classList.add('active');
                this.activeTab = tab.getAttribute('data-tab');
                this.renderTable();
            }
        });

        container.addEventListener('click', (e) => {
            const bucket = e.target.closest('.aging-bucket');
            if (bucket) {
                container.querySelectorAll('.aging-bucket').forEach((b) => b.classList.remove('active'));
                bucket.classList.add('active');
                this.activeAging = bucket.getAttribute('data-aging');
                this.renderTable();
            }
        });
    }
};

Router.register('billing', BillingModule, 'Billing', ['admin']);
