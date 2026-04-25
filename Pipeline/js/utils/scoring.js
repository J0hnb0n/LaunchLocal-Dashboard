/* ============================================
   LaunchLocal — Prospect Scoring Algorithm
   ============================================ */

/**
 * Scoring — calculates a prospect's opportunity score.
 *
 * Score ranges:
 *   80+  → Hot Lead (auto-flagged)
 *   50–79 → High
 *   20–49 → Medium
 *   0–19  → Low
 */
const Scoring = {

    /**
     * Calculate a prospect's score.
     * Pass optional pageSpeed data to include website quality factors.
     *
     * @param {Object} prospect
     * @param {Object|null} [pageSpeed] - { performance: 0-100, mobile: 0-100 }
     * @returns {{ score: number, breakdown: Object }}
     */
    calculate(prospect, pageSpeed = null) {
        const breakdown = {};
        let score = 0;

        if (!prospect.website) {
            // No website at all — biggest opportunity
            breakdown.noWebsite = 30;
            score += 30;
        } else {
            const url = prospect.website;

            // Has a website but no SSL
            if (url.startsWith('http://')) {
                breakdown.noSSL = 15;
                score += 15;
            }

            if (pageSpeed) {
                // Not mobile-responsive
                if (pageSpeed.mobile < 50) {
                    breakdown.noMobile = 15;
                    score += 15;
                }

                // Slow PageSpeed performance
                if (pageSpeed.performance < 40) {
                    breakdown.pageSpeed = 10;
                    score += 10;
                }

                // Professional site — deduct points
                if (pageSpeed.performance >= 80 && pageSpeed.mobile >= 80) {
                    breakdown.professional = -50;
                    score -= 50;
                }
            }
        }

        // Strong Google presence = active business worth targeting
        if ((prospect.googleRating || 0) >= 4.0 && (prospect.reviewCount || 0) >= 20) {
            breakdown.googleRating = 10;
            score += 10;
        }

        // Facebook page but no website = easy upsell
        if (prospect.facebookUrl && !prospect.website) {
            breakdown.facebook = 10;
            score += 10;
        }

        return { score: Math.max(0, score), breakdown };
    },

    /**
     * Returns true if the score qualifies as a hot lead.
     * @param {number} score
     * @returns {boolean}
     */
    isHotLead(score) {
        return score >= 80;
    }
};
