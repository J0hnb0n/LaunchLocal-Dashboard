/* ============================================
   LaunchLocal — Analytics Module
   ============================================
   Live view of GA4 events tracked in this session.
   Shows setup status, event stream, event type
   breakdown chart, and a link to the full GA4
   console.
   ============================================ */

const AnalyticsModule = {

    _pollTimer: null,
    _lastCount: 0,

    async render(container) {
        const id = window.AppConfig && window.AppConfig.GA4_MEASUREMENT_ID;
        const isConfigured = !!id;

        container.innerHTML = `
            <div class="module-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:24px;">
                <h2 style="margin:0;">Analytics</h2>
                ${isConfigured ? `<a href="https://analytics.google.com" target="_blank" rel="noopener" class="btn btn-outline" style="gap:6px;">
                    <span data-icon="globe" aria-hidden="true"></span> Open Google Analytics
                </a>` : ''}
            </div>

            <!-- Setup status -->
            <div class="card" style="margin-bottom:24px;padding:20px;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <span style="width:10px;height:10px;border-radius:50%;background:${isConfigured ? 'var(--color-success)' : 'var(--color-warning)'};flex-shrink:0;"></span>
                    <div>
                        <strong>${isConfigured ? 'GA4 Connected' : 'GA4 Not Configured'}</strong>
                        <p style="margin:4px 0 0;color:var(--text-secondary);font-size:0.875rem;">
                            ${isConfigured
                                ? `Measurement ID: <code style="background:var(--bg-secondary);padding:2px 6px;border-radius:4px;">${LaunchLocal.escapeHtml(id)}</code> &mdash; events are being sent to Google Analytics and logged locally.`
                                : 'Set <code>GA4_MEASUREMENT_ID</code> in <code>js/config.js</code> to start sending events to Google Analytics. Local event logging is still active.'}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Stats row -->
            <div class="stats-row" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:24px;">
                <div class="card" style="padding:16px;text-align:center;">
                    <div style="font-size:0.75rem;text-transform:uppercase;color:var(--text-secondary);margin-bottom:4px;">Events This Session</div>
                    <div id="analytics-total-events" style="font-size:1.75rem;font-weight:700;">0</div>
                </div>
                <div class="card" style="padding:16px;text-align:center;">
                    <div style="font-size:0.75rem;text-transform:uppercase;color:var(--text-secondary);margin-bottom:4px;">Page Views</div>
                    <div id="analytics-page-views" style="font-size:1.75rem;font-weight:700;">0</div>
                </div>
                <div class="card" style="padding:16px;text-align:center;">
                    <div style="font-size:0.75rem;text-transform:uppercase;color:var(--text-secondary);margin-bottom:4px;">Custom Events</div>
                    <div id="analytics-custom-events" style="font-size:1.75rem;font-weight:700;">0</div>
                </div>
                <div class="card" style="padding:16px;text-align:center;">
                    <div style="font-size:0.75rem;text-transform:uppercase;color:var(--text-secondary);margin-bottom:4px;">Event Types</div>
                    <div id="analytics-event-types" style="font-size:1.75rem;font-weight:700;">0</div>
                </div>
            </div>

            <!-- Two-column layout: chart + event stream -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start;">
                <!-- Event type breakdown chart -->
                <div class="card" style="padding:20px;">
                    <h3 style="margin:0 0 16px;font-size:1rem;">Event Breakdown</h3>
                    <div id="analytics-chart-container" style="position:relative;height:280px;">
                        <canvas id="analytics-chart"></canvas>
                    </div>
                </div>

                <!-- Live event stream -->
                <div class="card" style="padding:20px;">
                    <h3 style="margin:0 0 16px;font-size:1rem;">Live Event Stream</h3>
                    <div id="analytics-event-stream" style="max-height:320px;overflow-y:auto;font-family:var(--font-mono, monospace);font-size:0.8rem;"></div>
                </div>
            </div>

            <!-- Tracked events reference -->
            <div class="card" style="margin-top:24px;padding:20px;">
                <h3 style="margin:0 0 12px;font-size:1rem;">Tracked Events Reference</h3>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;font-size:0.875rem;">
                    <div>
                        <strong style="color:var(--text-secondary);">Automatic</strong>
                        <ul style="margin:6px 0 0;padding-left:20px;color:var(--text-secondary);">
                            <li><code>page_view</code> &mdash; every route change</li>
                            <li><code>ga4_init</code> &mdash; GA4 loaded</li>
                            <li><code>set_user_properties</code> &mdash; role sent after login</li>
                        </ul>
                    </div>
                    <div>
                        <strong style="color:var(--text-secondary);">Pipeline Actions</strong>
                        <ul style="margin:6px 0 0;padding-left:20px;color:var(--text-secondary);">
                            <li><code>prospect_imported</code> &mdash; scouting import</li>
                            <li><code>prospect_approved</code> &mdash; scanner approval</li>
                            <li><code>site_generated</code> &mdash; site queued</li>
                            <li><code>prospect_pitched</code> &mdash; pitch logged</li>
                            <li><code>prospect_sold</code> &mdash; deal closed</li>
                        </ul>
                    </div>
                    <div>
                        <strong style="color:var(--text-secondary);">Other</strong>
                        <ul style="margin:6px 0 0;padding-left:20px;color:var(--text-secondary);">
                            <li><code>invoice_created</code> &mdash; new invoice</li>
                            <li><code>expense_logged</code> &mdash; expense added</li>
                            <li><code>search_performed</code> &mdash; places search</li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Responsive override for mobile -->
            <style>
                @media (max-width: 768px) {
                    #module-content [style*="grid-template-columns:1fr 1fr"] {
                        grid-template-columns: 1fr !important;
                    }
                }
            </style>
        `;

        if (window.Icons) Icons.inject(container);

        this._lastCount = 0;
        this._refresh();
        this._pollTimer = setInterval(() => this._refresh(), 2000);

        return () => this.destroy();
    },

    _refresh() {
        const events = (window.GA4 && GA4.events) || [];
        if (events.length === this._lastCount) return;
        this._lastCount = events.length;

        const pageViews = events.filter(e => e.name === 'page_view').length;
        const internal = new Set(['ga4_init', 'page_view', 'set_user_properties']);
        const custom = events.filter(e => !internal.has(e.name)).length;
        const types = new Set(events.map(e => e.name)).size;

        const el = (id) => document.getElementById(id);
        const totalEl = el('analytics-total-events');
        if (totalEl) totalEl.textContent = events.length;
        const pvEl = el('analytics-page-views');
        if (pvEl) pvEl.textContent = pageViews;
        const ceEl = el('analytics-custom-events');
        if (ceEl) ceEl.textContent = custom;
        const etEl = el('analytics-event-types');
        if (etEl) etEl.textContent = types;

        this._renderStream(events);
        this._renderChart(events);
    },

    _renderStream(events) {
        const stream = document.getElementById('analytics-event-stream');
        if (!stream) return;

        const shown = events.slice(0, 50);
        if (shown.length === 0) {
            stream.innerHTML = '<div style="color:var(--text-secondary);padding:12px;text-align:center;">No events yet &mdash; navigate around the dashboard to generate some.</div>';
            return;
        }

        stream.innerHTML = shown.map(ev => {
            const time = new Date(ev.timestamp).toLocaleTimeString();
            const color = ev.name === 'page_view' ? 'var(--color-primary)' : 'var(--color-success)';
            const paramStr = ev.params && Object.keys(ev.params).length
                ? ' ' + Object.entries(ev.params).map(([k, v]) => `<span style="color:var(--text-secondary)">${LaunchLocal.escapeHtml(k)}=</span>${LaunchLocal.escapeHtml(String(v))}`).join(' ')
                : '';
            return `<div style="padding:6px 8px;border-bottom:1px solid var(--border-color);display:flex;gap:8px;align-items:baseline;">
                <span style="color:var(--text-secondary);flex-shrink:0;font-size:0.75rem;">${time}</span>
                <span style="color:${color};font-weight:600;">${LaunchLocal.escapeHtml(ev.name)}</span>
                <span style="font-size:0.75rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${paramStr}</span>
            </div>`;
        }).join('');
    },

    _renderChart(events) {
        if (!window.Charts) return;
        const counts = {};
        events.forEach(ev => { counts[ev.name] = (counts[ev.name] || 0) + 1; });

        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
        if (sorted.length === 0) return;

        const palette = Charts.palette();
        Charts.render('analytics-chart', {
            type: 'doughnut',
            data: {
                labels: sorted.map(([name]) => name),
                datasets: [{
                    data: sorted.map(([, count]) => count),
                    backgroundColor: palette.slice(0, sorted.length)
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { boxWidth: 12, padding: 8, font: { size: 11 } } }
                }
            }
        });
    },

    destroy() {
        if (this._pollTimer) {
            clearInterval(this._pollTimer);
            this._pollTimer = null;
        }
        Charts.destroyAll();
    }
};

Router.register('analytics', AnalyticsModule, 'Analytics', ['admin']);
