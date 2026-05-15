/* ============================================
   LaunchLocal — Google Analytics 4 Helper
   ============================================
   Dynamically loads gtag.js, tracks page views
   and custom events, and keeps a local event log
   so the Analytics tab can show a live stream
   without waiting for GA4's reporting lag.
   ============================================ */

const GA4 = {

    /** Whether gtag.js has been loaded and configured */
    ready: false,

    /** Local event log — newest first */
    events: [],

    /** Max events to retain in the local log */
    MAX_EVENTS: 500,

    /**
     * Load gtag.js and configure the GA4 property.
     * Safe to call multiple times — only loads once.
     */
    init() {
        if (this.ready) return;

        const id = window.AppConfig && window.AppConfig.GA4_MEASUREMENT_ID;
        if (!id) {
            window.log?.info('[GA4] No measurement ID configured — tracking disabled');
            return;
        }

        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        window.gtag = function() { window.dataLayer.push(arguments); };
        window.gtag('js', new Date());
        window.gtag('config', id, { send_page_view: false });

        this.ready = true;
        this._log('ga4_init', { measurement_id: id });
        window.log?.info('[GA4] Initialized with', id);
    },

    /**
     * Track a page view. Called by the router on every hash change.
     * @param {string} path - Hash path (e.g. "dashboard", "scanner")
     * @param {string} title - Page title from the route definition
     */
    pageView(path, title) {
        const params = {
            page_path: `/#${path}`,
            page_title: title || path
        };
        if (this.ready) {
            window.gtag('event', 'page_view', params);
        }
        this._log('page_view', params);
    },

    /**
     * Track a custom event.
     * @param {string} name - Event name (e.g. "prospect_imported")
     * @param {Object} [params] - Event parameters
     */
    track(name, params = {}) {
        if (this.ready) {
            window.gtag('event', name, params);
        }
        this._log(name, params);
    },

    /**
     * Track user properties (role, etc.) once after login.
     * @param {Object} props - User properties to set
     */
    setUserProperties(props) {
        if (this.ready) {
            window.gtag('set', 'user_properties', props);
        }
        this._log('set_user_properties', props);
    },

    /**
     * Append to the local event log.
     * @private
     */
    _log(name, params) {
        this.events.unshift({
            name,
            params,
            timestamp: Date.now()
        });
        if (this.events.length > this.MAX_EVENTS) {
            this.events.length = this.MAX_EVENTS;
        }
    }
};
