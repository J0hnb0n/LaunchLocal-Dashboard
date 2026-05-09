/* ============================================
   LaunchLocal — Prelim Site Works Module (was Projects)
   ============================================

   Shows pre-sale jobs: prospects whose status is approved, site-queued,
   site-ready, or pitched. Once a prospect is sold, the job graduates to
   the Active Projects module. Clicking a card opens project-detail.js
   with Site / Sales / Clients / Billing tabs.
   ============================================ */

const ProjectsModule = {
    prospects: [],
    projects: [],
    sites: [],
    filterState: null,
    _filterBar: null,

    async render(container) {
        container.innerHTML = this.getShellHTML();
        Icons.inject(container);
        await this.loadData();
        this.mountFilterBar(container);
        return () => {
            try { this._filterBar?.destroy(); } catch (_) {}
            this._filterBar = null;
            this.prospects = [];
            this.projects = [];
            this.sites = [];
            this.filterState = null;
        };
    },

    getShellHTML() {
        return `
            <div class="page-header">
                <div>
                    <div class="eyebrow">Pre-sale Jobs</div>
                    <h2 class="page-title">Prelim Site Works</h2>
                    <p class="page-subtitle">Pre-sale jobs in flight — from approved prospects through pitched leads. Sold deals graduate to Active Projects.</p>
                </div>
            </div>

            <div id="projects-filter-bar"></div>

            <div id="projects-list">
                <div class="loading-screen"><div class="spinner spinner-lg"></div></div>
            </div>
        `;
    },

    async loadData() {
        try {
            const [prospects, projects, sites] = await Promise.all([
                DB.getDocs('prospects'),
                DB.getDocs('projects'),
                DB.getDocs('sites').catch(() => [])
            ]);
            this.prospects = prospects;
            this.projects = projects;
            this.sites = sites || [];
            this.renderList();
        } catch (err) {
            console.error('Projects load:', err);
            const list = document.getElementById('projects-list');
            if (list) {
                list.innerHTML = LaunchLocal.EmptyState.render({
                    icon: 'alert',
                    title: 'Failed to load',
                    desc: 'Could not fetch projects. Try refreshing.',
                    variant: 'inline-error'
                });
            }
        }
    },

    /** FilterBar entry point. */
    applyFilter(state) {
        this.filterState = state;
        this.renderList();
    },

    /**
     * A "prelim job" = any prospect whose status is past `new` but not yet
     * sold or archived (approved → pitched). Each one is joined with its
     * project record (if one exists) so cards can show domain etc.
     * Sold jobs graduate to the Active Projects module.
     */
    activeJobs() {
        const projectByProspect = new Map();
        for (const proj of this.projects) {
            if (proj.prospectId) projectByProspect.set(proj.prospectId, proj);
        }
        const PRESALE = new Set(['approved', 'site-queued', 'site-ready', 'pitched']);
        return this.prospects
            .filter((p) => PRESALE.has(p.status))
            .map((p) => ({
                prospect: p,
                project: projectByProspect.get(p.id) || null
            }));
    },

    renderList() {
        const list = document.getElementById('projects-list');
        if (!list) return;

        const fs = this.filterState || {
            search: '',
            pills: { stage: 'all' },
            selects: { industry: 'all', tier: 'all' },
            quickFilters: {},
            sort: 'stage'
        };

        const stageFilter = (fs.pills && fs.pills.stage) || 'all';
        const industry    = (fs.selects && fs.selects.industry) || 'all';
        const tier        = (fs.selects && fs.selects.tier) || 'all';
        const q           = (fs.search || '').toLowerCase().trim();
        const qf          = fs.quickFilters || {};

        // Build qa-pending site set for the qaPending quick filter
        const qaPendingProspectIds = new Set(
            (this.sites || [])
                .filter(s => s.qaStatus === 'pending')
                .map(s => s.prospectId)
                .filter(Boolean)
        );

        let jobs = this.activeJobs();

        if (stageFilter !== 'all') {
            jobs = jobs.filter((j) => j.prospect.status === stageFilter);
        }

        if (industry !== 'all') {
            jobs = jobs.filter(j => (j.prospect.industry || '') === industry);
        }

        if (tier !== 'all') {
            jobs = jobs.filter(j => (j.project?.maintenanceTier || '') === tier);
        }

        if (q) {
            jobs = jobs.filter((j) => {
                const name = (j.project?.clientName || j.prospect.businessName || '').toLowerCase();
                const domain = (j.project?.domainName || '').toLowerCase();
                const address = (j.prospect.address || '').toLowerCase();
                return name.includes(q) || domain.includes(q) || address.includes(q);
            });
        }

        if (qf.hotLead) jobs = jobs.filter(j => j.prospect.hotLead);
        if (qf.pendingRevisions) {
            jobs = jobs.filter(j => (j.project?.revisions || []).some(r => r.status === 'pending'));
        }
        if (qf.qaPending) {
            jobs = jobs.filter(j => qaPendingProspectIds.has(j.prospect.id));
        }

        jobs.sort(this.sortComparator(fs.sort));

        if (jobs.length === 0) {
            list.innerHTML = LaunchLocal.EmptyState.render({
                icon: 'folder',
                title: 'No prelim jobs match',
                desc: 'Try clearing filters, or approve a prospect in Scanner to kick one off.',
                ctaLabel: 'Open Scanner',
                ctaHref: '#scanner'
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

    sortComparator(sortBy) {
        const createdMs = (j) => {
            const c = j.project?.createdAt || j.prospect?.createdAt;
            if (!c) return 0;
            if (typeof c.toMillis === 'function') return c.toMillis();
            const t = new Date(c).getTime();
            return isNaN(t) ? 0 : t;
        };
        const stageRank = { approved: 0, 'site-queued': 1, 'site-ready': 2, pitched: 3 };
        const name = (j) => (j.project?.clientName || j.prospect?.businessName || '').toLowerCase();
        const score = (j) => j.prospect?.prospectScore || 0;

        switch (sortBy) {
            case 'newest':     return (a, b) => createdMs(b) - createdMs(a);
            case 'oldest':     return (a, b) => createdMs(a) - createdMs(b);
            case 'name':       return (a, b) => name(a).localeCompare(name(b));
            case 'score-desc': return (a, b) => score(b) - score(a);
            case 'stage':
            default:           return (a, b) => {
                const r = (stageRank[a.prospect.status] ?? 9) - (stageRank[b.prospect.status] ?? 9);
                return r !== 0 ? r : name(a).localeCompare(name(b));
            };
        }
    },

    industryOptions() {
        const set = new Set();
        for (const j of this.activeJobs()) {
            if (j.prospect.industry) set.add(j.prospect.industry);
        }
        return [{ value: 'all', label: 'All industries' }]
            .concat([...set].sort().map(i => ({ value: i, label: i })));
    },

    tierOptions() {
        const set = new Set();
        for (const j of this.activeJobs()) {
            if (j.project?.maintenanceTier) set.add(j.project.maintenanceTier);
        }
        return [{ value: 'all', label: 'All tiers' }]
            .concat([...set].sort().map(t => ({ value: t, label: t })));
    },

    mountFilterBar(container) {
        const host = container.querySelector('#projects-filter-bar');
        if (!host || !LaunchLocal.FilterBar) return;
        try { this._filterBar?.destroy(); } catch (_) {}
        this._filterBar = LaunchLocal.FilterBar.mount(host, {
            search: { placeholder: 'Search prelim work…', fields: ['businessName', 'address', 'domainName'] },
            pills: {
                key: 'stage',
                options: [
                    { key: 'all',         label: 'All' },
                    { key: 'approved',    label: 'Approved' },
                    { key: 'site-queued', label: 'Site Queued' },
                    { key: 'site-ready',  label: 'Site Ready' },
                    { key: 'pitched',     label: 'Pitched' }
                ]
            },
            selects: [
                { key: 'industry', label: 'Industry', options: this.industryOptions() },
                { key: 'tier',     label: 'Tier',     options: this.tierOptions() }
            ],
            quickFilters: [
                { key: 'hotLead',          label: 'Hot leads only' },
                { key: 'pendingRevisions', label: 'Has pending revisions' },
                { key: 'qaPending',        label: 'QA pending' }
            ],
            sort: {
                options: [
                    { value: 'stage',      label: 'By stage' },
                    { value: 'score-desc', label: 'Score (high to low)' },
                    { value: 'name',       label: 'Name (A to Z)' },
                    { value: 'newest',     label: 'Newest first' },
                    { value: 'oldest',     label: 'Oldest first' }
                ],
                default: 'stage'
            },
            urlState: true,
            onChange: (state) => this.applyFilter(state)
        });
    },

    renderJobCard(job) {
        const p = job.prospect;
        const proj = job.project;

        const stageBadge = LaunchLocal.StatusPill.render(p.status, { domain: 'prospect', withIcon: true });
        const isSold = p.status === 'sold';
        const pendingRevisions = (proj?.revisions || []).filter((r) => r.status === 'pending').length;
        const imminentRenewal = this.isRenewalImminent(proj);
        const clientName = proj?.clientName || p.businessName || 'Unnamed';

        // Meta chips mirror the Prospects card style. Sold clients show
        // domain/MRR/revisions; pre-sale jobs show industry/score so sales
        // can prioritize.
        const domainChip = proj?.domainName
            ? `<span class="meta-chip"><a href="https://${proj.domainName}" target="_blank" rel="noopener" onclick="event.stopPropagation();">${LaunchLocal.escapeHtml(proj.domainName)}</a></span>`
            : '';
        const tierChip = isSold && proj?.maintenanceTier
            ? `<span class="badge badge-${proj.maintenanceTier}">${proj.maintenanceTier}</span>`
            : '';
        const mrrChip = isSold && proj?.monthlyFee
            ? `<span class="meta-chip">${LaunchLocal.formatCurrency(proj.monthlyFee)}/mo</span>`
            : '';
        const revisionsChip = isSold && pendingRevisions > 0
            ? `<span class="meta-chip chip-warn">${pendingRevisions} pending revision${pendingRevisions === 1 ? '' : 's'}</span>`
            : '';
        const renewalChip = imminentRenewal
            ? `<span class="meta-chip chip-warn">Renewal ${proj.renewalDate}</span>`
            : '';
        const industryChip = !isSold
            ? `<span class="industry-tag">${LaunchLocal.escapeHtml(p.industry || 'other')}</span>`
            : '';
        const scorePill = !isSold
            ? `<div class="score-pill ${this.scoreClass(p.prospectScore)}">${p.prospectScore}</div>`
            : '';

        return `
            <div class="prospect-card ${imminentRenewal ? 'renewal-imminent' : ''}" data-prospect-id="${p.id}">
                <div class="prospect-card-body">
                    <div class="prospect-card-info">
                        <div class="prospect-card-name">${LaunchLocal.escapeHtml(clientName)}</div>
                        <div class="prospect-card-address">${LaunchLocal.escapeHtml(p.address || 'E-commerce')}</div>
                        <div class="prospect-card-meta">
                            ${industryChip}
                            ${domainChip}
                            ${mrrChip}
                            ${tierChip}
                            ${revisionsChip}
                            ${renewalChip}
                        </div>
                    </div>
                    <div class="prospect-card-right">
                        ${scorePill}
                        ${stageBadge}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Thin wrapper preserved for legacy callers (project-detail.js still
     * imports it as `ProjectsModule.stageBadge`). Real rendering happens
     * in StatusPill — this just keeps the old call site working.
     */
    stageBadge(status) {
        return LaunchLocal.StatusPill.render(status, { domain: 'prospect', withIcon: true });
    },

    isRenewalImminent(proj) {
        if (!proj || !proj.renewalDate || proj.status === 'churned') return false;
        const ts = new Date(proj.renewalDate).getTime();
        if (isNaN(ts)) return false;
        const days = (ts - Date.now()) / (1000 * 60 * 60 * 24);
        return days < 30 && days > -1;
    },

    scoreClass(score) {
        if (score >= 80) return 'score-hot';
        if (score >= 50) return 'score-high';
        if (score >= 20) return 'score-medium';
        return 'score-low';
    },

    // Search / stage / sort UI is owned by FilterBar (see mountFilterBar).
};

Router.register('prelim', ProjectsModule, 'Prelim Site Works', ['admin', 'developer']);

// Sidebar nav badge — sites awaiting QA (qaStatus='pending'). Severity: warning.
// Falls back to count of approved prospects (queue waiting for prompt-gen)
// if the sites query fails or returns nothing meaningful.
if (window.LaunchLocal && LaunchLocal.NavBadge) {
    LaunchLocal.NavBadge.register('prelim', async () => {
        try {
            if (!LaunchLocal.db) return { count: 0 };
            const snap = await LaunchLocal.db.collection('sites')
                .where('qaStatus', '==', 'pending')
                .get();
            const n = snap.size || 0;
            if (n > 0) return { count: n, severity: 'warning' };
            // Fallback: count prospects awaiting prompt-gen (status='approved')
            try {
                const fallback = await LaunchLocal.db.collection('prospects')
                    .where('status', '==', 'approved')
                    .get();
                const m = fallback.size || 0;
                if (m > 0) return { count: m, severity: 'warning' };
            } catch (_) { /* swallow */ }
            return { count: 0 };
        } catch (_) {
            // Top-level failure (e.g., sites collection missing) — try fallback.
            try {
                const fallback = await LaunchLocal.db.collection('prospects')
                    .where('status', '==', 'approved')
                    .get();
                const m = fallback.size || 0;
                if (m > 0) return { count: m, severity: 'warning' };
            } catch (_) { /* swallow */ }
            return { count: 0 };
        }
    });
}
