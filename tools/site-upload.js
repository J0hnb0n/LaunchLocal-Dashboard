#!/usr/bin/env node
/**
 * LaunchLocal — site-upload pipeline
 *
 * Scans Client-Sites/ for slug folders modified within the last 30 minutes,
 * uploads their files to Firebase Storage at sites/{slug}/, and updates the
 * matching sites/{siteId} Firestore doc to status=files-uploaded so the
 * dashboard's QA queue picks it up. Idempotent — re-uploads are safe and
 * remove orphaned files in Storage that no longer exist locally.
 *
 * Triggered by site-upload-hook.sh on Claude Code session end. Can also be
 * run manually: `node site-upload.js` from this folder.
 *
 * Setup: see README.md.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CLIENT_SITES_DIR = path.join(PROJECT_ROOT, 'Client-Sites');
const SERVICE_ACCOUNT_PATH = process.env.LAUNCHLOCAL_SERVICE_ACCOUNT
  || path.join(os.homedir(), '.launchlocal', 'service-account.json');

// A slug folder is "recent" if any file inside has mtime within this window.
// Wide enough to catch sessions that took a while; narrow enough that long-
// idle folders are not re-uploaded on every Claude Code session.
const RECENT_WINDOW_MS = 30 * 60 * 1000;

// Folders/files that should never be uploaded.
const SKIP_DIRS  = new Set(['node_modules', '.git', '.firebase', '__pycache__', '.vscode']);
const SKIP_FILES = new Set(['.DS_Store', 'Thumbs.db', 'CLAUDE.md', 'setup.bat', 'firebase.json', '.firebaserc', '.gitignore']);

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm':  'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml':  'application/xml; charset=utf-8',
  '.txt':  'text/plain; charset=utf-8',
  '.md':   'text/markdown; charset=utf-8',
  '.csv':  'text/csv; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico':  'image/x-icon',
  '.bmp':  'image/bmp',
  '.woff':  'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':   'font/ttf',
  '.otf':   'font/otf',
  '.eot':   'application/vnd.ms-fontobject',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.mp3':  'audio/mpeg',
  '.wav':  'audio/wav',
  '.pdf':  'application/pdf'
};

function log(...args) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [launchlocal-upload]`, ...args);
}

function contentTypeFor(file) {
  return CONTENT_TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
}

function md5File(absPath) {
  const hash = crypto.createHash('md5');
  const data = fs.readFileSync(absPath);
  hash.update(data);
  return hash.digest('hex');
}

function loadServiceAccount() {
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    log(`No service account at ${SERVICE_ACCOUNT_PATH}.`);
    log('Skipping upload. See tools/README.md for setup steps.');
    process.exit(0);
  }
  try {
    return JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
  } catch (err) {
    log(`Service account file is not valid JSON: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Decide which slug folders to upload based on CLI args.
 *
 *   (no args)         → recent window only (default; what the Stop-hook uses)
 *   --all             → every slug folder in Client-Sites/
 *   <slug> [<slug>...] → just those slug folders
 *   --help            → print usage and exit
 */
function findSlugsToUpload({ all, slugs }) {
  if (!fs.existsSync(CLIENT_SITES_DIR)) {
    log(`Client-Sites/ does not exist at ${CLIENT_SITES_DIR}.`);
    return [];
  }

  const allEntries = fs.readdirSync(CLIENT_SITES_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory() && !SKIP_DIRS.has(e.name) && !e.name.startsWith('.'))
    .map(e => ({ slug: e.name, dir: path.join(CLIENT_SITES_DIR, e.name) }));

  if (slugs && slugs.length > 0) {
    const wanted = new Set(slugs);
    const matched = allEntries.filter(e => wanted.has(e.slug));
    const missing = [...wanted].filter(s => !allEntries.find(e => e.slug === s));
    missing.forEach(s => log(`No folder Client-Sites/${s} — skipping.`));
    return matched;
  }

  if (all) return allEntries;

  // Default: recent window
  const cutoff = Date.now() - RECENT_WINDOW_MS;
  return allEntries.filter(({ dir }) => latestMtime(dir) > cutoff);
}

function latestMtime(dir) {
  let latest = 0;
  function walk(d) {
    let entries;
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (SKIP_DIRS.has(e.name)) continue;
      const p = path.join(d, e.name);
      let st;
      try { st = fs.statSync(p); } catch { continue; }
      if (e.isDirectory()) walk(p);
      else if (st.mtimeMs > latest) latest = st.mtimeMs;
    }
  }
  walk(dir);
  return latest;
}

function listLocalFiles(dir) {
  const out = [];
  function walk(d) {
    let entries;
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name) && !e.name.startsWith('.')) walk(p);
      } else {
        if (SKIP_FILES.has(e.name)) continue;
        if (e.name.startsWith('.')) continue;
        out.push({
          abs: p,
          rel: path.relative(dir, p).split(path.sep).join('/')
        });
      }
    }
  }
  walk(dir);
  return out;
}

