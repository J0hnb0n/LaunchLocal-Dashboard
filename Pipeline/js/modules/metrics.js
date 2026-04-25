/* ============================================
   LaunchLocal — Metrics Module
   ============================================

   Seven charts tracking business health end-to-end:
   1. Revenue over time (one-time vs MRR, monthly)
   2. Pipeline velocity (avg days per stage)
   3. Conversion funnel (%, scouted → sold)
   4. Win rate by industry
   5. Expenses vs revenue (monthly)
   6. Commissions by rep
   7. Renewal forecast (next 90 days)
   ============================================ */

const MetricsModule = {
    prospects: [],
    projects: [],
    invoices: [],
    expenses: [],
    activityLog: [],

    async render(container) {
        container.innerHTML = this.getShellHTML();
        Icons.inject(container);

        try {
            await this.loadData();
            this.renderAllCharts();
        } catch (err) {
            console.error('Metrics load:', err);
            const body = document.getElementById('metrics-body');
            if (body) {
                body.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">${Icons.get('alert', 22)}</div>
                        <h3 class="empty-state-title">Failed to load metrics</h3>
                        <p class="empty-state-desc">Could not fetch the data needed for charts. Try refreshing.</p>
                    </div>
                `;
            }
        }

        return () => {
            Charts.destroyAll();
            this.prospects = [];
            this.projects = [];
            this.invoices = [];
            this.expenses = [];
            this.activityLog = [];
        };
    },

    getShellHTML() {
        return `
            <div class="page-header">
                <div>
                    <div class="eyebrow">Business Health</div>
                    <h2 class="page-title">Metrics</h2>
                    <p class="page-subtitle">Revenue, velocity, conversion, win rate, expenses, commissions, renewals.</p>
                </div>
            </div>

            <div class="kpi-grid" id="metrics-kpis">
                <div class="kpi-card">
                    <div class="kpi-card-header"><span class="kpi-card-label">MRR</span><div class="kpi-card-icon green" data-icon="trendUp"></div></div>
                    <div class="kpi-card-value" id="kpi-mrr"><div class="skeleton skeleton-heading" style="width:100px;height:32px;"></div></div>
                    <div class="kpi-card-change" id="kpi-mrr-sub"><div class="skeleton skeleton-text" style="width:80px;"></div></div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-card-header"><span class="kpi-card-label">Active Clients</span><div class="kpi-card-icon blue" data-icon="folder"></div></div>
                    <div class="kpi-card-value" id="kpi-clients"><div class="skeleton skeleton-heading" style="width:60px;height:32px;"></div></div>
                    <div class="kpi-card-change" id="kpi-clients-sub"><div class="skeleton skeleton-text" style="width:80px;"></div></div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-card-header"><span class="kpi-card-label">Win Rate (90d)</span><div class="kpi-card-icon amber" data-icon="check"></div></div>
                    <div class="kpi-card-value" id="kpi-winrate"><div class="skeleton skeleton-heading" style="width:60px;height:32px;"></div></div>
                    <div class="kpi-card-change" id="kpi-winrate-sub"><div class="skeleton skeleton-text" style="width:80px;"></div></div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-card-header"><span class="kpi-card-label">Renewals ≤30d</span><div class="kpi-card-icon red" data-icon="calendar"></div></div>
                    <div class="kpi-card-value" id="kpi-renewals"><div class="skeleton skeleton-heading" style="width:60px;height:32px;"></div></div>
                    <div class="kpi-card-change" id="kpi-renewals-sub"><div class="skeleton skeleton-text" style="width:80px;"></div></div>
                </div>
            </div>

            <div id="metrics-body" class="metrics-grid" style="margin-top:var(--space-5);">
                <div class="card chart-card">
                    <div class="card-header"><h3 class="card-title">Revenue over time</h3></div>
                    <div class="card-body">
                        <div class="chart-container"><canvas id="chart-revenue"></canvas></div>
                    </div>
                </div>

                <div class="card chart-card">
                    <div class="card-header"><h3 class="card-title">Pipeline velocity (avg days per stage)</h3></div>
                    <div class="card-body">
                        <div class="chart-container"><canvas id="chart-velocity"></canvas></div>
                    </div>
                </div>

                <div class="card chart-card">
                    <div class="card-header"><h3 class="card-title">Conversion funnel</h3></div>
                    <div class="card-body">
                        <div class="chart-container"><canvas id="chart-funnel"></canvas></div>
                    </div>
                </div>

                <div class="card chart-card">
                    <div class="card-header"><h3 class="card-title">Win rate by industry</h3></div>
                    <div class="card-body">
                        <div class="chart-container"><canvas id="chart-winrate"></canvas></div>
                    </div>
                </div>

                <div class="card chart-card chart-card-wide">
                    <div class="card-header"><h3 class="card-title">Expenses vs revenue</h3></div>
                    <div class="card-body">
                        <div class="chart-container"><canvas id="chart-pnl"></canvas></div>
                    </div>
                </div>

                <div class="card chart-card">
                    <div class="card-header"><h3 class="card-title">Commissions by rep</h3></div>
                    <div class="card-body">
                        <div class="chart-container"><canvas id="chart-commissions"></canvas></div>
                    </div>
                </div>

                <div class="card chart-card chart-card-wide">
                    <div class="card-header"><h3 class="card-title">Renewal forecast &middot; next 90 days</h3></div>
                    <div class="card-body" id="renewals-forecast-body">
                        <div class="loading-screen" style="min-height:80px;"><div class="spinner"></div></div>
                    </div>
                </div>
            </div>
        `;
    },

    async loadData() {
        const [prospects, projects, invoices, expenses, activityLog] = await Promise.all([
            DB.getDocs('prospects'),
            DB.getDocs('projects'),
            DB.getDocs('invoices'),
            DB.getDocs('expenses'),
            DB.getDocs('activityLog', { orderBy: [['timestamp', 'desc']], limit: 500 })
        ]);
        this.prospects = prospects;
        this.projects = projects;
        this.invoices = invoices;
        this.expenses = expenses;
        this.activityLog = activityLog;
    },

    renderAllCharts() {
        this.renderKPIs();
        this.renderRevenueChart();
        this.renderVelocityChart();
        this.renderFunnelChart();
        this.renderWinRateChart();
        this.renderPnLChart();
        this.renderCommissionsChart();
        this.renderRenewalForecast();
    },

    // ----- KPIs -----

    renderKPIs() {
        // Project records exist from `approved` onward, so gate MRR + active
        // client count on the joined prospect being `sold`. Otherwise numbers
        // inflate with every approval.
        const soldProspectIds = new Set(
            this.prospects.filter((p) => p.status === 'sold').map((p) => p.id)
        );
        const clientProjects = this.projects.filter(
            (p) => p.prospectId && soldProspectIds.has(p.prospectId) && p.status !== 'churned'
        );
        const mrr = clientProjects
            .filter((p) => p.monthlyFee)
            .reduce((s, p) => s + p.monthlyFee, 0);
        const activeClients = clientProjects.length;

        const now = Date.now();
        const NINETY = 90 * 24 * 60 * 60 * 1000;
        const recentSold = this.prospects.filter((p) =>
            p.status === 'sold' && this.firstStatusChangeAt(p.id, 'sold', now - NINETY)
        ).length;
        // Symmetric time filter: only count losses inside the same 90d window
        // so the ratio doesn't drift as history accumulates.
        const recentLost = this.prospects.filter((p) =>
            p.status === 'archived' && this.firstStatusChangeAt(p.id, 'archived', now - NINETY)
        ).length;
        const winBase = recentSold + recentLost;
        const winRate = winBase > 0 ? Math.round((recentSold / winBase) * 100) : 0;

        const renewalsDueSoon = this.projects.filter((p) => {
            if (!p.renewalDate || p.status === 'churned') return false;
            const ts = new Date(p.renewalDate).getTime();
            return !isNaN(ts) && ts - now < 30 * 24 * 60 * 60 * 1000 && ts - now > -24 * 60 * 60 * 1000;
        }).length;

        document.getElementById('kpi-mrr').innerHTML = `<span class="mono">${LaunchLocal.formatCurrency(mrr)}</span>`;
        document.getElementById('kpi-mrr-sub').textContent = `${activeClients} active project${activeClients === 1 ? '' : 's'}`;
        document.getElementById('kpi-clients').innerHTML = `<span class="mono">${activeClients}</span>`;
        document.getElementById('kpi-clients-sub').textContent = 'Non-churned';
        document.getElementById('kpi-winrate').innerHTML = `<span class="mono">${winRate}%</span>`;
        document.getElementById('kpi-winrate-sub').textContent = `${recentSold} won / ${recentLost} lost (90d)`;
        document.getElementById('kpi-renewals').innerHTML = `<span class="mono">${renewalsDueSoon}</span>`;
        document.getElementById('kpi-renewals-sub').textContent = renewalsDueSoon === 0 ? 'All clear' : 'Needs outreach';
    },

    // ----- Helpers -----

    monthKey(d) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    },

    /**
     * Walk activityLog (newest-first) to find when a prospect first hit a
     * given status. Returns a JS timestamp (ms) or null.
     * @param {string} prospectId
     * @param {string} status
     * @param {number} [sinceMs] - only count if the event is after this ms timestamp
     */
    firstStatusChangeAt(prospectId, status, sinceMs = 0) {
        // activityLog is ordered newest-first from DB.getDocs limit:500. We
        // want the oldest matching entry (first transition), so walk in reverse.
        for (let i = this.activityLog.length - 1; i >= 0; i--) {
            const a = this.activityLog[i];
            if (a.entityId !== prospectId) continue;
            if (a.action !== 'status_changed' && a.action !== 'deal_closed' && a.action !== 'prospect_created' && a.action !== 'prospect_created_manual') continue;
            const meta = a.metadata || {};
            const newStatus = meta.newStatus || meta.status || (a.action === 'deal_closed' ? 'sold' : null);
            if (newStatus !== status) continue;
            const ts = a.timestamp?.toMillis ? a.timestamp.toMillis() : (a.timestamp ? new Date(a.timestamp).getTime() : 0);
            if (ts && ts >= sinceMs) return ts;
        }
        return null;
    },

    // ----- Chart 1: Revenue over time -----

    renderRevenueChart() {
        const months = this.lastNMonths(6);
        const buckets = new Map(months.map((m) => [m.key, { oneTime: 0, maintenance: 0 }]));

        for (const inv of this.invoices) {
            if (inv.status !== 'paid' || !inv.paidDate) continue;
            const d = new Date(inv.paidDate);
            if (isNaN(d)) continue;
            const key = this.monthKey(d);
            const b = buckets.get(key);
            if (!b) continue;
            if (inv.type === 'maintenance') b.maintenance += (inv.amount || 0);
            else b.oneTime += (inv.amount || 0);
        }

        const p = Charts.palette();
        Charts.render('chart-revenue', {
            type: 'bar',
            data: {
                labels: months.map((m) => m.label),
                datasets: [
                    { label: 'One-time', data: months.map((m) => (buckets.get(m.key).oneTime || 0) / 100), backgroundColor: p.accent, borderRadius: 4 },
                    { label: 'Maintenance (MRR)', data: months.map((m) => (buckets.get(m.key).maintenance || 0) / 100), backgroundColor: p.success, borderRadius: 4 }
                ]
            },
            options: {
                scales: {
                    x: { stacked: true, grid: { display: false } },
                    y: { stacked: true, ticks: { callback: (v) => '$' + v.toLocaleString() } }
                },
                plugins: {
                    tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${LaunchLocal.formatCurrency(ctx.parsed.y * 100)}` } }
                }
            }
        });
    },

    // ----- Chart 2: Pipeline velocity -----

    renderVelocityChart() {
        const stages = ['new', 'approved', 'site-queued', 'site-ready', 'pitched', 'sold'];
        const transitions = {}; // prospectId -> { status: timestamp }
        // Walk oldest→newest (reverse of newest-first)
        for (let i = this.activityLog.length - 1; i >= 0; i--) {
            const a = this.activityLog[i];
            if (!a.entityId) continue;
            const meta = a.metadata || {};
            const ns = meta.newStatus || meta.status || (a.action === 'deal_closed' ? 'sold' : null);
            const isCreate = a.action === 'prospect_created' || a.action === 'prospect_created_manual' || a.action === 'scan_imported';
            const ts = a.timestamp?.toMillis ? a.timestamp.toMillis() : (a.timestamp ? new Date(a.timestamp).getTime() : 0);
            if (!ts) continue;
            if (isCreate) {
                if (!transitions[a.entityId]) transitions[a.entityId] = {};
                if (!transitions[a.entityId]['new']) transitions[a.entityId]['new'] = ts;
            } else if (ns && stages.includes(ns)) {
                if (!transitions[a.entityId]) transitions[a.entityId] = {};
                if (!transitions[a.entityId][ns]) transitions[a.entityId][ns] = ts;
            }
        }

        const durations = stages.slice(0, -1).map((from, i) => {
            const to = stages[i + 1];
            const samples = [];
            for (const pid of Object.keys(transitions)) {
                const t = transitions[pid];
                if (t[from] && t[to] && t[to] > t[from]) {
                    samples.push((t[to] - t[from]) / (1000 * 60 * 60 * 24));
                }
            }
            const avg = samples.length > 0 ? samples.reduce((s, x) => s + x, 0) / samples.length : 0;
            return { label: `${this.statusLabel(from)} → ${this.statusLabel(to)}`, avg: Math.round(avg * 10) / 10, n: samples.length };
        });

        const p = Charts.palette();
        Charts.render('chart-velocity', {
            type: 'bar',
            data: {
                labels: durations.map((d) => d.label),
                datasets: [{
                    label: 'Avg days',
                    data: durations.map((d) => d.avg),
                    backgroundColor: p.info,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `Avg: ${ctx.parsed.x} day${ctx.parsed.x === 1 ? '' : 's'} (${durations[ctx.dataIndex].n} sample${durations[ctx.dataIndex].n === 1 ? '' : 's'})`
                        }
                    }
                },
                scales: {
                    x: { ticks: { callback: (v) => v + 'd' } },
                    y: { grid: { display: false } }
                }
            }
        });
    },

    statusLabel(s) {
        const m = { new: 'New', approved: 'Approved', 'site-queued': 'Queued', 'site-ready': 'Ready', pitched: 'Pitched', sold: 'Sold' };
        return m[s] || s;
    },

    // ----- Chart 3: Conversion funnel -----

    renderFunnelChart() {
        // Each stage count = prospects that ever reached that stage (status
        // is at least as advanced as the stage, or was in the past).
        const stageOrder = ['new', 'approved', 'site-queued', 'site-ready', 'pitched', 'sold'];
        const rank = (s) => stageOrder.indexOf(s);
        const counts = stageOrder.map((stage) => {
            const stageRank = rank(stage);
            return this.prospects.filter((p) => {
                if (p.status === 'archived') {
                    // Archived prospects count for stages they historically passed through.
                    // Without a rich history we approximate: archived counts only for 'new'.
                    return stage === 'new';
                }
                return rank(p.status) >= stageRank;
            }).length;
        });
        const firstCount = counts[0] || 1;

        const p = Charts.palette();
        Charts.render('chart-funnel', {
            type: 'bar',
            data: {
                labels: stageOrder.map((s) => this.statusLabel(s)),
                datasets: [{
                    label: 'Prospects',
                    data: counts,
                    backgroundColor: p.accent,
                    borderRadius: 4
                }]
            },
            options: {
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const pct = firstCount > 0 ? Math.round((ctx.parsed.y / firstCount) * 100) : 0;
                                return `${ctx.parsed.y} prospects (${pct}% of intake)`;
                            }
                        }
                    }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: { beginAtZero: true, ticks: { precision: 0 } }
                }
            }
        });
    },

    // ----- Chart 4: Win rate by industry -----

    renderWinRateChart() {
        const byIndustry = {};
        for (const p of this.prospects) {
            const key = p.industry || 'other';
            if (!byIndustry[key]) byIndustry[key] = { sold: 0, lost: 0, total: 0 };
            byIndustry[key].total++;
            if (p.status === 'sold') byIndustry[key].sold++;
            if (p.status === 'archived') byIndustry[key].lost++;
        }
        const entries = Object.entries(byIndustry)
            .filter(([, v]) => (v.sold + v.lost) > 0)
            .map(([k, v]) => ({
                label: k,
                rate: Math.round((v.sold / (v.sold + v.lost)) * 100),
                sold: v.sold,
                lost: v.lost
            }))
            .sort((a, b) => b.rate - a.rate);

        const palette = Charts.palette();
        Charts.render('chart-winrate', {
            type: 'bar',
            data: {
                labels: entries.map((e) => e.label),
                datasets: [{
                    label: 'Win rate',
                    data: entries.map((e) => e.rate),
                    backgroundColor: entries.map((e) =>
                        e.rate >= 50 ? palette.success : e.rate >= 25 ? palette.warning : palette.danger
                    ),
                    borderRadius: 4
                }]
            },
            options: {
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${entries[ctx.dataIndex].rate}% (${entries[ctx.dataIndex].sold} sold / ${entries[ctx.dataIndex].lost} lost)`
                        }
                    }
                },
                scales: {
                    x: { grid: { display: false } },
                    y: { beginAtZero: true, max: 100, ticks: { callback: (v) => v + '%' } }
                }
            }
        });
    },

    // ----- Chart 5: Expenses vs Revenue -----

    renderPnLChart() {
        const months = this.lastNMonths(6);
        const revenue = new Map(months.map((m) => [m.key, 0]));
        const expense = new Map(months.map((m) => [m.key, 0]));

        for (const inv of this.invoices) {
            if (inv.status !== 'paid' || !inv.paidDate) continue;
            const d = new Date(inv.paidDate);
            if (isNaN(d)) continue;
            const key = this.monthKey(d);
            if (revenue.has(key)) revenue.set(key, revenue.get(key) + (inv.amount || 0));
        }
        for (const ex of this.expenses) {
            const dateField = ex.date || ex.expenseDate || ex.createdAt;
            let d;
            if (dateField?.toMillis) d = new Date(dateField.toMillis());
            else if (dateField) d = new Date(dateField);
            else continue;
            if (isNaN(d)) continue;
            const key = this.monthKey(d);
            if (expense.has(key)) expense.set(key, expense.get(key) + (ex.amount || 0));
        }

        const p = Charts.palette();
        Charts.render('chart-pnl', {
            type: 'line',
            data: {
                labels: months.map((m) => m.label),
                datasets: [
                    {
                        label: 'Revenue',
                        data: months.map((m) => (revenue.get(m.key) || 0) / 100),
                        borderColor: p.success,
                        backgroundColor: 'transparent',
                        tension: 0.25,
                        pointRadius: 3
                    },
                    {
                        label: 'Expenses',
                        data: months.map((m) => (expense.get(m.key) || 0) / 100),
                        borderColor: p.danger,
                        backgroundColor: 'transparent',
                        tension: 0.25,
                        pointRadius: 3
                    }
                ]
            },
            options: {
                scales: {
                    x: { grid: { display: false } },
                    y: { ticks: { callback: (v) => '$' + v.toLocaleString() } }
                },
                plugins: {
                    tooltip: {
                        callbacks: { label: (ctx) => `${ctx.dataset.label}: ${LaunchLocal.formatCurrency(ctx.parsed.y * 100)}` }
                    }
                }
            }
        });
    },

    // ----- Chart 6: Commissions by rep -----

    renderCommissionsChart() {
        const byRep = {};
        for (const inv of this.invoices) {
            const rep = inv.salesRepId || 'unassigned';
            if (!byRep[rep]) byRep[rep] = { paid: 0, pending: 0 };
            if (inv.status === 'paid') byRep[rep].paid += (inv.commissionAmount || 0);
            else if (inv.status === 'sent' || inv.status === 'overdue') byRep[rep].pending += (inv.commissionAmount || 0);
        }
        const reps = Object.keys(byRep);
        if (reps.length === 0) {
            document.getElementById('chart-commissions').parentElement.innerHTML =
                '<div class="empty-state" style="padding:24px 8px;"><p class="empty-state-desc">No commission data yet.</p></div>';
            return;
        }

        const palette = Charts.palette();
        Charts.render('chart-commissions', {
            type: 'bar',
            data: {
                labels: reps.map((r) => r === 'unassigned' ? 'Unassigned' : r.slice(0, 8)),
                datasets: [
                    { label: 'Paid', data: reps.map((r) => (byRep[r].paid || 0) / 100), backgroundColor: palette.success, borderRadius: 4 },
                    { label: 'Pending', data: reps.map((r) => (byRep[r].pending || 0) / 100), backgroundColor: palette.warning, borderRadius: 4 }
                ]
            },
            options: {
                scales: {
                    x: { stacked: true, grid: { display: false } },
                    y: { stacked: true, ticks: { callback: (v) => '$' + v.toLocaleString() } }
                },
                plugins: {
                    tooltip: {
                        callbacks: { label: (ctx) => `${ctx.dataset.label}: ${LaunchLocal.formatCurrency(ctx.parsed.y * 100)}` }
                    }
                }
            }
        });
    },

    // ----- Chart 7: Renewal forecast (list, not chart) -----

    renderRenewalForecast() {
        const body = document.getElementById('renewals-forecast-body');
        if (!body) return;

        const now = Date.now();
        const NINETY = 90 * 24 * 60 * 60 * 1000;
        const upcoming = this.projects.filter((p) => {
            if (!p.renewalDate || p.status === 'churned') return false;
            const ts = new Date(p.renewalDate).getTime();
            return !isNaN(ts) && ts - now < NINETY && ts - now > -24 * 60 * 60 * 1000;
        }).sort((a, b) => new Date(a.renewalDate) - new Date(b.renewalDate));

        if (upcoming.length === 0) {
            body.innerHTML = `
                <div class="empty-state" style="padding:24px 8px;">
                    <div class="empty-state-icon">${Icons.get('check', 22)}</div>
                    <p class="empty-state-desc">No renewals in the next 90 days.</p>
                </div>
            `;
            Icons.inject(body);
            return;
        }

        body.innerHTML = `
            <ul class="activity-list">
                ${upcoming.slice(0, 12).map((p) => {
                    const days = Math.max(0, Math.ceil((new Date(p.renewalDate) - new Date()) / (1000 * 60 * 60 * 24)));
                    const dotClass = days <= 7 ? 'red' : days <= 30 ? 'amber' : '';
                    const link = p.prospectId ? `#project-detail?prospect=${p.prospectId}&tab=clients` : '#projects';
                    return `
                        <li class="activity-item">
                            <div class="activity-dot ${dotClass}"></div>
                            <div class="activity-content">
                                <div class="activity-text"><strong>${LaunchLocal.escapeHtml(p.clientName || 'Project')}</strong> &middot; <span class="text-muted">${LaunchLocal.escapeHtml(p.domainName || '—')}</span></div>
                                <div class="activity-time">${p.renewalDate} &middot; ${days} day${days === 1 ? '' : 's'} away &middot; ${LaunchLocal.formatCurrency(p.monthlyFee || 0)}/mo</div>
                            </div>
                            <a href="${link}" class="btn btn-ghost btn-sm">Open</a>
                        </li>
                    `;
                }).join('')}
            </ul>
        `;
    },

    lastNMonths(n) {
        const out = [];
        const now = new Date();
        for (let i = n - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            out.push({
                key: this.monthKey(d),
                label: d.toLocaleDateString('en-CA', { month: 'short' })
            });
        }
        return out;
    }
};

Router.register('metrics', MetricsModule, 'Metrics', ['admin', 'developer', 'sales']);
