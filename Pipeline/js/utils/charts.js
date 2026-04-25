/* ============================================
   LaunchLocal — Chart.js Theme Wrapper
   ============================================ */

/**
 * Charts — thin wrapper around Chart.js 4.x that pulls colors/fonts from
 * CSS custom properties so charts track the dark/light theme toggle.
 */
const Charts = {

    /** @type {Map<string, Chart>} active chart instances keyed by canvas id */
    _instances: new Map(),

    _readVar(name, fallback) {
        const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        return v || fallback;
    },

    palette() {
        return {
            accent:     this._readVar('--accent',      '#38BDF8'),
            success:    this._readVar('--success',     '#34D399'),
            warning:    this._readVar('--warning',     '#FBBF24'),
            danger:     this._readVar('--danger',      '#F87171'),
            info:       this._readVar('--info',        '#60A5FA'),
            text:       this._readVar('--text-primary',   '#E6EDF7'),
            muted:      this._readVar('--text-muted',     '#64748B'),
            grid:       this._readVar('--border',         '#1F2A3E'),
            surface:    this._readVar('--bg-surface',     '#111827')
        };
    },

    /** Default options every chart picks up — themed grid/text, tight padding. */
    defaults() {
        const p = this.palette();
        return {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 300 },
            plugins: {
                legend: {
                    labels: { color: p.text, font: { family: 'Inter' } }
                },
                tooltip: {
                    backgroundColor: p.surface,
                    titleColor: p.text,
                    bodyColor: p.text,
                    borderColor: p.grid,
                    borderWidth: 1,
                    padding: 10
                }
            },
            scales: {
                x: {
                    ticks: { color: p.muted, font: { family: 'Inter' } },
                    grid:  { color: p.grid, drawBorder: false }
                },
                y: {
                    ticks: { color: p.muted, font: { family: 'Inter' } },
                    grid:  { color: p.grid, drawBorder: false }
                }
            }
        };
    },

    /**
     * Create or replace a chart on the given canvas element.
     * @param {string|HTMLCanvasElement} target - canvas id or element
     * @param {Object} config - Chart.js config { type, data, options }
     * @returns {Chart|null}
     */
    render(target, config) {
        const canvas = typeof target === 'string' ? document.getElementById(target) : target;
        if (!canvas || !window.Chart) return null;

        const id = canvas.id || ('c_' + Math.random().toString(36).slice(2, 8));
        this.destroy(id);

        // Merge defaults deeply enough for our needs — existing keys on
        // config.options take precedence.
        const opts = config.options || {};
        const baseDefaults = this.defaults();
        const merged = {
            ...baseDefaults,
            ...opts,
            plugins: { ...baseDefaults.plugins, ...(opts.plugins || {}) },
            scales:  opts.scales === null ? undefined : { ...(baseDefaults.scales || {}), ...(opts.scales || {}) }
        };

        const instance = new Chart(canvas, { ...config, options: merged });
        this._instances.set(id, instance);
        return instance;
    },

    destroy(id) {
        const existing = this._instances.get(id);
        if (existing) {
            try { existing.destroy(); } catch (_) { /* already gone */ }
            this._instances.delete(id);
        }
    },

    destroyAll() {
        for (const [id] of this._instances) this.destroy(id);
    },

    /** Convert cents → dollars, formatted CAD for axis ticks/tooltips. */
    formatMoney(cents) {
        return LaunchLocal.formatCurrency(cents || 0);
    }
};
