/* ============================================
   LaunchLocal — Sidebar Nav Badge Utility
   ============================================

   Manages a small count badge inside each `.nav-item[data-module="..."]`
   anchor in the sidebar. Modules register a count loader; the utility
   runs them in parallel on init() and on a 60s interval, painting a
   `<span class="nav-item-badge nav-badge-{severity}">{count}</span>`
   inside the matching nav item.

   Public API:
     LaunchLocal.NavBadge.set(moduleKey, count, severity)
     LaunchLocal.NavBadge.clear(moduleKey)
     LaunchLocal.NavBadge.register(moduleKey, async () => ({ count, severity }))
     LaunchLocal.NavBadge.refresh()
     LaunchLocal.NavBadge.startAutoRefresh(intervalMs)
     LaunchLocal.NavBadge.stopAutoRefresh()
     LaunchLocal.NavBadge.init()

   All operations are defensive — missing nav items, failed Firestore
   queries, and missing modules are no-ops, never crashes.
   ============================================ */

(function () {
    if (typeof window === 'undefined') return;

    const NavBadge = {
        _loaders: new Map(),
        _autoRefreshTimer: null,
        _initialized: false,
        DEFAULT_INTERVAL_MS: 60000,

        /**
         * Find the sidebar nav anchor for a module key. Returns null if
         * the item isn't in the DOM (e.g., role-gated for current user).
         */
        _navItem(moduleKey) {
            if (!moduleKey) return null;
            const sel = `.nav-item[data-module="${moduleKey}"]`;
            try {
                return document.querySelector(sel);
            } catch (_) {
                return null;
            }
        },

        /**
         * Set / update the badge for a module.
         * @param {string} moduleKey   matches data-module="..."
         * @param {number} count       0 (or falsy) hides/removes the badge
         * @param {'info'|'warning'|'danger'} severity
         */
        set(moduleKey, count, severity) {
            const item = this._navItem(moduleKey);
            if (!item) return; // role-gated or missing — no-op

            const n = Number(count) || 0;
            let badge = item.querySelector('.nav-item-badge');

            if (n <= 0) {
                if (badge) badge.remove();
                return;
            }

            const sev = (severity === 'danger' || severity === 'warning' || severity === 'info')
                ? severity
                : 'info';

            if (!badge) {
                badge = document.createElement('span');
                badge.className = `nav-item-badge nav-badge-${sev}`;
                badge.setAttribute('aria-hidden', 'true');
                item.appendChild(badge);
            } else {
                badge.className = `nav-item-badge nav-badge-${sev}`;
            }

            // Display nicely; cap large numbers to keep sidebar tight.
            badge.textContent = n > 99 ? '99+' : String(n);
        },

        /**
         * Hide the badge for a module (equivalent to set(key, 0)).
         */
        clear(moduleKey) {
            this.set(moduleKey, 0);
        },

        /**
         * Register a count loader for a module key. Loader returns a
         * promise resolving to `{ count, severity }`. Errors are swallowed
         * during refresh — a failed loader just leaves its badge as-is.
         */
        register(moduleKey, loader) {
            if (!moduleKey || typeof loader !== 'function') return;
            this._loaders.set(moduleKey, loader);
        },

        /**
         * Run all registered loaders in parallel and apply results.
         * Never throws — individual loader failures are isolated.
         */
        async refresh() {
            if (!this._loaders.size) return;
            const entries = Array.from(this._loaders.entries());
            await Promise.all(entries.map(async ([key, loader]) => {
                try {
                    const result = await loader();
                    if (!result || typeof result !== 'object') {
                        this.clear(key);
                        return;
                    }
                    const count = Number(result.count) || 0;
                    const severity = result.severity || 'info';
                    this.set(key, count, severity);
                } catch (err) {
                    // Defensive: log but don't crash the dashboard.
                    if (window.console && console.warn) {
                        console.warn(`NavBadge loader "${key}" failed:`, err);
                    }
                }
            }));
        },

        /**
         * Start the periodic refresh loop. Safe to call repeatedly —
         * any existing timer is cleared first.
         */
        startAutoRefresh(intervalMs) {
            const ms = Number(intervalMs) || this.DEFAULT_INTERVAL_MS;
            this.stopAutoRefresh();
            this._autoRefreshTimer = setInterval(() => {
                this.refresh().catch(() => {});
            }, ms);
        },

        stopAutoRefresh() {
            if (this._autoRefreshTimer) {
                clearInterval(this._autoRefreshTimer);
                this._autoRefreshTimer = null;
            }
        },

        /**
         * One-shot bootstrap. Called from app.js after auth resolves.
         * Idempotent — only runs the first call's setup.
         */
        init(intervalMs) {
            if (this._initialized) {
                // Just kick off another refresh in case state changed.
                this.refresh().catch(() => {});
                return;
            }
            this._initialized = true;
            // First refresh immediately, then on interval.
            this.refresh().catch(() => {});
            this.startAutoRefresh(intervalMs);
        }
    };

    if (typeof window.LaunchLocal === 'undefined') {
        // app.js defines LaunchLocal — but if for some reason this script
        // loads first, fall back to a stub object so register() still works.
        window.LaunchLocal = {};
    }
    window.LaunchLocal.NavBadge = NavBadge;
})();
