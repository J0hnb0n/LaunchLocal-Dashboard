/* ============================================
   LaunchLocal — Active Projects Module
   ============================================

   Shows live clients only — prospects whose status is `sold`. Joins each
   prospect with its project record so cards can surface lifecycle status
   (onboarding | active | maintenance | renewal-due | churned), MRR,
   renewal date, and pending revisions. Clicking a card opens
   project-detail.js (Site / Sales / Clients / Billing tabs).
   ============================================ */

const ActiveProjectsModule = {
    prospects: [],
    projects: [],
    searchQuery: '',
    statusFilter: 'all',
    sortBy: 'renewal', // 'renewal' | 'mrr' | 'name' | 'status'

    async render(container) {
        container.innerHTML = this.getShellHTML();
        Icons.inject(container);
        this.bindEvents(container);
        await this.loadData();
        return () => {
            this.prospects = [];
            this.projects = [];
            this.searchQuery = '';
            this.statusFilter = 'all';
            this.sortBy = 'renewal';
        };
    },

    getShellHTML() {
        return `
            <div class="page-header">
                <div>
                    <div class="eyebrow">Live Clients</div>
                    <h2 class="page-title">Active Projects</h2>
                    <p class="page-subtitle">Sold deals — track lifecycle, MRR, renewals, and revisions.</p>
                </div>
            </div>

            <div class="filter-bar">
                <input type="text" class="form-input filter-search" id="active-projects-search"
                    placeholder="Search by client, domain, or location…">
                <div class="stage-select-wrap">
                    <select class="form-input" id="active-projects-status-filter" style="max-width:200px;">
                        <option value="all">All lifecycle</option>
                        <option value="onboarding">Onboarding</option>
                        <option value="active">Active</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="renewal-due">Renewal due</option>
                        <option value="churned">Churned</option>
                    </select>
                </div>
                <div class="stage-select-wrap">
                    <select class="form-input" id="active-projects-sort" style="max-width:200px;" title="Sort order">
                        <option value="renewal">Renewal date (soonest)</option>
                        <option value="mrr">MRR (highest)</option>
                        <option value="name">By name (A–Z)</option>
                        <option value="status">By lifecycle status</option>
                    </select>
                </div>
            </div>

            <div id="active-projects-list">
                <div class="loading-screen"><div class="spinner spinner-lg"></div></div>
            </div>
        `;
    },

    async loadData() {
        try {
            const [prospects, projects] = await Promise.all([
                DB.getDocs('prospects'),
                DB.getDocs('projects')
            ]);
            this.prospects = prospects;
            this.projects = projects;
            this.renderList();
        } catch (err) {
            console.error('Active Projects load:', err);
            const list = document.getElementById('active-projects-list');
            if (list) {
                list.innerHTML = LaunchLocal.EmptyState.render({
                    icon: 'alert',
                    title: 'Failed to load',
                    desc: 'Could not fetch active projects. Try refreshing.',
                    variant: 'inline-error'
                });
            }
        }
    },

    /**
     * An "active project" = any prospect whose status is `sold`. Joined
     * with its project record so the card surfaces lifecycle status, MRR,
     * domain, etc.
     */
    activeJobs() {
        const projectByProspect = new Map();
        for (const proj of this.projects) {
            if (proj.prospectId) projectByProspect.set(proj.prospectId, proj);
        }
        return this.prospects
            .filter((p) => p.status === 'sold')
            .map((p) => ({
                prospect: p,
                project: projectByProspect.get(p.id) || null
            }));
    },

    renderList() {
        const list = document.getElementById('active-projects-list');
        if (!list) return;

        let jobs = this.activeJobs();

        if (this.statusFilter !== 'all') {
            jobs = jobs.filter((j) => (j.project?.status || 'onboarding') === this.statusFilter);
        }
        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            jobs = jobs.filter((j) => {
                const name = (j.project?.clientName || j.prospect.businessName || '').toLowerCase();
                const domain = (j.project?.domainName || '').toLowerCase();
                const address = (j.prospect.address || '').toLowerCase();
                return name.includes(q) || domain.includes(q) || address.includes(q);
            });
        }

        jobs.sort(this.sortComparator());

        if (jobs.length === 0) {
            list.innerHTML = LaunchLocal.EmptyState.render({
                icon: 'activity',
                title: 'No active projects yet',
                desc: 'Close a deal in Sales — sold prospects show up here as live clients.',
                ctaLabel: 'Open Sales',
                ctaHref: '#sales'
            });
            Icons.inject(list);
            return;
        }

        list.innerHTML = `<div class="prospect-cards">${jobs.map((j) => this.renderJobCard(j)).join('')}</div>`;

        list.querySelectorAll('.prospect-card').forEach((card) => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('button, a, input, select, textarea')) return;
                const pid = card.getAttribute('data-prospect-id');
                if (pid) window.location.hash = `#project-detail?prospect=${pid}`;
            });
        });

        Icons.inject(list);
    },

    sortComparator() {
        const renewalMs = (j) => {
            const r = j.project?.renewalDate;
            if (!r) return Number.POSITIVE_INFINITY;
            const t = new Date(r).getTime();
            return isNaN(t) ? Number.POSITIVE_INFINITY : t;
        };
        const mrr = (j) => j.project?.monthlyFee || 0;
        const name = (j) => (j.project?.clientName || j.prospect?.businessName || '').toLowerCase();
        const statusRank = { onboarding: 0, active: 1, maintenance: 2, 'renewal-due': 3, churned: 4 };
        const statusOf = (j) => statusRank[j.project?.status] ?? 9;

        switch (this.sortBy) {
            case 'mrr':    return (a, b) => mrr(b) - mrr(a);
            case 'name':   return (a, b) => name(a).localeCompare(name(b));
            case 'status': return (a, b) => {
                const r = statusOf(a) - statusOf(b);
                return r !== 0 ? r : name(a).localeCompare(name(b));
            };
            case 'renewal':
            default:       return (a, b) => renewalMs(a) - renewalMs(b);
        }
    },

    renderJobCard(job) {
        const p = job.prospect;
        const proj = job.project;
        const lifecycleBadge = LaunchLocal.StatusPill.render(proj?.status || 'onboarding', { domain: 'project', withIcon: true });
        const pendingRevisions = (proj?.revisions || []).filter((r) => r.status === 'pending').length;
        const renewalInfo = this.renewalInfo(proj);
        const clientName = proj?.clientName || p.businessName || 'Unnamed';

        const domainChip = proj?.domainName
            ? `<span class="meta-chip"><a href="https://${proj.domainName}" target="_blank" rel="noopener" onclick="event.stopPropagation();">${LaunchLocal.escapeHtml(proj.domainName)}</a></span>`
            : '';
        const tierChip = proj?.maintenanceTier
            ? `<span class="badge badge-${proj.maintenanceTier}">${proj.maintenanceTier}</span>`
            : '';
        const mrrChip = proj?.monthlyFee
            ? `<span class="meta-chip">${LaunchLocal.formatCurrency(proj.monthlyFee)}/mo</span>`
            : '';
        const revisionsChip = pendingRevisions > 0
            ? `<span class="meta-chip chip-warn">${pendingRevisions} pending revision${pendingRevisions === 1 ? '' : 's'}</span>`
            : '';
        const renewalChip = renewalInfo.chipHtml;

        return `
            <div class="prospect-card ${renewalInfo.imminent ? 'renewal-imminent' : ''}" data-prospect-id="${p.id}">
                <div class="prospect-card-body">
                    <div class="prospect-card-info">
                        <div class="prospect-card-name">${LaunchLocal.escapeHtml(clientName)}</div>
                        <div class="prospect-card-address">${LaunchLocal.escapeHtml(p.address || 'E-commerce')}</div>
                        <div class="prospect-card-meta">
                            ${domainChip}
                            ${mrrChip}
                            ${tierChip}
                            ${revisionsChip}
                            ${renewalChip}
                        </div>
                    </div>
                    <div class="prospect-card-right">
                        ${lifecycleBadge}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Thin wrapper preserved for any legacy callers — real rendering
     * happens in StatusPill (project domain).
     */
    lifecycleBadge(status) {
        return LaunchLocal.StatusPill.render(status, { domain: 'project', withIcon: true });
    },

    /**
     * Compute renewal label + days-to-renewal styling. Returns
     * { imminent: bool, chipHtml: string }.
     */
    renewalInfo(proj) {
        if (!proj || !proj.renewalDate || proj.status === 'churned') {
            return { imminent: false, chipHtml: '' };
        }
        const ts = new Date(proj.renewalDate).getTime();
        if (isNaN(ts)) return { imminent: false, chipHtml: '' };

        const days = Math.ceil((ts - Date.now()) / (1000 * 60 * 60 * 24));
        const imminent = days < 30 && days > -1;
        const cls = days < 0 ? 'chip-danger' : days < 30 ? 'chip-warn' : '';
        const label = days < 0
            ? `Overdue: ${proj.renewalDate}`
            : days === 0
                ? 'Renews today'
                : days < 30
                    ? `Renews in ${days}d (${proj.renewalDate})`
                    : `Renews ${proj.renewalDate}`;
        return {
            imminent,
            chipHtml: `<span class="meta-chip ${cls}">${label}</span>`
        };
    },

    bindEvents(container) {
        const search = container.querySelector('#active-projects-search');
        search?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.trim();
            this.renderList();
        });

        const status = container.querySelector('#active-projects-status-filter');
        status?.addEventListener('change', (e) => {
            this.statusFilter = e.target.value;
            this.renderList();
        });

        const sort = container.querySelector('#active-projects-sort');
        sort?.addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.renderList();
        });
    }
};

Router.register('active-projects', ActiveProjectsModule, 'Active Projects', ['admin', 'developer']);

// Sidebar nav badge — projects with renewalDate within next 30 days
// (excluding churned). Severity: warning.
if (window.LaunchLocal && LaunchLocal.NavBadge) {
    LaunchLocal.NavBadge.register('active-projects', async () => {
        try {
            if (!LaunchLocal.db) return { count: 0 };
            const snap = await LaunchLocal.db.collection('projects').get();
            const now = Date.now();
            const cutoff = now + (30 * 24 * 60 * 60 * 1000);
            let due = 0;
            snap.forEach((d) => {
                const p = d.data();
                if (!p || p.status === 'churned' || !p.renewalDate) return;
                const t = new Date(p.renewalDate).getTime();
                if (isNaN(t)) return;
                if (t <= cutoff) due++;
            });
            if (due > 0) return { count: due, severity: 'warning' };
            return { count: 0 };
        } catch (_) {
            return { count: 0 };
        }
    });
}
