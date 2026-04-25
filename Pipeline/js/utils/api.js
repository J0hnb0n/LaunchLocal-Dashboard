/* ============================================
   LaunchLocal — Google APIs

   Both Google endpoints are proxied through Netlify Functions
   (/api/places, /api/pagespeed) so the API key stays server-side.
   credentials: 'include' carries the __llSession cookie minted by
   Auth.ensureServerSession() — that's how the proxy knows the request
   is coming from a signed-in dashboard user.
   ============================================ */

const API = {

    /**
     * Search for nearby businesses using Places API (New).
     * @param {number} lat - Center latitude
     * @param {number} lng - Center longitude
     * @param {number} radiusMeters - Search radius in metres
     * @param {string[]} types - Google place types to include (empty = all)
     * @param {string} rankPreference - 'DISTANCE' (closest first) or 'POPULARITY' (most prominent first)
     * @returns {Promise<Array>} Raw place objects from the API
     */
    async nearbySearch(lat, lng, radiusMeters, types = [], rankPreference = 'DISTANCE') {
        const response = await fetch('/api/places', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lng, radiusMeters, types, rankPreference })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            const msg = err.error || err.detail?.error?.message || `HTTP ${response.status}`;
            throw new Error(msg);
        }

        const data = await response.json();
        return data.places || [];
    },

    /**
     * Fetch PageSpeed Insights scores for a URL.
     * Uses the mobile strategy. Returns {performance, mobile} as 0–100 integers.
     * @param {string} url
     * @returns {Promise<{performance: number, mobile: number}>}
     */
    async getPageSpeed(url) {
        const response = await fetch(`/api/pagespeed?url=${encodeURIComponent(url)}`, {
            credentials: 'include'
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const perf = Math.round((data.lighthouseResult?.categories?.performance?.score || 0) * 100);
        const exp = data.loadingExperience?.overall_category;
        const mobile = exp === 'FAST' ? 90 : exp === 'AVERAGE' ? 55 : 30;

        return { performance: perf, mobile };
    },

    /**
     * Convert a raw Places API result into a LaunchLocal prospect object.
     * @param {Object} place - Raw Places API place
     * @returns {Object}
     */
    placeToProspect(place) {
        return {
            businessName: place.displayName?.text || 'Unknown Business',
            address: place.formattedAddress || '',
            lat: place.location?.latitude || null,
            lng: place.location?.longitude || null,
            phone: place.nationalPhoneNumber || null,
            email: null,
            website: place.websiteUri || null,
            googleRating: place.rating || null,
            reviewCount: place.userRatingCount || 0,
            googlePlaceId: place.id || null,
            industry: this.mapPlaceType(place.primaryTypeDisplayName?.text),
            facebookUrl: null,
            status: 'new',
            hotLead: false,
            notes: '',
            contactLog: [],
            assignedTo: LaunchLocal.currentUser?.uid || null,
            scanBatchId: null
        };
    },

    /**
     * Map a Google place type display name to a LaunchLocal industry slug.
     * @param {string} type
     * @returns {string}
     */
    mapPlaceType(type) {
        if (!type) return 'other';
        const t = type.toLowerCase();
        if (t.includes('restaurant') || t.includes('food') || t.includes('cafe') ||
            t.includes('bakery') || t.includes('pizza') || t.includes('bar')) return 'restaurant';
        if (t.includes('plumb') || t.includes('electr') || t.includes('hvac') ||
            t.includes('contractor') || t.includes('landscap') ||
            t.includes('auto') || t.includes('repair')) return 'tradesperson';
        if (t.includes('hair') || t.includes('salon') || t.includes('spa') ||
            t.includes('nail') || t.includes('beauty') || t.includes('barber')) return 'salon';
        if (t.includes('store') || t.includes('shop') || t.includes('retail') ||
            t.includes('hardware') || t.includes('gift') || t.includes('florist')) return 'retail';
        if (t.includes('doctor') || t.includes('dental') || t.includes('optom') ||
            t.includes('clinic') || t.includes('medical') || t.includes('pharmacy')) return 'medical';
        return 'other';
    }
};
