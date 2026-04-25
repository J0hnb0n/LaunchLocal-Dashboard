/**
 * GET /api/pagespeed?url=<encoded-url>
 *
 * Server-side proxy for PageSpeed Insights v5. Returns the raw API
 * response so client code can pick the fields it cares about. Same
 * auth gate as /api/places — keeps the API key server-side.
 */

const { withAuth } = require('./_shared/auth');

exports.handler = withAuth(async (event) => {
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return jsonResponse(500, { error: 'GOOGLE_API_KEY env var not configured' });
  }

  const target = (event.queryStringParameters || {}).url;
  if (!target) {
    return jsonResponse(400, { error: 'url query param required' });
  }

  // Reject obviously bad inputs
  let parsed;
  try { parsed = new URL(target); } catch {
    return jsonResponse(400, { error: 'Invalid url' });
  }
  if (!/^https?:$/.test(parsed.protocol)) {
    return jsonResponse(400, { error: 'Only http(s) URLs allowed' });
  }

  const endpoint = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'
    + `?url=${encodeURIComponent(target)}`
    + '&strategy=mobile'
    + `&key=${apiKey}`;

  const upstream = await fetch(endpoint);
  const text = await upstream.text();
  if (!upstream.ok) {
    return jsonResponse(upstream.status, {
      error: 'PageSpeed API error',
      detail: safeJson(text)
    });
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
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
