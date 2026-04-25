/* ============================================
   LaunchLocal — Projects Module (unified active jobs)
   ============================================

   The Projects list is the new home for every job past the Prospects
   stage. Cards show the prospect+project record joined together, and
   clicking opens a dedicated detail page with Site / Sales / Clients /
   Billing tabs (project-detail.js).
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
                    <div class="eyebrow">Active Jobs</div>
                    <h2 class="page-title">Projects</h2>
                    <p class="page-subtitle">Everything in flight — from approved prospects through live clients.</p>
                </div>
            </div>

            <div class="filter-bar">
                <input type="text" class="form-input filter-search" id="projects-search"
                    placeholder="Search by client, domain, or location…">
                <div class="stage-select-wrap">
                    <select class="form-input" id="projects-stage-filter" style="max-width:200px;">
                        <option value="all">All active</option>
                        <option value="approved">Approved (awaiting site)</option>
                        <option value="site-queued">Site in progress</option>
                        <option value="site-ready">Site ready to pitch</option>
                        <option value="pitched">Pitched</option>
                        <option value="sold">Sold / live</option>
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
                list.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">&#9888;</div>
                        <h3 class="empty-state-title">Failed to load</h3>
                        <p class="empty-state-desc">Could not fetch projects. Try refreshing.</p>
                    </div>
                `;
            }
        }
    },

    /**
     * An "active job" = any prospect whose status is past `new` and not
     * `archived`. Each one is joined with its project record (if one exists)
     * so cards can show domain, maintenance tier, renewal, etc.
     */
    activeJobs() {
        const projectByProspect = new Map();
        for (const proj of this.projects) {
            if (proj.prospectId) projectByProspect.set(proj.prospectId, proj);
        }
        const ACTIVE = new Set(['approved', 'site-queued', 'site-ready', 'pitched', 'sold']);
        return this.prospects
            .filter((p) => ACTIVE.has(p.status))
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
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">${Icons.get('folder', 22)}</div>
                    <h3 class="empty-state-title">No active jobs</h3>
                    <p class="empty-state-desc">Approve a prospect in the Prospects tab to start one.</p>
                </div>
            `;
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
        const stageRank = { approved: 0, 'site-queued': 1, 'site-ready': 2, pitched: 3, sold: 4 };
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

        const stageBadge = this.stageBadge(p.status);
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

    stageBadge(status) {
        const map = {
            approved: { cls: 'badge-approved', label: 'Approved' },
            'site-queued': { cls: 'badge-queued', label: 'Site Queued' },
            'site-ready': { cls: 'badge-ready', label: 'Site Ready' },
            pitched: { cls: 'badge-pitched', label: 'Pitched' },
            sold: { cls: 'badge-sold', label: 'Sold' }
        };
        const cfg = map[status] || { cls: 'badge-neutral', label: status || 'unknown' };
        return `<span class="badge ${cfg.cls}">${cfg.label}</span>`;
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

Router.register('projects', ProjectsModule, 'Projects', ['admin', 'developer', 'sales']);
