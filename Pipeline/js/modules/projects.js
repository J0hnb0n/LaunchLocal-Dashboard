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
    searchQuery: '',
    stageFilter: 'all',
    sortBy: 'oldest', // 'oldest' | 'newest' | 'stage' | 'name'

    async render(container) {
        container.innerHTML = this.getShellHTML();
        Icons.inject(container);
        this.bindEvents(container);
        await this.loadData();
        return () => {
            this.prospects = [];
            this.projects = [];
            this.searchQuery = '';
            this.stageFilter = 'all';
            this.sortBy = 'oldest';
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

            <div class="filter-bar">
                <input type="text" class="form-input filter-search" id="projects-search"
                    placeholder="Search by client, domain, or location…">
                <div class="stage-select-wrap">
                    <select class="form-input" id="projects-stage-filter" style="max-width:200px;">
                        <option value="all">All pre-sale</option>
                        <option value="approved">Approved (awaiting site)</option>
                        <option value="site-queued">Site in progress</option>
                        <option value="site-ready">Site ready to pitch</option>
                        <option value="pitched">Pitched</option>
                    </select>
                </div>
                <div class="stage-select-wrap">
                    <select class="form-input" id="projects-sort" style="max-width:180px;" title="Sort order">
                        <option value="oldest">Oldest first</option>
                        <option value="newest">Newest first</option>
                        <option value="stage">By stage</option>
                        <option value="name">By name (A–Z)</option>
                    </select>
                </div>
            </div>

            <div id="projects-list">
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

        let jobs = this.activeJobs();
        if (this.stageFilter !== 'all') {
            jobs = jobs.filter((j) => j.prospect.status === this.stageFilter);
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
                icon: 'folder',
                title: 'No prelim jobs in flight',
                desc: 'Approve a prospect in the Scanner tab to kick one off.',
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

    sortComparator() {
        const createdMs = (j) => {
            const c = j.project?.createdAt || j.prospect?.createdAt;
            if (!c) return 0;
            if (typeof c.toMillis === 'function') return c.toMillis();
            const t = new Date(c).getTime();
            return isNaN(t) ? 0 : t;
        };
        const stageRank = { approved: 0, 'site-queued': 1, 'site-ready': 2, pitched: 3 };
        const name = (j) => (j.project?.clientName || j.prospect?.businessName || '').toLowerCase();

        switch (this.sortBy) {
            case 'newest': return (a, b) => createdMs(b) - createdMs(a);
            case 'stage':  return (a, b) => {
                const r = (stageRank[a.prospect.status] ?? 9) - (stageRank[b.prospect.status] ?? 9);
                return r !== 0 ? r : name(a).localeCompare(name(b));
            };
            case 'name':   return (a, b) => name(a).localeCompare(name(b));
            case 'oldest':
            default:       return (a, b) => createdMs(a) - createdMs(b);
        }
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

    bindEvents(container) {
        const search = container.querySelector('#projects-search');
        search?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.trim();
            this.renderList();
        });

        const stage = container.querySelector('#projects-stage-filter');
        stage?.addEventListener('change', (e) => {
            this.stageFilter = e.target.value;
            this.renderList();
        });

        const sort = container.querySelector('#projects-sort');
        sort?.addEventListener('change', (e) => {
            this.sortBy = e.target.value;
            this.renderList();
        });
    }
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
