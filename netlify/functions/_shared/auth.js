/**
 * Request-auth helpers for Netlify Functions.
 *
 * The dashboard authenticates two ways:
 *
 *   1. Bearer token in the Authorization header — used by JS-driven API
 *      calls (places, pagespeed). Sends the Firebase ID token directly.
 *   2. httpOnly session cookie (__llSession) — used by the preview iframe
 *      where we can't add headers per-request. Minted by /api/session
 *      after a successful Firebase Auth login.
 *
 * Either form, validated, returns the decoded user record (uid, email,
 * etc.) so functions can role-gate further if needed. We intentionally
 * accept either form — keeps the surface flexible.
 */

const { auth: getAuth } = require('./admin');

const SESSION_COOKIE_NAME = '__llSession';

function readCookies(headers) {
  const raw = (headers && (headers.cookie || headers.Cookie)) || '';
  const out = {};
  raw.split(/;\s*/).forEach(part => {
    if (!part) return;
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

function readBearer(headers) {
  const h = (headers && (headers.authorization || headers.Authorization)) || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

/**
 * Validate the request and return the decoded Firebase user.
 * Throws if no valid credential is present.
 *
 * @param {object} event - Netlify Functions event
 * @returns {Promise<object>} decoded token (uid, email, ...)
 */
async function requireUser(event) {
  const auth = getAuth();
  const headers = event.headers || {};

  const bearer = readBearer(headers);
  if (bearer) {
    return await auth.verifyIdToken(bearer, true);
  }

  const cookies = readCookies(headers);
  const session = cookies[SESSION_COOKIE_NAME];
  if (session) {
    return await auth.verifySessionCookie(session, true);
  }

  const err = new Error('Not authenticated');
  err.statusCode = 401;
  throw err;
}

/**
 * Wrap a function handler so unauth/uncaught errors return clean responses.
 */
function withAuth(handler) {
  return async (event, context) => {
    try {
      const user = await requireUser(event);
      return await handler(event, context, user);
    } catch (err) {
      const status = err.statusCode || (
        err.code === 'auth/id-token-expired' || err.code === 'auth/session-cookie-expired'
          ? 401 : 500
      );
      return {
        statusCode: status,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        body: JSON.stringify({ error: err.message || 'Server error' })
      };
    }
  };
}

module.exports = {
  SESSION_COOKIE_NAME,
  readCookies,
  readBearer,
  requireUser,
  withAuth
};
