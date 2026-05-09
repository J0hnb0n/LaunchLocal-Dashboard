/**
 * GET /preview/{slug}/{...path}
 *
 * Authenticated proxy that streams generated client-site files from
 * Firebase Storage. Serves index.html for bare-folder URLs. Forces a
 * fresh fetch when the dashboard appends ?v={previewVersion}, otherwise
 * caches privately for a minute.
 *
 * Why a proxy instead of public Storage URLs:
 *   - Slugs are guessable from business names. A public bucket would let
 *     any visitor read a client's preview.
 *   - Relative paths inside the generated index.html (style.css, etc.)
 *     resolve naturally when served from one origin path. Signed URLs
 *     break that.
 *
 * Auth: requires a valid __llSession cookie OR Authorization: Bearer.
 * Set up via /api/session on dashboard login.
 *
 * Path-traversal hardening (defense in depth):
 *   - Reject `..` raw or URL-encoded (single + double encoded)
 *   - Reject null bytes (`\0`, `%00`)
 *   - Reject backslashes (`\\`, `%5c`) — Storage uses forward slash only
 *   - Decode once, re-check; then verify final path starts with sites/{slug}/
 *   - Slug must match strict pattern (Title-Case-Hyphen + safe chars)
 */

const path = require('path');
const { bucket } = require('./_shared/admin');
const { withAuth } = require('./_shared/auth');
const { errorResponse } = require('./_shared/errors');

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm':  'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico':  'image/x-icon',
  '.woff':  'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':   'font/ttf',
  '.otf':   'font/otf',
  '.txt':  'text/plain; charset=utf-8',
  '.md':   'text/markdown; charset=utf-8',
  '.pdf':  'application/pdf',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm'
};

function contentTypeFor(name, fallback) {
  const ext = name.slice(name.lastIndexOf('.')).toLowerCase();
  return CONTENT_TYPES[ext] || fallback || 'application/octet-stream';
}

/**
 * Pull the slug + relative path out of the URL. Netlify rewrites
 * /preview/<slug>/<rest> to /.netlify/functions/preview/<slug>/<rest>,
 * so event.path may include either prefix depending on how Netlify
 * routed the request.
 */
function parsePath(eventPath) {
  let p = eventPath || '/';
  // Strip the function prefix when invoked directly
  p = p.replace(/^\/\.netlify\/functions\/preview/, '');
  // Strip the public /preview prefix when invoked via redirect
  p = p.replace(/^\/preview/, '');
  if (!p.startsWith('/')) p = '/' + p;
  // Drop the leading slash and split slug/rest
  const parts = p.slice(1).split('/');
  const slug = parts.shift() || '';
  let rest = parts.join('/');
  if (!rest || rest.endsWith('/')) rest += 'index.html';
  return { slug, rest };
}

const SLUG_RE = /^[A-Za-z0-9][A-Za-z0-9_\-]*$/;

// Patterns that are NEVER allowed in a path segment, regardless of encoding.
// We test these against both the raw and (iteratively) decoded forms.
const TRAVERSAL_PATTERNS = [
  /\.\./,                 // literal ..
  /\\/,                   // backslash
  /\0/,                   // null byte
  /%2e%2e/i,              // encoded ..
  /%2f/i,                 // encoded forward slash inside a segment is suspect
  /%5c/i,                 // encoded backslash
  /%00/i                  // encoded null
];

/**
 * Decode a URL-encoded string up to N times, stopping when no further
 * decoding changes it. Returns null if decoding ever throws (malformed
 * percent escape) — the caller should treat that as a hard reject.
 */
function decodeIteratively(input, maxIterations = 3) {
  let cur = input;
  for (let i = 0; i < maxIterations; i++) {
    let next;
    try {
      next = decodeURIComponent(cur);
    } catch {
      return null;
    }
    if (next === cur) return cur;
    cur = next;
  }
  return cur;
}

/**
 * Returns true if the path contains any traversal/control character we
 * refuse to serve, in either raw or decoded form.
 */
function isUnsafePath(rest) {
  if (typeof rest !== 'string' || rest.length === 0) return true;

  // Check raw form — catches percent-encoded attacks before decoding.
  for (const pat of TRAVERSAL_PATTERNS) {
    if (pat.test(rest)) return true;
  }

  // Decode iteratively to defeat double-encoding (e.g., %252e%252e).
  const decoded = decodeIteratively(rest);
  if (decoded === null) return true;

  // Re-check decoded form — same patterns.
  for (const pat of TRAVERSAL_PATTERNS) {
    if (pat.test(decoded)) return true;
  }

  // Defense in depth: posix-normalize the decoded path and ensure it doesn't
  // climb out of its own root. path.posix.normalize collapses ../ if any
  // slipped through unicode/percent shenanigans.
  const normalized = path.posix.normalize(decoded);
  if (normalized.startsWith('..') || normalized.startsWith('/') || normalized.includes('../')) {
    return true;
  }

  return false;
}

exports.handler = withAuth(async (event) => {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD') {
    return errorResponse(405, 'Method not allowed');
  }

  const { slug, rest } = parsePath(event.path);
  if (!slug || !SLUG_RE.test(slug)) {
    return errorResponse(400, 'Invalid slug');
  }
  if (isUnsafePath(rest)) {
    return errorResponse(400, 'Invalid path');
  }

  const objectPath = `sites/${slug}/${rest}`;

  // Final sanity check: after normalization, the resolved object path must
  // still live under sites/{slug}/. If it doesn't, somebody got creative.
  const normalizedFull = path.posix.normalize(objectPath);
  if (!normalizedFull.startsWith(`sites/${slug}/`)) {
    return errorResponse(400, 'Invalid path');
  }

  const file = bucket().file(objectPath);

  let metadata;
  try {
    [metadata] = await file.getMetadata();
  } catch (err) {
    if (err && err.code === 404) {
      return errorResponse(404, 'Not found');
    }
    // eslint-disable-next-line no-console
    console.error('[preview] metadata error', err && err.code, err && err.message);
    throw err;
  }

  if (event.httpMethod === 'HEAD') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentTypeFor(rest, metadata.contentType),
        'Content-Length': String(metadata.size || 0),
        'Cache-Control': 'private, max-age=60',
        'X-Content-Type-Options': 'nosniff'
      },
      body: ''
    };
  }

  const buffer = await new Promise((resolve, reject) => {
    const chunks = [];
    file.createReadStream()
      .on('data', c => chunks.push(c))
      .on('end',  () => resolve(Buffer.concat(chunks)))
      .on('error', reject);
  });

  const ct = contentTypeFor(rest, metadata.contentType);
  const isText = ct.startsWith('text/') || ct.includes('javascript') || ct.includes('json') || ct.includes('xml') || ct.includes('svg');

  return {
    statusCode: 200,
    headers: {
      'Content-Type': ct,
      'Cache-Control': event.queryStringParameters && event.queryStringParameters.v
        ? 'private, max-age=300'
        : 'private, max-age=60',
      'X-Content-Type-Options': 'nosniff'
    },
    body: isText ? buffer.toString('utf8') : buffer.toString('base64'),
    isBase64Encoded: !isText
  };
}, {
  cors: { methods: ['GET', 'HEAD'], headers: ['Authorization'], credentials: true },
  rateLimit: 120,
  label: 'preview'
});
