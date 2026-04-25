/**
 * Shared Firebase Admin SDK init for all Netlify Functions.
 *
 * Reads a stringified service-account JSON from FIREBASE_SERVICE_ACCOUNT
 * (set in Netlify env vars). Memoized at module level so warm function
 * invocations reuse the same admin app rather than re-initializing.
 */

const admin = require('firebase-admin');

let app;

function getApp() {
  if (app) return app;
  if (admin.apps.length) {
    app = admin.app();
    return app;
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT env var is missing');
  }

  let sa;
  try {
    sa = JSON.parse(raw);
  } catch (err) {
    throw new Error(`FIREBASE_SERVICE_ACCOUNT is not valid JSON: ${err.message}`);
  }

  // Netlify can mangle private-key newlines when pasted. Restore them.
  if (sa.private_key && typeof sa.private_key === 'string') {
    sa.private_key = sa.private_key.replace(/\\n/g, '\n');
  }

  app = admin.initializeApp({
    credential: admin.credential.cert(sa),
    storageBucket: `${sa.project_id}.firebasestorage.app`
  });
  return app;
}

module.exports = {
  admin,
  getApp,
  auth: () => { getApp(); return admin.auth(); },
  db:   () => { getApp(); return admin.firestore(); },
  bucket: () => { getApp(); return admin.storage().bucket(); }
};
