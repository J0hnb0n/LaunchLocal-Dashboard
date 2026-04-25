/* ============================================
   LaunchLocal — Client Slug Utility
   ============================================ */

/**
 * Slug — deterministic conversion from a business name to a filesystem-safe
 * folder name used for Client-Sites/{slug}/ output.
 *
 * Rules (locked — don't change without a migration plan):
 *   - Strip apostrophes entirely ("Lam's" -> "Lams")
 *   - Split on any non-alphanumeric character
 *   - Title-case each word (first letter upper, rest lower)
 *   - Join with "-"
 *   - Business suffixes (Inc, Ltd, LLC, Corp) are preserved, not stripped
 *
 * Examples:
 *   "Lam's Restaurant"          -> "Lams-Restaurant"
 *   "Little Bones Grill"        -> "Little-Bones-Grill"
 *   "Couwenberg Concrete Inc"   -> "Couwenberg-Concrete-Inc"
 *   "Joro Wellness Spa"         -> "Joro-Wellness-Spa"
 *   "Fescue's Edge"             -> "Fescues-Edge"
 *   "  Taylor   Optical  "      -> "Taylor-Optical"
 *
 * Returns "" for empty/garbage input so callers can detect and error out.
 */
const Slug = {
    fromBusinessName(name) {
        if (!name || typeof name !== 'string') return '';

        return name
            // Drop apostrophes before splitting so "Lam's" becomes one token "Lams"
            .replace(/['\u2018\u2019]/g, '')
            // Split on any run of non-alphanumeric characters
            .split(/[^a-zA-Z0-9]+/)
            // Drop empty entries from leading/trailing separators
            .filter(Boolean)
            // Title-case each token
            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join('-');
    },

    /**
     * Resolve a unique slug against a set of taken slugs.
     * If base is taken, appends -2, -3, ... until free.
     * @param {string} base - output of fromBusinessName
     * @param {Set<string>|Array<string>} taken - slugs already in use
     */
    unique(base, taken) {
        if (!base) return '';
        const set = taken instanceof Set ? taken : new Set(taken || []);
        if (!set.has(base)) return base;
        let n = 2;
        while (set.has(`${base}-${n}`)) n++;
        return `${base}-${n}`;
    }
};

LaunchLocal.Slug = Slug;
