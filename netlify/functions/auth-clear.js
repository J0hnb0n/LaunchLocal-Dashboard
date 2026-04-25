/**
 * POST /api/session/clear
 *
 * Clears the __llSession cookie. Called by the dashboard on logout so the
 * preview iframe can no longer fetch on this browser's behalf. Does NOT
 * revoke Firebase refresh tokens — that's the client's job via signOut().
 */

const { SESSION_COOKIE_NAME } = require('./_shared/auth');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Set-Cookie': `${SESSION_COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`
    },
    body: JSON.stringify({ ok: true })
  };
};
