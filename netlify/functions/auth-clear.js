/**
 * POST /api/session/clear
 *
 * Clears the __llSession cookie. Called by the dashboard on logout so the
 * preview iframe can no longer fetch on this browser's behalf. Does NOT
 * revoke Firebase refresh tokens — that's the client's job via signOut().
 *
 * Returns 200 regardless of current cookie state — it's idempotent.
 */

const { SESSION_COOKIE_NAME } = require('./_shared/auth');
const { errorResponse, corsHeaders, rateLimitHeaders, preflight } = require('./_shared/errors');

const CORS_OPTS = {
  methods: ['POST'],
  headers: ['Content-Type'],
  credentials: true
};

exports.handler = async (event) => {
  const requestOrigin = (event.headers && (event.headers.origin || event.headers.Origin)) || null;
  const baseHeaders = {
    ...corsHeaders({ ...CORS_OPTS, requestOrigin }),
    ...rateLimitHeaders(10)
  };

  const pf = preflight(event, CORS_OPTS);
  if (pf) return pf;

  if (event.httpMethod !== 'POST') {
    return errorResponse(405, 'Method not allowed', baseHeaders);
  }

  // Match the attribute set used when minting the cookie (auth-session.js).
  const cookieParts = [
    `${SESSION_COOKIE_NAME}=`,
    'Max-Age=0',
    'Path=/',
    'HttpOnly',
    'SameSite=Lax'
  ];
  if (process.env.CONTEXT !== 'dev' && !isLocalhost(event)) {
    cookieParts.push('Secure');
  }

  return {
    statusCode: 200,
    headers: {
      ...baseHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Set-Cookie': cookieParts.join('; ')
    },
    body: JSON.stringify({ ok: true })
  };
};

function isLocalhost(event) {
  const host = (event.headers && (event.headers.host || event.headers.Host)) || '';
  return host.startsWith('localhost') || host.startsWith('127.0.0.1');
}
