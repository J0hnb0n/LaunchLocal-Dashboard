/* ============================================
   LaunchLocal — App Configuration
   ============================================
   Centralized constants and a debug-gated logger.
   Loaded BEFORE every other JS file so window.AppConfig
   and window.log are available everywhere.
   ============================================ */

window.AppConfig = {
    /** Master debug switch — when false, log/info/warn are no-ops in production. */
    DEBUG: false,

    /** Default duration (ms) before a toast auto-dismisses. */
    TOAST_DURATION_MS: 4000,

    /** Short toast duration for low-importance success/info messages. */
    TOAST_DURATION_SHORT_MS: 2000,

    /** Initial route the router falls back to when no/invalid hash. */
    DEFAULT_ROUTE: '#dashboard',

    /** Sidebar width in px (matches --sidebar-width in main.css). */
    SIDEBAR_WIDTH_PX: 244,

    /** Header height in px (matches --header-height in main.css). */
    HEADER_HEIGHT_PX: 60,

    /** Default monthly maintenance fee for newly-created project records (cents). */
    DEFAULT_MONTHLY_FEE_CENTS: 15000,

    /** HST rate used for expense calculations. */
    HST_RATE: 0.13,

    /** GA4 Measurement ID (G-XXXXXXX). Set to enable Google Analytics tracking. */
    GA4_MEASUREMENT_ID: ''
};

/**
 * Debug-gated logger. Errors ALWAYS log (they are for production debugging).
 * Wrap chatty info/warn output behind AppConfig.DEBUG so we don't pollute
 * the console in production.
 */
window.log = {
    info:  (...a) => { if (window.AppConfig && window.AppConfig.DEBUG) console.log(...a); },
    warn:  (...a) => { if (window.AppConfig && window.AppConfig.DEBUG) console.warn(...a); },
    error: (...a) => console.error(...a)
};
