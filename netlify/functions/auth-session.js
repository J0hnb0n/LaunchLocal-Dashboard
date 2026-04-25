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
 */

const { auth } = require('./_shared/admin');
const { SESSION_COOKIE_NAME } = require('./_shared/auth');

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  let idToken;
  try {
    const body = JSON.parse(event.body || '{}');
    idToken = body.idToken;
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body' });
  }

  if (!idToken || typeof idToken !== 'string') {
    return jsonResponse(400, { error: 'idToken is required' });
  }

  try {
    // createSessionCookie enforces "auth_time within last 5 min" itself —
    // no need to double-check on our side. We still verifyIdToken so we can
    // include the uid in the response and surface revoked tokens cleanly.
    const decoded = await auth().verifyIdToken(idToken, true);

    const sessionCookie = await auth().createSessionCookie(idToken, { expiresIn: FIVE_DAYS_MS });
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
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Set-Cookie': cookieParts.join('; ')
      },
      body: JSON.stringify({ ok: true, uid: decoded.uid })
    };
  } catch (err) {
    return jsonResponse(401, { error: err.message || 'Invalid token' });
  }
};

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body)
  };
}

function isLocalhost(event) {
  const host = (event.headers && (event.headers.host || event.headers.Host)) || '';
  return host.startsWith('localhost') || host.startsWith('127.0.0.1');
}
