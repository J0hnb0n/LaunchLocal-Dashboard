/**
 * GET /api/pagespeed?url=<encoded-url>
 *
 * Server-side proxy for PageSpeed Insights v5. Returns the raw API
 * response so client code can pick the fields it cares about. Same
 * auth gate as /api/places — keeps the API key server-side.
 *
 * Hardening:
 *   - 15s upstream timeout (PSI is slow but not THAT slow)
 *   - URL parse + http(s) protocol allowlist
 *   - Reject URLs > 2048 chars (Google's own ceiling)
 *   - Block private/loopback hosts to discourage SSRF probing
 *   - Standard { error, code } error shape, CORS, rate-limit headers
 */

const { withAuth } = require('./_shared/auth');
const { errorResponse } = require('./_shared/errors');
const { fetchWithTimeout, UpstreamTimeoutError } = require('./_shared/fetch-with-timeout');

const MAX_URL_LENGTH = 2048;

// Hostnames that should never be passed to an upstream fetcher. Defense in
// depth — PageSpeed itself won't reach private IPs from Google's network,
// but blocking here keeps the surface tidy and prevents log noise.
const BLOCKED_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

function isPrivateHost(hostname) {
  if (!hostname) return true;
  const lower = hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(lower)) return true;
  // RFC1918 + link-local + uniquelocal IPv6 (rough — string match is enough here).
  if (/^10\./.test(lower)) return true;
  if (/^192\.168\./.test(lower)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(lower)) return true;
  if (/^169\.254\./.test(lower)) return true;
  if (/^f[cd][0-9a-f]{2}:/i.test(lower)) return true;
  return false;
}

exports.handler = withAuth(async (event) => {
  if (event.httpMethod !== 'GET') {
    return errorResponse(405, 'Method not allowed');
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return errorResponse(500, 'Server misconfigured');
  }

  const target = (event.queryStringParameters || {}).url;
  if (!target || typeof target !== 'string') {
    return errorResponse(400, 'url query param required');
  }
  if (target.length > MAX_URL_LENGTH) {
    return errorResponse(400, `url exceeds ${MAX_URL_LENGTH} characters`);
  }

  let parsed;
  try {
    parsed = new URL(target);
  } catch {
    return errorResponse(400, 'Invalid url');
  }
  if (!/^https?:$/.test(parsed.protocol)) {
    return errorResponse(400, 'Only http(s) URLs allowed');
  }
  if (isPrivateHost(parsed.hostname)) {
    return errorResponse(400, 'Private and loopback hosts are not allowed');
  }

  const endpoint = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'
    + `?url=${encodeURIComponent(target)}`
    + '&strategy=mobile'
    + `&key=${encodeURIComponent(apiKey)}`;

  let upstream;
  try {
    upstream = await fetchWithTimeout(endpoint, {}, 15000);
  } catch (err) {
    if (err instanceof UpstreamTimeoutError) {
      return errorResponse(504, 'Upstream request timed out');
    }
    throw err;
  }

  const text = await upstream.text();
  if (!upstream.ok) {
    // eslint-disable-next-line no-console
    console.error('[pagespeed] upstream error', upstream.status, text.slice(0, 500));
    return errorResponse(upstream.status >= 500 ? 502 : upstream.status, 'PageSpeed API error');
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
    body: text
  };
}, {
  cors: { methods: ['GET'], headers: ['Authorization'] },
  rateLimit: 60,
  label: 'pagespeed'
});
