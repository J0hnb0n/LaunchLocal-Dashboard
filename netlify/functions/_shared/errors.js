/**
 * Shared error / response helpers for Netlify Functions.
 *
 * All client-facing errors travel as { error: string, code: number } with a
 * matching HTTP status. This avoids leaking internal error messages and keeps
 * the dashboard's error-handling code dead simple.
 *
 * Rate-limit headers are emitted as a foundation for future enforcement —
 * values are placeholders today (real bucketed counters are TBD; see
 * Netlify Edge Functions or an external KV store).
 *
 * CORS: every browser-facing endpoint should emit credentials-friendly
 * headers tied to a single allowed origin. We avoid `*` so we can keep
 * `Access-Control-Allow-Credentials: true` for the auth endpoints.
 */

const DEFAULT_LOCAL_ORIGIN = 'http://localhost:8888';

/**
 * Resolve the dashboard's allowed origin. Priority:
 *   1. DASHBOARD_ORIGIN env var (explicit override)
 *   2. URL env var (Netlify sets this to the deployed site URL)
 *   3. localhost fallback for `netlify dev`
 */
function dashboardOrigin() {
  return process.env.DASHBOARD_ORIGIN
      || process.env.URL
      || DEFAULT_LOCAL_ORIGIN;
}

/**
 * Build a CORS header bundle. The function declares which methods/headers
 * it accepts and whether it expects cookies — everything else is fixed.
 */
function corsHeaders({ methods = ['GET', 'POST'], headers = ['Content-Type', 'Authorization'], credentials = false, requestOrigin = null } = {}) {
  // If the request came from a known-good origin, echo it; otherwise fall back
  // to the configured dashboard origin. Avoids `*` so credentialed CORS works.
  const allowed = dashboardOrigin();
  const origin = requestOrigin && (requestOrigin === allowed || isLocalOrigin(requestOrigin))
    ? requestOrigin
    : allowed;

  const out = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': methods.concat('OPTIONS').join(', '),
    'Access-Control-Allow-Headers': headers.join(', '),
    'Vary': 'Origin'
  };
  if (credentials) {
    out['Access-Control-Allow-Credentials'] = 'true';
  }
  return out;
}

function isLocalOrigin(origin) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');
}

/**
 * Per-endpoint rate-limit envelope. Hardcoded for now; real enforcement TBD.
 * Returns headers, not a decision — the function still serves the request.
 */
function rateLimitHeaders(perMinuteLimit = 60) {
  return {
    'X-RateLimit-Limit': String(perMinuteLimit),
    // Placeholder — when real counters land, this becomes (limit - hits) for the
    // current window. For now it's just below the limit so dashboards don't 0-out.
    'X-RateLimit-Remaining': String(perMinuteLimit - 1),
    'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 60)
  };
}

/**
 * Standard error response. Body is always { error, code } with a matching
 * HTTP statusCode. extraHeaders lets callers fold in CORS or rate-limit
 * headers without re-declaring Content-Type.
 */
function errorResponse(statusCode, message, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...extraHeaders
    },
    body: JSON.stringify({ error: message, code: statusCode })
  };
}

/**
 * Generic 500. Logs the actual error server-side, returns a sanitized
 * message to the client so we don't leak stack traces or env details.
 */
function internalError(err, label, extraHeaders = {}) {
  // eslint-disable-next-line no-console
  console.error(`[${label || 'function'}] internal error:`, err && err.stack || err);
  return errorResponse(500, 'Internal server error', extraHeaders);
}

/**
 * Preflight handler. Returns 204 + CORS headers for OPTIONS requests.
 * Returns null if the request isn't a preflight, so callers can:
 *   const pf = preflight(event, opts); if (pf) return pf;
 */
function preflight(event, corsOpts) {
  if (event.httpMethod !== 'OPTIONS') return null;
  const requestOrigin = (event.headers && (event.headers.origin || event.headers.Origin)) || null;
  return {
    statusCode: 204,
    headers: corsHeaders({ ...corsOpts, requestOrigin }),
    body: ''
  };
}

module.exports = {
  dashboardOrigin,
  corsHeaders,
  rateLimitHeaders,
  errorResponse,
  internalError,
  preflight
};
