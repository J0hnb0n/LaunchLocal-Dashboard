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
 */

const { bucket } = require('./_shared/admin');
const { withAuth } = require('./_shared/auth');

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

exports.handler = withAuth(async (event) => {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const { slug, rest } = parsePath(event.path);
  if (!slug || !SLUG_RE.test(slug)) {
    return jsonResponse(400, { error: 'Invalid slug' });
  }
  if (rest.includes('..')) {
    return jsonResponse(400, { error: 'Invalid path' });
  }

  const objectPath = `sites/${slug}/${rest}`;
  const file = bucket().file(objectPath);

  let metadata;
  try {
    [metadata] = await file.getMetadata();
  } catch (err) {
    if (err && err.code === 404) {
      return jsonResponse(404, { error: 'Not found', path: objectPath });
    }
    throw err;
  }

  if (event.httpMethod === 'HEAD') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentTypeFor(rest, metadata.contentType),
        'Content-Length': String(metadata.size || 0),
        'Cache-Control': 'private, max-age=60'
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
});

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body)
  };
}
