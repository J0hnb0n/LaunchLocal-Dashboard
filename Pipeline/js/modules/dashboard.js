/* ============================================
   LaunchLocal — Dashboard Module
   ============================================ */

/**
 * DashboardModule — Main dashboard view.
 * KPI cards, pipeline funnel, revenue-over-time chart, real-time activity feed.
 */
const DashboardModule = {

    /** @type {Function|null} Unsubscribe from activity listener */
    activityUnsubscribe: null,

    async render(container) {
        container.innerHTML = this.getShellHTML();
        Icons.inject(container);

        try {
            const [prospects, sites, projects, invoices] = await Promise.all([
                this.countByStatus('prospects'),
                this.countByStatus('sites'),
                this.getProjectStats(),
                this.getRevenueThisMonth()
            ]);

            // KPI cards
            this.updateKPI('kpi-prospects', prospects.total, `${prospects.hot} hot lead${prospects.hot === 1 ? '' : 's'}`);
            this.updateKPI('kpi-sites', sites.total, `${sites.pending} in QA`);
            this.updateKPI('kpi-projects', projects.total, `${projects.active} active`);
            this.updateKPI('kpi-revenue', LaunchLocal.formatCurrency(invoices.revenue), `${invoices.count} invoice${invoices.count === 1 ? '' : 's'} paid`);

            this.renderFunnel(prospects);
            await this.renderRevenueChart();

        } catch (error) {
            console.error('Dashboard data load error:', error);
        }

        // Real-time activity feed
        this.activityUnsubscribe = DB.onSnapshot('activityLog', {
            orderBy: [['timestamp', 'desc']],
            limit: 15
        }, (activities, error) => {
            const feedContainer = document.getElementById('activity-feed');
            if (!feedContainer) return;

            if (error || activities.length === 0) {
                const icon = Icons.get('activity', 22);
                feedContainer.innerHTML = `
                    <div class="empty-state" style="padding: 32px 16px; border: none; background: transparent;">
                        <div class="empty-state-icon">${icon}</div>
                        <p class="empty-state-desc">${error ? 'Failed to load activity.' : 'No recent activity yet. Changes will appear here in real time.'}</p>
                    </div>
                `;
                return;
            }

            feedContainer.innerHTML = `
                <ul class="activity-list">
                    ${activities.map((a) => this.renderActivityItem(a)).join('')}
                </ul>
            `;
        });

        this.bindSampleDataHandlers();

        return () => {
            if (this.activityUnsubscribe) {
                this.activityUnsubscribe();
                this.activityUnsubscribe = null;
            }
            Charts.destroy('dashboard-revenue-chart');
        };
    },

    bindSampleDataHandlers() {
        const loadBtn = document.getElementById('sample-data-btn');
        const removeBtn = document.getElementById('remove-samples-btn');

        if (loadBtn) {
            loadBtn.addEventListener('click', () => SampleData.load());
        }
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                const ok = confirm(
                    'Remove sample data only?\n\nThis deletes records flagged as sample (isSample: true or known seed IDs). Real records are untouched.\n\nContinue?'
                );
                if (ok) SampleData.removeSamplesOnly();
            });
        }
    },

    getShellHTML() {
        const greeting = this.getGreeting();
        const userName = LaunchLocal.currentUser?.name || 'there';
        const isAdmin = LaunchLocal.currentUser?.role === 'admin';

        const adminActions = isAdmin ? `
            <button class="btn btn-ghost btn-sm" id="remove-samples-btn" title="Delete only sample/seeded records">
                <span data-icon="trash"></span>
                <span class="btn-text">Remove Sample Data</span>
            </button>
            <button class="btn btn-subtle btn-sm" id="sample-data-btn" title="Load demo data">
                <span data-icon="sparkles"></span>
                <span class="btn-text">Load Sample Data</span>
            </button>
        ` : '';

        return `
            <div class="page-header">
                <div>
                    <div class="eyebrow">${new Date().toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                    <h2 class="page-title">${greeting}, ${LaunchLocal.escapeHtml(userName)}</h2>
                    <p class="page-subtitle">Here's what's happening with your pipeline today.</p>
                </div>
                <div class="page-actions">
                    ${adminActions}
                </div>
            </div>

            <div class="kpi-grid">
                <div class="kpi-card" id="kpi-prospects">
                    <div class="kpi-card-header">
                        <span class="kpi-card-label">Prospects</span>
                        <div class="kpi-card-icon blue" data-icon="search"></div>
                    </div>
                    <div class="kpi-card-value"><div class="skeleton skeleton-heading" style="width:60px;height:32px;"></div></div>
                    <div class="kpi-card-change"><div class="skeleton skeleton-text" style="width:80px;"></div></div>
                </div>
                <div class="kpi-card" id="kpi-sites">
                    <div class="kpi-card-header">
                        <span class="kpi-card-label">Sites</span>
                        <div class="kpi-card-icon green" data-icon="monitor"></div>
                    </div>
                    <div class="kpi-card-value"><div class="skeleton skeleton-heading" style="width:60px;height:32px;"></div></div>
                    <div class="kpi-card-change"><div class="skeleton skeleton-text" style="width:80px;"></div></div>
                </div>
                <div class="kpi-card" id="kpi-projects">
                    <div class="kpi-card-header">
                        <span class="kpi-card-label">Projects</span>
                        <div class="kpi-card-icon amber" data-icon="folder"></div>
                    </div>
                    <div class="kpi-card-value"><div class="skeleton skeleton-heading" style="width:60px;height:32px;"></div></div>
                    <div class="kpi-card-change"><div class="skeleton skeleton-text" style="width:80px;"></div></div>
                </div>
                <div class="kpi-card" id="kpi-revenue">
                    <div class="kpi-card-header">
                        <span class="kpi-card-label">Revenue (MTD)</span>
                        <div class="kpi-card-icon purple" data-icon="trendUp"></div>
                    </div>
                    <div class="kpi-card-value"><div class="skeleton skeleton-heading" style="width:100px;height:32px;"></div></div>
                    <div class="kpi-card-change"><div class="skeleton skeleton-text" style="width:80px;"></div></div>
                </div>
            </div>

            <div class="dashboard-grid">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title"><span data-icon="layers"></span>&nbsp;Pipeline Overview</h3>
                    </div>
                    <div class="card-body" id="pipeline-funnel">
                        <div class="loading-screen" style="min-height:80px;"><div class="spinner"></div></div>
                    </div>
                </div>
                <div class="card" id="revenue-chart-card">
                    <div class="card-header">
                        <h3 class="card-title"><span data-icon="trendUp"></span>&nbsp;Revenue &middot; Last 6 months</h3>
                        <span class="chip" id="revenue-total-chip">—</span>
                    </div>
                    <div class="card-body">
                        <div class="chart-container" style="height:220px;">
                            <canvas id="dashboard-revenue-chart"></canvas>
                        </div>
                    </div>
                </div>
                <div class="card full-width">
                    <div class="card-header">
                        <h3 class="card-title"><span data-icon="activity"></span>&nbsp;Recent Activity</h3>
                        <span class="chip">Live</span>
                    </div>
                    <div class="card-body" id="activity-feed">
                        <div class="loading-screen" style="min-height:80px;"><div class="spinner"></div></div>
                    </div>
                </div>
            </div>
        `;
    },

    updateKPI(elementId, value, subtitle) {
        const card = document.getElementById(elementId);
        if (!card) return;
        const valueEl = card.querySelector('.kpi-card-value');
        const changeEl = card.querySelector('.kpi-card-change');
        if (valueEl) {
            valueEl.innerHTML = `<span class="mono">${value}</span>`;
        }
        if (changeEl) {
            changeEl.innerHTML = subtitle;
            changeEl.classList.remove('skeleton');
        }
    },

    async countByStatus(collection) {
        try {
            const docs = await DB.getDocs(collection);
            const result = { total: docs.length };

            if (collection === 'prospects') {
                result.hot = docs.filter((d) => d.hotLead === true).length;
                result.new = docs.filter((d) => d.status === 'new').length;
                result.approved = docs.filter((d) => d.status === 'approved').length;
                result.queued = docs.filter((d) => d.status === 'site-queued').length;
                result.ready = docs.filter((d) => d.status === 'site-ready').length;
                result.pitched = docs.filter((d) => d.status === 'pitched').length;
                result.sold = docs.filter((d) => d.status === 'sold').length;
            }

            if (collection === 'sites') {
                result.pending = docs.filter((d) => d.qaStatus === 'pending').length;
            }

            return result;
        } catch {
            return { total: 0, hot: 0, new: 0, approved: 0, queued: 0, ready: 0, pitched: 0, sold: 0, pending: 0 };
        }
    },

    async getProjectStats() {
        try {
            const docs = await DB.getDocs('projects');
            return {
                total: docs.length,
                active: docs.filter((d) => d.status === 'active').length,
                onboarding: docs.filter((d) => d.status === 'onboarding').length,
                maintenance: docs.filter((d) => d.status === 'maintenance').length
            };
        } catch {
            return { total: 0, active: 0, onboarding: 0, maintenance: 0 };
        }
    },

    async getRevenueThisMonth() {
        try {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const allPaid = await DB.getDocs('invoices', {
                where: [['status', '==', 'paid']]
            });

            const thisMonth = allPaid.filter((inv) => {
                if (!inv.paidDate) return false;
                const d = new Date(inv.paidDate);
                return !isNaN(d) && d >= startOfMonth;
            });

            const revenue = thisMonth.reduce((sum, inv) => sum + (inv.amount || 0), 0);
            return { revenue, count: thisMonth.length };
        } catch {
            return { revenue: 0, count: 0 };
        }
    },

    renderFunnel(prospects) {
        const funnel = document.getElementById('pipeline-funnel');
        if (!funnel) return;

        const stages = [
            { label: 'New', count: prospects.new || 0 },
            { label: 'Approved', count: prospects.approved || 0 },
            { label: 'Queued', count: prospects.queued || 0 },
            { label: 'Ready', count: prospects.ready || 0 },
            { label: 'Pitched', count: prospects.pitched || 0 },
            { label: 'Sold', count: prospects.sold || 0 }
        ];

        const maxCount = Math.max(1, ...stages.map((s) => s.count));

        funnel.innerHTML = `
            <div class="pipeline-funnel">
                ${stages.map((stage, i) => `
                    <div class="funnel-stage ${stage.count > 0 ? 'active' : ''}">
                        <div class="funnel-stage-count">${stage.count}</div>
                        <div class="funnel-stage-label">${stage.label}</div>
                    </div>
                    ${i < stages.length - 1 ? '<div class="funnel-arrow">→</div>' : ''}
                `).join('')}
            </div>
        `;
    },

    /**
     * Revenue-over-time chart. Stacks paid one-time (project/automation/other)
     * against maintenance for the last 6 months, aligned to calendar months
     * in America/Toronto.
     */
    async renderRevenueChart() {
        const canvas = document.getElementById('dashboard-revenue-chart');
        if (!canvas) return;

        let invoices = [];
        try {
            invoices = await DB.getDocs('invoices', { where: [['status', '==', 'paid']] });
        } catch {
            /* leave chart empty on failure */
        }

        const months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                label: d.toLocaleDateString('en-CA', { month: 'short' }),
                oneTime: 0,
                maintenance: 0
            });
        }
        const monthIdx = new Map(months.map((m, i) => [m.key, i]));

        for (const inv of invoices) {
            if (!inv.paidDate) continue;
            const d = new Date(inv.paidDate);
            if (isNaN(d)) continue;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const idx = monthIdx.get(key);
            if (idx === undefined) continue;
            if (inv.type === 'maintenance') months[idx].maintenance += (inv.amount || 0);
            else months[idx].oneTime += (inv.amount || 0);
        }

        const total = months.reduce((s, m) => s + m.oneTime + m.maintenance, 0);
        const chip = document.getElementById('revenue-total-chip');
        if (chip) chip.textContent = LaunchLocal.formatCurrency(total);

        const p = Charts.palette();
        Charts.render('dashboard-revenue-chart', {
            type: 'bar',
            data: {
                labels: months.map((m) => m.label),
                datasets: [
                    { label: 'One-time', data: months.map((m) => (m.oneTime || 0) / 100), backgroundColor: p.accent, borderRadius: 4 },
                    { label: 'Maintenance', data: months.map((m) => (m.maintenance || 0) / 100), backgroundColor: p.success, borderRadius: 4 }
                ]
            },
            options: {
                scales: {
                    x: { stacked: true, grid: { display: false } },
                    y: {
                        stacked: true,
                        ticks: { callback: (v) => '$' + v.toLocaleString() }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.dataset.label}: ${LaunchLocal.formatCurrency(ctx.parsed.y * 100)}`
                        }
                    }
                }
            }
        });
    },

    renderActivityItem(activity) {
        const dotColor = this.getActivityDotColor(activity.module);
        const timeStr = LaunchLocal.formatRelativeTime(activity.timestamp);
        const description = LaunchLocal.escapeHtml(activity.description || activity.action);
        const userName = LaunchLocal.escapeHtml(activity.userName || 'System');
        const moduleLabel = activity.module ? `<span class="chip">${LaunchLocal.escapeHtml(activity.module)}</span>` : '';

        return `
            <li class="activity-item">
                <div class="activity-dot ${dotColor}"></div>
                <div class="activity-content">
                    <div class="activity-text"><strong>${userName}</strong> ${description} ${moduleLabel}</div>
                    <div class="activity-time">${timeStr}</div>
                </div>
            </li>
        `;
    },

    getActivityDotColor(module) {
        const colors = {
            prospects: '',
            sites: 'green',
            sales: 'amber',
            billing: 'red',
            projects: 'green',
            expenses: 'amber'
        };
        return colors[module] || '';
    },

    getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    }
};

Router.register('dashboard', DashboardModule, 'Dashboard');
