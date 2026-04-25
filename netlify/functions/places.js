/**
 * POST /api/places
 *
 * Server-side proxy for Google Places API v1 nearbySearch. The dashboard
 * sends { lat, lng, radiusMeters, types?, rankPreference? }; this function
 * forwards to Places with the secret API key (Netlify env var) and returns
 * the raw places array. Auth-required so the key can't be called by random
 * browsers, only signed-in dashboard users.
 */

const { withAuth } = require('./_shared/auth');

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

exports.handler = withAuth(async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return jsonResponse(500, { error: 'GOOGLE_API_KEY env var not configured' });
  }

  let req;
  try {
    req = JSON.parse(event.body || '{}');
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body' });
  }

  const { lat, lng, radiusMeters, types = [], rankPreference = 'DISTANCE' } = req;
  if (typeof lat !== 'number' || typeof lng !== 'number' || !radiusMeters) {
    return jsonResponse(400, { error: 'lat, lng, radiusMeters required' });
  }

  const body = {
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: parseFloat(radiusMeters)
      }
    },
    maxResultCount: 20,
    rankPreference
  };
  if (Array.isArray(types) && types.length > 0) {
    body.includedTypes = types;
  }

  const upstream = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK
    },
    body: JSON.stringify(body)
  });

  const text = await upstream.text();
  if (!upstream.ok) {
    return jsonResponse(upstream.status, {
      error: 'Places API error',
      detail: safeJson(text)
    });
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: text
  };
});

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body)
  };
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return text; }
}
