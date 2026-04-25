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
                console.warn('Firestore persistence failed: multiple tabs open.');
            } else if (err.code === 'unimplemented') {
                console.warn('Firestore persistence not supported in this browser.');
            }
        });

        // Set auth persistence to local (survives browser restart)
        this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch((err) => {
            console.warn('Auth persistence error:', err);
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
     * @param {number} duration - Auto-dismiss time in ms (default 4000)
     */
    toast(message, type = 'info', duration = 4000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const iconMap = { info: 'info', success: 'checkCircle', warning: 'alert', error: 'xCircle' };
        const iconName = iconMap[type] || 'info';
        const iconSvg = (window.Icons && Icons.get) ? Icons.get(iconName, 16) : '';

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon" style="flex-shrink:0; display:inline-flex; color: var(--${type === 'info' ? 'accent' : type});">${iconSvg}</span>
            <span style="flex:1;">${this.escapeHtml(message)}</span>
            <button class="modal-close" style="margin-left: auto; flex-shrink: 0;" aria-label="Dismiss">&times;</button>
        `;

        // Dismiss on click
        toast.querySelector('button').addEventListener('click', () => {
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
    }
};
