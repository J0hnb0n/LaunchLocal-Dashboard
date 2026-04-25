/* ============================================
   LaunchLocal — Authentication
   ============================================ */

/**
 * Auth — Handles login, logout, and session management.
 * Uses Firebase Auth with email/password provider.
 *
 * Beyond the Firebase client session, the dashboard also keeps a
 * server-side session cookie (__llSession) minted by /api/session. The
 * cookie is what gates the preview-iframe proxy in /preview/{slug}/...,
 * since iframes can't carry per-request bearer tokens.
 */
const Auth = {
    /**
     * Sign in with email and password.
     * @param {string} email
     * @param {string} password
     * @returns {Promise<firebase.auth.UserCredential>}
     */
    async login(email, password) {
        const cred = await firebase.auth().signInWithEmailAndPassword(email, password);
        // Mint the server-side session right away so the preview proxy is
        // usable as soon as the user lands on the dashboard. Best-effort —
        // if this fails (network, function down) the user can still log in;
        // they just won't see live previews until a retry.
        await this.ensureServerSession().catch((err) => {
            console.warn('Server session mint failed:', err);
        });
        return cred;
    },

    /**
     * Sign out the current user.
     * @returns {Promise<void>}
     */
    async logout() {
        // Clear the server cookie first so a stale tab can't keep
        // streaming previews after sign-out.
        await this.clearServerSession().catch(() => {});
        return firebase.auth().signOut();
    },

    /**
     * Mint the __llSession cookie from the current Firebase user's ID
     * token. Idempotent — call on login and on any auth-state change to
     * "signed in" (e.g., page reload while session is persisted).
     * Resolves silently if no user is signed in.
     */
    async ensureServerSession() {
        const user = firebase.auth().currentUser;
        if (!user) return;
        // Force-refresh: createSessionCookie requires the ID token to be
        // ≤5 min old. After page reload the cached token can be older.
        const idToken = await user.getIdToken(true);
        const res = await fetch('/api/session', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken })
        });
        if (!res.ok) {
            const detail = await res.text().catch(() => '');
            throw new Error(`session-mint failed: ${res.status} ${detail}`);
        }
    },

    /**
     * Clear the server-side session cookie. Best-effort.
     */
    async clearServerSession() {
        await fetch('/api/session/clear', {
            method: 'POST',
            credentials: 'include'
        });
    },

    /**
     * Get the currently signed-in user.
     * @returns {firebase.User|null}
     */
    getCurrentUser() {
        return firebase.auth().currentUser;
    },

    /**
     * Wait for auth state to resolve (useful for guarding pages).
     * @returns {Promise<firebase.User|null>}
     */
    waitForAuth() {
        return new Promise((resolve) => {
            const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
                unsubscribe();
                resolve(user);
            });
        });
    },

    /**
     * Send a password reset email.
     * @param {string} email
     * @returns {Promise<void>}
     */
    async resetPassword(email) {
        return firebase.auth().sendPasswordResetEmail(email);
    },

    /**
     * Check if the current user has a specific role.
     * Reads from LaunchLocal.currentUser which is set during dashboard init.
     * @param {string} role - 'admin', 'sales', or 'developer'
     * @returns {boolean}
     */
    hasRole(role) {
        return LaunchLocal.currentUser?.role === role;
    },

    /**
     * Check if the current user has one of the specified roles.
     * @param {string[]} roles - Array of role strings
     * @returns {boolean}
     */
    hasAnyRole(roles) {
        return roles.includes(LaunchLocal.currentUser?.role);
    },

    /**
     * Guard a function — only execute if user has the required role.
     * Shows a toast error if unauthorized.
     * @param {string[]} allowedRoles
     * @param {Function} fn
     */
    requireRole(allowedRoles, fn) {
        if (this.hasAnyRole(allowedRoles)) {
            fn();
        } else {
            LaunchLocal.toast('You do not have permission to perform this action.', 'error');
        }
    }
};
