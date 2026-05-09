/**
 * POST /api/places
 *
 * Server-side proxy for Google Places API v1 nearbySearch. The dashboard
 * sends { lat, lng, radiusMeters, types?, rankPreference? }; this function
 * forwards to Places with the secret API key (Netlify env var) and returns
 * the raw places array. Auth-required so the key can't be called by random
 * browsers, only signed-in dashboard users.
 *
 * Hardening:
 *   - 15s upstream timeout via AbortController
 *   - Strict input validation (numeric lat/lng, bounded radius, capped types)
 *   - Standard { error, code } error shape
 *   - CORS locked to dashboard origin; rate-limit headers (60/min)
 */

const { withAuth } = require('./_shared/auth');
const { errorResponse } = require('./_shared/errors');
const { fetchWithTimeout, UpstreamTimeoutError } = require('./_shared/fetch-with-timeout');

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.websiteUri',
  'places.nationalPhoneNumber',
  'places.primaryTypeDisplayName',
  'places.businessStatus'
].join(',');

const MAX_RADIUS_METERS = 50000;       // Google's hard cap is 50 km
const MAX_TYPES = 10;                  // Anything beyond this is almost certainly junk
const MAX_TYPE_LENGTH = 64;
const ALLOWED_RANK = new Set(['DISTANCE', 'POPULARITY']);

exports.handler = withAuth(async (event) => {
  if (event.httpMethod !== 'POST') {
    return errorResponse(405, 'Method not allowed');
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    // Misconfigured server — surface a clean message rather than a 500 stack.
    return errorResponse(500, 'Server misconfigured');
  }

  let req;
  try {
    req = JSON.parse(event.body || '{}');
  } catch {
    return errorResponse(400, 'Invalid JSON body');
  }
  if (!req || typeof req !== 'object' || Array.isArray(req)) {
    return errorResponse(400, 'Body must be a JSON object');
  }

  const { lat, lng, radiusMeters, types = [], rankPreference = 'DISTANCE' } = req;

  // lat/lng — must be finite numbers in valid geographic range.
  if (typeof lat !== 'number' || !Number.isFinite(lat) || lat < -90 || lat > 90) {
    return errorResponse(400, 'lat must be a number between -90 and 90');
  }
  if (typeof lng !== 'number' || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    return errorResponse(400, 'lng must be a number between -180 and 180');
  }

  // radiusMeters — coerce, bound, reject zero/NaN.
  const radius = parseFloat(radiusMeters);
  if (!Number.isFinite(radius) || radius <= 0 || radius > MAX_RADIUS_METERS) {
    return errorResponse(400, `radiusMeters must be a positive number up to ${MAX_RADIUS_METERS}`);
  }

  // types — optional array of short strings.
  if (!Array.isArray(types)) {
    return errorResponse(400, 'types must be an array');
  }
  if (types.length > MAX_TYPES) {
    return errorResponse(400, `types may contain at most ${MAX_TYPES} entries`);
  }
  for (const t of types) {
    if (typeof t !== 'string' || t.length === 0 || t.length > MAX_TYPE_LENGTH) {
      return errorResponse(400, 'types entries must be short non-empty strings');
    }
  }

  if (typeof rankPreference !== 'string' || !ALLOWED_RANK.has(rankPreference)) {
    return errorResponse(400, 'rankPreference must be DISTANCE or POPULARITY');
  }

  const body = {
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius
      }
    },
    maxResultCount: 20,
    rankPreference
  };
  if (types.length > 0) {
    body.includedTypes = types;
  }

  let upstream;
  try {
    upstream = await fetchWithTimeout('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': FIELD_MASK
      },
      body: JSON.stringify(body)
    }, 15000);
  } catch (err) {
    if (err instanceof UpstreamTimeoutError) {
      return errorResponse(504, 'Upstream request timed out');
    }
    // Re-throw — withAuth turns this into a sanitized 500 + server log.
    throw err;
  }

  const text = await upstream.text();
  if (!upstream.ok) {
    // Don't relay Google's full error payload — could leak quota or key info.
    // eslint-disable-next-line no-console
    console.error('[places] upstream error', upstream.status, text);
    return errorResponse(upstream.status >= 500 ? 502 : upstream.status, 'Places API error');
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: text
  };
}, {
  cors: { methods: ['POST'], headers: ['Content-Type', 'Authorization'] },
  rateLimit: 60,
  label: 'places'
});
