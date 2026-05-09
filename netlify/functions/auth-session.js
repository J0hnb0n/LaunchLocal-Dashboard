/**
 * POST /api/session
 *
 * Mints a Firebase Auth session cookie from a verified ID token. The
 * dashboard calls this immediately after a successful Firebase signin so
 * the preview iframe (and any future server-rendered surface) can rely
 * on an httpOnly cookie instead of needing a bearer token per request.
 *
 * Body: { idToken: string }
 * Response: { ok: true }, sets __llSession cookie.
 *
 * Hardening:
 *   - POST only (preflight handled separately for OPTIONS)
 *   - idToken must be a non-empty bounded-length string
 *   - verifyIdToken({ checkRevoked: true }) BEFORE creating the cookie
 *   - On any verification failure → 401 with sanitized message
 *   - Auth-flavored CORS (credentials: true) and 10/min rate-limit envelope
 */

const { auth } = require('./_shared/admin');
const { SESSION_COOKIE_NAME } = require('./_shared/auth');
const { errorResponse, internalError, corsHeaders, rateLimitHeaders, preflight } = require('./_shared/errors');

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
const MAX_TOKEN_LENGTH = 8192; // Firebase ID tokens are ~1.2KB; 8KB is generous.

const CORS_OPTS = {
  methods: ['POST'],
  headers: ['Content-Type'],
  credentials: true
};

exports.handler = async (event) => {
  const requestOrigin = (event.headers && (event.headers.origin || event.headers.Origin)) || null;
  const baseHeaders = {
    ...corsHeaders({ ...CORS_OPTS, requestOrigin }),
    ...rateLimitHeaders(10) // auth: 10/min placeholder
  };

  const pf = preflight(event, CORS_OPTS);
  if (pf) return pf;

  if (event.httpMethod !== 'POST') {
    return errorResponse(405, 'Method not allowed', baseHeaders);
  }

  let idToken;
  try {
    const body = JSON.parse(event.body || '{}');
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return errorResponse(400, 'Body must be a JSON object', baseHeaders);
    }
    idToken = body.idToken;
  } catch {
    return errorResponse(400, 'Invalid JSON body', baseHeaders);
  }

  if (typeof idToken !== 'string' || idToken.length === 0) {
    return errorResponse(400, 'idToken is required', baseHeaders);
  }
  if (idToken.length > MAX_TOKEN_LENGTH) {
    return errorResponse(400, 'idToken too long', baseHeaders);
  }
  // A Firebase ID token is a JWT — three base64url segments separated by dots.
  // Quick sniff before paying for verifyIdToken.
  if ((idToken.match(/\./g) || []).length !== 2) {
    return errorResponse(401, 'Invalid token', baseHeaders);
  }

  let decoded;
  try {
    // Verify FIRST (with revocation check). Only mint a cookie on success.
    decoded = await auth().verifyIdToken(idToken, true);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[auth-session] verifyIdToken failed', err && err.code, err && err.message);
    return errorResponse(401, 'Invalid token', baseHeaders);
  }

  let sessionCookie;
  try {
    sessionCookie = await auth().createSessionCookie(idToken, { expiresIn: FIVE_DAYS_MS });
  } catch (err) {
    return internalError(err, 'auth-session', baseHeaders);
  }

  const cookieParts = [
    `${SESSION_COOKIE_NAME}=${sessionCookie}`,
    `Max-Age=${Math.floor(FIVE_DAYS_MS / 1000)}`,
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
    body: JSON.stringify({ ok: true, uid: decoded.uid })
  };
};

function isLocalhost(event) {
  const host = (event.headers && (event.headers.host || event.headers.Host)) || '';
  return host.startsWith('localhost') || host.startsWith('127.0.0.1');
}
