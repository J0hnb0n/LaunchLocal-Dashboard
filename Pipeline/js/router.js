/* ============================================
   LaunchLocal — Hash-Based Router
   ============================================ */

/**
 * Router — Manages hash-based navigation.
 * Loads the correct module view into #module-content based on URL hash.
 * Updates sidebar active state and header title.
 */
const Router = {

    /** @type {Object<string, Object>} Registered module definitions */
    routes: {},

    /** @type {string} Currently active route */
    currentRoute: null,

    /** @type {Function|null} Cleanup function for current module */
    currentCleanup: null,

    /**
     * Register a module route.
     * @param {string} name - Route name (matches hash without #)
     * @param {Object} module - Module object with render() and optionally destroy()
     * @param {string} title - Display title for the header
     * @param {string[]} [roles] - Allowed roles (empty = all)
     */
    register(name, module, title, roles = []) {
        this.routes[name] = { module, title, roles };
    },

    /**
     * Initialize the router.
     * Sets up hashchange listener and navigates to initial route.
     */
    init() {
        window.addEventListener('hashchange', () => this.handleRoute());

        // Navigate to current hash or default to #dashboard
        if (!window.location.hash || window.location.hash === '#') {
            window.location.hash = '#dashboard';
        } else {
            this.handleRoute();
        }
    },

    /**
     * Handle a route change.
     * Cleans up previous module, checks role access, renders new module.
     */
    async handleRoute() {
        // Strip any query params from hash so #timeline?project=xyz → timeline
        const rawHash = window.location.hash.replace('#', '') || 'dashboard';
        const hash = rawHash.split('?')[0];
        const route = this.routes[hash];

        // If route doesn't exist, redirect to dashboard
        if (!route) {
            window.location.hash = '#dashboard';
            return;
        }

        // Check role access
        if (route.roles.length > 0) {
            const userRole = LaunchLocal.currentUser?.role;
            if (!route.roles.includes(userRole)) {
                LaunchLocal.toast('You don\'t have access to that module.', 'warning');
                window.location.hash = '#dashboard';
                return;
            }
        }

        // Don't re-render if nothing about the URL changed. Compare the full
        // raw hash (not just the path) so navigating between the same route
        // with different query params — e.g. two different project-detail
        // IDs — still triggers a re-render.
        if (this.currentRoute === rawHash) return;

        // Cleanup previous module
        if (this.currentCleanup && typeof this.currentCleanup === 'function') {
            try {
                this.currentCleanup();
            } catch (err) {
                console.warn('Module cleanup error:', err);
            }
        }
        this.currentCleanup = null;
        this.currentRoute = rawHash;

        // Update sidebar active state (match the path, not the raw hash)
        document.querySelectorAll('.nav-item').forEach((item) => {
            item.classList.toggle('active', item.getAttribute('data-module') === hash);
        });

        // Update header title
        const headerTitle = document.getElementById('header-title');
        if (headerTitle) {
            headerTitle.textContent = route.title;
        }

        // Close mobile sidebar if open
        document.getElementById('sidebar')?.classList.remove('open');
        document.getElementById('sidebar-overlay')?.classList.remove('open');

        // Show loading state in content area
        const content = document.getElementById('module-content');
        content.classList.remove('module-enter');
        content.innerHTML = `
            <div class="loading-screen">
                <div class="spinner spinner-lg"></div>
                <p>Loading ${LaunchLocal.escapeHtml(route.title)}...</p>
            </div>
        `;

        // Render the module
        try {
            const cleanup = await route.module.render(content);
            if (typeof cleanup === 'function') {
                this.currentCleanup = cleanup;
            }
            // Fade-in transition after render
            // Force reflow so the animation restarts on each navigation
            void content.offsetWidth;
            content.classList.add('module-enter');
            // Hydrate any data-icon elements rendered by the module
            if (window.Icons && typeof Icons.inject === 'function') Icons.inject(content);
        } catch (error) {
            console.error(`Failed to render module "${hash}":`, error);
            const alertIcon = window.Icons ? Icons.get('alert', 22) : '&#9888;';
            content.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">${alertIcon}</div>
                    <h3 class="empty-state-title">Something went wrong</h3>
                    <p class="empty-state-desc">Failed to load the ${LaunchLocal.escapeHtml(route.title)} module. Please try again.</p>
                    <button class="btn btn-primary" onclick="Router.reload()">Retry</button>
                </div>
            `;
        }
    },

    /**
     * Navigate to a specific route programmatically.
     * @param {string} route - Route name (without #)
     */
    navigate(route) {
        window.location.hash = `#${route}`;
    },

    /**
     * Reload the current route.
     */
    reload() {
        this.currentRoute = null;
        this.handleRoute();
    }
};
