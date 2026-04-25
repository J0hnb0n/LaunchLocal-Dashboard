/* ============================================
   LaunchLocal — Theme manager
   Dark default, optional light, localStorage persistent.
   Pre-paint init happens inline in <head> to avoid flash.
   ============================================ */

(function (global) {
    'use strict';

    const STORAGE_KEY = 'launchlocal:theme';
    const VALID = ['dark', 'light'];

    const Theme = {
        get() {
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (VALID.includes(saved)) return saved;
            } catch (_) { /* ignore */ }
            return 'dark';
        },

        set(next, { animate = true } = {}) {
            if (!VALID.includes(next)) return;
            const html = document.documentElement;
            if (animate) {
                html.classList.add('theme-transition');
                // clear the transition helper after it plays
                window.setTimeout(() => html.classList.remove('theme-transition'), 260);
            }
            html.setAttribute('data-theme', next);
            try { localStorage.setItem(STORAGE_KEY, next); } catch (_) { /* ignore */ }
            Theme._notify(next);
        },

        toggle() {
            Theme.set(Theme.get() === 'dark' ? 'light' : 'dark');
        },

        /** Called once by index.html / dashboard.html inline to avoid flash. */
        initEarly() {
            const t = Theme.get();
            document.documentElement.setAttribute('data-theme', t);
        },

        /** Wire a toggle button (DOM element) to flip themes and reflect state. */
        bindToggle(btn) {
            if (!btn) return;
            const update = () => {
                const cur = Theme.get();
                btn.setAttribute('aria-label',
                    cur === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
                btn.setAttribute('data-theme-state', cur);
            };
            update();
            btn.addEventListener('click', () => {
                Theme.toggle();
                update();
            });
            Theme._listeners.push(update);
        },

        _listeners: [],
        _notify(next) {
            Theme._listeners.forEach((fn) => {
                try { fn(next); } catch (_) { /* ignore */ }
            });
        }
    };

    global.Theme = Theme;
})(window);
