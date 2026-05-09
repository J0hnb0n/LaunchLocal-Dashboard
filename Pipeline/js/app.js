/* ============================================
   LaunchLocal — App Initialization
   ============================================ */

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDlCCjTmJ14nkcBR4wsNti_M9Kq7lXqd7I",
    authDomain: "launchlocal-89789.firebaseapp.com",
    projectId: "launchlocal-89789",
    storageBucket: "launchlocal-89789.firebasestorage.app",
    messagingSenderId: "833492185470",
    appId: "1:833492185470:web:8ddd78238aa483b51b832f"
};

/**
 * LaunchLocal — Global App Namespace
 * Handles initialization, state, toast notifications, and role-based nav.
 *
 * Note: the Google Places + PageSpeed API key used to live here as
 * GOOGLE_API_KEY. It now lives server-side in a Netlify env var, accessed
 * only via /api/places and /api/pagespeed (see js/utils/api.js). Anything
 * that needs it goes through those proxies.
 */
const LaunchLocal = {
    currentUser: null,
    firebaseApp: null,
    db: null,
    auth: null,

    /**
     * Initialize Firebase and core services.
     * Called once on every page load.
     */
    init() {
        if (!firebase.apps.length) {
            this.firebaseApp = firebase.initializeApp(firebaseConfig);
        } else {
            this.firebaseApp = firebase.app();
        }

        this.auth = firebase.auth();
        this.db = firebase.firestore();

        // Enable Firestore offline persistence
        this.db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
            if (err.code === 'failed-precondition') {
                window.log?.warn('Firestore persistence failed: multiple tabs open.');
            } else if (err.code === 'unimplemented') {
                window.log?.warn('Firestore persistence not supported in this browser.');
            }
        });

        // Set auth persistence to local (survives browser restart)
        this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch((err) => {
            window.log?.warn('Auth persistence error:', err);
        });

        // Warm the grants dataset so the sales cheat sheet has matches ready
        if (this.Grants) this.Grants.preload();
    },

    /**
     * Show/hide nav items based on user role.
     * Items with data-roles attribute are visible only if user role is listed.
     * Items without data-roles are visible to all authenticated users.
     * @param {string} role - 'admin', 'sales', or 'developer'
     */
    applyRoleNav(role) {
        const navItems = document.querySelectorAll('.nav-item[data-roles]');
        navItems.forEach((item) => {
            const allowedRoles = item.getAttribute('data-roles').split(',');
            if (allowedRoles.includes(role)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    },

    /**
     * Display a toast notification.
     * @param {string} message - The message text
     * @param {'info'|'success'|'warning'|'error'} type - Toast type
     * @param {number} duration - Auto-dismiss time in ms (defaults to AppConfig.TOAST_DURATION_MS)
     */
    toast(message, type = 'info', duration = (window.AppConfig && window.AppConfig.TOAST_DURATION_MS) || 4000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const iconMap = { info: 'info', success: 'checkCircle', warning: 'alert', error: 'xCircle' };
        const iconName = iconMap[type] || 'info';
        const iconSvg = (window.Icons && Icons.get) ? Icons.get(iconName, 16) : '';

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        // a11y: announce errors/warnings assertively, others politely
        const isUrgent = (type === 'error' || type === 'warning');
        toast.setAttribute('role', isUrgent ? 'alert' : 'status');
        toast.setAttribute('aria-live', isUrgent ? 'assertive' : 'polite');
        toast.setAttribute('aria-atomic', 'true');
        toast.innerHTML = `
            <span class="toast-icon" style="flex-shrink:0; display:inline-flex; color: var(--${type === 'info' ? 'accent' : type});" aria-hidden="true">${iconSvg}</span>
            <span style="flex:1;">${this.escapeHtml(message)}</span>
            <button type="button" class="toast-close" aria-label="Dismiss">&times;</button>
        `;

        // Dismiss on click
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.dismissToast(toast);
        });

        container.appendChild(toast);

        // Auto-dismiss
        if (duration > 0) {
            setTimeout(() => this.dismissToast(toast), duration);
        }
    },

    /**
     * Remove a toast with exit animation.
     * @param {HTMLElement} toast
     */
    dismissToast(toast) {
        if (!toast || toast.classList.contains('toast-exit')) return;
        toast.classList.add('toast-exit');
        toast.addEventListener('animationend', () => toast.remove());
    },

    /**
     * Escape HTML to prevent XSS in dynamic content.
     * @param {string} str
     * @returns {string}
     */
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Format a Firestore timestamp or Date for display.
     * Uses Eastern Time as specified.
     * @param {object|Date} timestamp - Firestore Timestamp or JS Date
     * @returns {string}
     */
    formatDate(timestamp) {
        if (!timestamp) return '—';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-CA', {
            timeZone: 'America/Toronto',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    /**
     * Format a date as relative time (e.g., "2 hours ago").
     * @param {object|Date} timestamp
     * @returns {string}
     */
    formatRelativeTime(timestamp) {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return this.formatDate(timestamp);
    },

    /**
     * Format cents to CAD currency string.
     * @param {number} cents
     * @returns {string}
     */
    formatCurrency(cents) {
        return new Intl.NumberFormat('en-CA', {
            style: 'currency',
            currency: 'CAD'
        }).format(cents / 100);
    },

    /**
     * Accessibility utilities — modal focus trap + open/close helpers.
     * Centralized so every modal in the app gets WCAG-compliant
     * dialog semantics, focus management, and Escape-to-close behavior.
     */
    a11y: {
        /** Track active modal traps so we can clean them up. */
        _traps: new WeakMap(),

        /** Selector for tabbable elements inside a modal. */
        _focusableSelector:
            'a[href]:not([disabled]),' +
            'button:not([disabled]):not([aria-hidden="true"]),' +
            'textarea:not([disabled]),' +
            'input:not([disabled]):not([type="hidden"]),' +
            'select:not([disabled]),' +
            '[tabindex]:not([tabindex="-1"])',

        /**
         * Get the first / last visible-tabbable element in the modal.
         */
        _focusables(root) {
            return Array.from(root.querySelectorAll(this._focusableSelector))
                .filter((el) => el.offsetParent !== null || el === document.activeElement);
        },

        /**
         * Apply ARIA dialog semantics to a `.modal-overlay` element.
         * Idempotent — safe to call repeatedly.
         * @param {HTMLElement} overlay
         */
        decorateModal(overlay) {
            if (!overlay || overlay.dataset.a11yDecorated === '1') return;
            const dialog = overlay.querySelector('.modal') || overlay;
            dialog.setAttribute('role', 'dialog');
            dialog.setAttribute('aria-modal', 'true');
            const title = overlay.querySelector('.modal-title');
            if (title) {
                if (!title.id) title.id = `modal-title-${Math.random().toString(36).slice(2, 9)}`;
                dialog.setAttribute('aria-labelledby', title.id);
            }
            overlay.dataset.a11yDecorated = '1';
        },

        /**
         * Open a modal: decorate, remember focus origin, move focus inside,
         * activate focus trap + Escape-to-close.
         * @param {HTMLElement|string} overlayOrId
         */
        openModal(overlayOrId) {
            const overlay = typeof overlayOrId === 'string'
                ? document.getElementById(overlayOrId) : overlayOrId;
            if (!overlay) return;
            this.decorateModal(overlay);
            const previouslyFocused = document.activeElement;
            overlay.classList.add('open');

            const focusables = this._focusables(overlay);
            const first = focusables[0] || overlay.querySelector('.modal') || overlay;
            // Defer to next tick so display:flex applies before focus
            setTimeout(() => {
                try { first.focus({ preventScroll: true }); } catch (_) {}
            }, 0);

            const handler = (e) => {
                if (e.key === 'Escape') {
                    e.stopPropagation();
                    this.closeModal(overlay);
                    return;
                }
                if (e.key !== 'Tab') return;
                const items = this._focusables(overlay);
                if (!items.length) {
                    e.preventDefault();
                    return;
                }
                const firstEl = items[0];
                const lastEl = items[items.length - 1];
                if (e.shiftKey && document.activeElement === firstEl) {
                    e.preventDefault();
                    lastEl.focus();
                } else if (!e.shiftKey && document.activeElement === lastEl) {
                    e.preventDefault();
                    firstEl.focus();
                }
            };

            overlay.addEventListener('keydown', handler);
            this._traps.set(overlay, { handler, previouslyFocused });
        },

        /**
         * Close a modal: remove the focus trap and return focus to opener.
         * @param {HTMLElement|string} overlayOrId
         */
        closeModal(overlayOrId) {
            const overlay = typeof overlayOrId === 'string'
                ? document.getElementById(overlayOrId) : overlayOrId;
            if (!overlay) return;
            overlay.classList.remove('open');
            const trap = this._traps.get(overlay);
            if (trap) {
                overlay.removeEventListener('keydown', trap.handler);
                if (trap.previouslyFocused && typeof trap.previouslyFocused.focus === 'function') {
                    try { trap.previouslyFocused.focus({ preventScroll: true }); } catch (_) {}
                }
                this._traps.delete(overlay);
            }
        },

        /**
         * Patch a `.modal-overlay` element so any future
         * `classList.add('open')` / `classList.remove('open')`
         * automatically routes through our open/close helpers.
         *
         * Existing modules call `.classList.add('open')` directly;
         * by observing class changes we get focus management without
         * having to refactor every call site (Agent 3's lane).
         */
        observeModal(overlay) {
            if (!overlay || overlay.dataset.a11yObserved === '1') return;
            this.decorateModal(overlay);
            overlay.dataset.a11yObserved = '1';

            // Track previous open state to detect transitions
            let wasOpen = overlay.classList.contains('open');
            const obs = new MutationObserver(() => {
                const isOpen = overlay.classList.contains('open');
                if (isOpen === wasOpen) return;
                wasOpen = isOpen;
                if (isOpen) {
                    // Replicate openModal behavior without re-toggling the class
                    const previouslyFocused = document.activeElement;
                    const focusables = LaunchLocal.a11y._focusables(overlay);
                    const first = focusables[0] || overlay.querySelector('.modal') || overlay;
                    setTimeout(() => {
                        try { first.focus({ preventScroll: true }); } catch (_) {}
                    }, 0);
                    const handler = (e) => {
                        if (e.key === 'Escape') {
                            e.stopPropagation();
                            overlay.classList.remove('open');
                            return;
                        }
                        if (e.key !== 'Tab') return;
                        const items = LaunchLocal.a11y._focusables(overlay);
                        if (!items.length) { e.preventDefault(); return; }
                        const firstEl = items[0];
                        const lastEl = items[items.length - 1];
                        if (e.shiftKey && document.activeElement === firstEl) {
                            e.preventDefault();
                            lastEl.focus();
                        } else if (!e.shiftKey && document.activeElement === lastEl) {
                            e.preventDefault();
                            firstEl.focus();
                        }
                    };
                    overlay.addEventListener('keydown', handler);
                    LaunchLocal.a11y._traps.set(overlay, { handler, previouslyFocused });
                } else {
                    const trap = LaunchLocal.a11y._traps.get(overlay);
                    if (trap) {
                        overlay.removeEventListener('keydown', trap.handler);
                        if (trap.previouslyFocused && typeof trap.previouslyFocused.focus === 'function') {
                            try { trap.previouslyFocused.focus({ preventScroll: true }); } catch (_) {}
                        }
                        LaunchLocal.a11y._traps.delete(overlay);
                    }
                }
            });
            obs.observe(overlay, { attributes: true, attributeFilter: ['class'] });
        },

        /**
         * Auto-decorate every `.modal-overlay` already in the DOM and
         * those mounted later via module renders. Called once at boot.
         */
        bootstrap() {
            const decorate = (root) => {
                const overlays = (root || document).querySelectorAll('.modal-overlay');
                overlays.forEach((o) => this.observeModal(o));
            };
            decorate(document);
            // Watch the module mount point — modules re-render on route change
            const moduleRoot = document.getElementById('module-content');
            if (moduleRoot) {
                const mo = new MutationObserver(() => decorate(document));
                mo.observe(moduleRoot, { childList: true, subtree: true });
            }
        }
    }
};

// Auto-bootstrap a11y modal helpers once DOM is ready
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            try { LaunchLocal.a11y.bootstrap(); } catch (_) {}
        });
    } else {
        try { LaunchLocal.a11y.bootstrap(); } catch (_) {}
    }
}