async function findSiteDoc(db, slug) {
  // Primary: clientSlug match
  const bySlug = await db.collection('sites')
    .where('clientSlug', '==', slug)
    .limit(1)
    .get();
  if (!bySlug.empty) return bySlug.docs[0];

  // Legacy fallback: prospectId match (older sites pre-slug)
  const byPid = await db.collection('sites')
    .where('prospectId', '==', slug)
    .limit(1)
    .get();
  if (!byPid.empty) return byPid.docs[0];

  return null;
}

async function uploadSlug({ admin, bucket, db }, { slug, dir }) {
  const siteDoc = await findSiteDoc(db, slug);
  if (!siteDoc) {
    log(`No matching sites doc for slug "${slug}". Generate a prompt in the dashboard first. Skipping.`);
    return { slug, status: 'skipped-no-site-doc' };
  }

  const localFiles = listLocalFiles(dir);
  if (localFiles.length === 0) {
    log(`No uploadable files in ${dir}. Skipping.`);
    return { slug, status: 'skipped-empty' };
  }

  const prefix = `sites/${slug}/`;
  log(`Uploading ${localFiles.length} files for "${slug}" → ${prefix}`);

  // Upload files (skip ones whose md5 already matches Storage to save bandwidth)
  for (const f of localFiles) {
    const dest = bucket.file(`${prefix}${f.rel}`);
    let remoteMd5 = null;
    try {
      const [meta] = await dest.getMetadata();
      remoteMd5 = meta.md5Hash
        ? Buffer.from(meta.md5Hash, 'base64').toString('hex')
        : null;
    } catch {
      remoteMd5 = null;
    }
    const localMd5 = md5File(f.abs);
    if (remoteMd5 === localMd5) continue;

    await bucket.upload(f.abs, {
      destination: dest.name,
      metadata: {
        contentType: contentTypeFor(f.rel),
        cacheControl: 'no-cache, max-age=0'
      }
    });
  }

  // Delete orphans — anything in Storage at sites/{slug}/ not in the local set
  const localSet = new Set(localFiles.map(f => `${prefix}${f.rel}`));
  const [remote] = await bucket.getFiles({ prefix });
  const orphans = remote.filter(r => !localSet.has(r.name));
  if (orphans.length > 0) {
    log(`Removing ${orphans.length} orphan(s) from ${prefix}`);
    await Promise.all(orphans.map(r => r.delete().catch(err => {
      log(`Failed to delete orphan ${r.name}: ${err.message}`);
    })));
  }

  await siteDoc.ref.update({
    status: 'files-uploaded',
    qaStatus: 'pending',
    filesUploadedAt: admin.firestore.FieldValue.serverTimestamp(),
    fileCount: localFiles.length,
    previewVersion: Date.now(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: 'auto-upload'
  });

  await db.collection('activityLog').add({
    action: 'site_files_uploaded',
    module: 'sites',
    entityId: siteDoc.id,
    userId: 'auto-upload',
    userName: 'Auto Upload',
    description: `Uploaded ${localFiles.length} files for ${siteDoc.data().businessName || slug}`,
    metadata: { slug, fileCount: localFiles.length },
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });

  log(`Done — ${slug} (${localFiles.length} files, ${orphans.length} orphans removed).`);
  return { slug, status: 'uploaded', fileCount: localFiles.length };
}

function printHelp() {
  console.log(`
Usage: node site-upload.js [options] [slug...]

  (no args)        Upload slug folders modified within the last 30 minutes.
                   This is what the Stop-hook calls.

  --all            Upload every slug folder in Client-Sites/.
                   Use once after first deploy to sync existing sites.

  slug [slug...]   Upload only the named slug folders (folder name under
                   Client-Sites/, e.g. "Lams-Restaurant").

  --help, -h       Print this message and exit.
`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }
  const all   = args.includes('--all');
  const slugs = args.filter(a => !a.startsWith('--'));

  const targets = findSlugsToUpload({ all, slugs });
  if (targets.length === 0) {
    log(all || slugs.length > 0
      ? 'No matching slug folders found.'
      : 'No recently-modified site folders. Nothing to do.');
    return;
  }
  log(`Found ${targets.length} slug(s): ${targets.map(s => s.slug).join(', ')}`);

  // Lazy-require so missing deps fail with a clear message instead of crashing
  // before the diagnostic log lines above.
  let admin;
  try {
    admin = require('firebase-admin');
  } catch (err) {
    log('firebase-admin is not installed. Run `npm install` from this folder.');
    log(err.message);
    process.exit(1);
  }

  const sa = loadServiceAccount();
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(sa),
      storageBucket: `${sa.project_id}.firebasestorage.app`
    });
  }

  const bucket = admin.storage().bucket();
  const db = admin.firestore();
  const ctx = { admin, bucket, db };

  for (const s of targets) {
    try {
      await uploadSlug(ctx, s);
    } catch (err) {
      log(`Failed to upload "${s.slug}": ${err.message}`);
      console.error(err);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('[launchlocal-upload] Fatal:', err);
    process.exit(1);
  });
