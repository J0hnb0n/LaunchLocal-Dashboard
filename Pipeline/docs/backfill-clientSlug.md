# One-Shot Firestore Backfill — `clientSlug`

Run this **once** after the Client-Sites reorganization (April 2026) to add the new `clientSlug` field to the two pre-existing site/prospect documents that still reference Firestore hash IDs.

After this runs, the dashboard's probe logic will locate their renamed folders (`Couwenberg-Concrete-Inc/`, `Lams-Restaurant/`) by slug instead of hash.

## How to run

1. Open the dashboard in Chrome at your local dev URL (Netlify or `localhost:...`)
2. Log in as an **admin** user (the script needs write access to both `sites` and `prospects`)
3. Open DevTools → Console (`F12`)
4. Paste the snippet below and hit Enter
5. Watch for the `✅ Backfill complete` log line

The snippet is idempotent — safe to re-run; it skips docs that already have a `clientSlug`.

## Snippet

```js
(async () => {
    const backfill = [
        { hash: '5mtF2h5HlKtiyDd7xAES', slug: 'Couwenberg-Concrete-Inc', name: 'Couwenberg Concrete Inc' },
        { hash: 'nKmQHGpJoF9FlN2Tl0ta', slug: 'Lams-Restaurant',          name: "Lam's Restaurant" }
    ];

    const db = firebase.firestore();
    let touched = 0, skipped = 0;

    for (const { hash, slug, name } of backfill) {
        // 1) Update the prospect doc (if it still exists)
        try {
            const pRef = db.collection('prospects').doc(hash);
            const pSnap = await pRef.get();
            if (pSnap.exists) {
                if (pSnap.data().clientSlug) {
                    console.log(`⏭  prospects/${hash} already has clientSlug — skipping`);
                    skipped++;
                } else {
                    await pRef.update({ clientSlug: slug });
                    console.log(`✅ prospects/${hash} → clientSlug: ${slug}`);
                    touched++;
                }
            } else {
                console.warn(`⚠  prospects/${hash} not found — skipping prospect update for ${name}`);
            }
        } catch (err) {
            console.error(`❌ prospects/${hash} update failed:`, err);
        }

        // 2) Update every site doc with matching prospectId (usually 1)
        try {
            const sitesSnap = await db.collection('sites').where('prospectId', '==', hash).get();
            if (sitesSnap.empty) {
                console.warn(`⚠  no sites docs with prospectId=${hash} for ${name}`);
                continue;
            }
            for (const siteDoc of sitesSnap.docs) {
                if (siteDoc.data().clientSlug) {
                    console.log(`⏭  sites/${siteDoc.id} already has clientSlug — skipping`);
                    skipped++;
                    continue;
                }
                const existingFormData = siteDoc.data().formData || {};
                await siteDoc.ref.update({
                    clientSlug: slug,
                    'formData.clientSlug': slug   // keep formData in sync so regen reads it
                });
                console.log(`✅ sites/${siteDoc.id} → clientSlug: ${slug}`);
                touched++;
            }
        } catch (err) {
            console.error(`❌ sites lookup/update for ${hash} failed:`, err);
        }
    }

    console.log(`\n✅ Backfill complete — touched ${touched}, skipped ${skipped}`);
})();
```

## What it does

- For each hash → slug mapping:
  1. Adds `clientSlug` to `prospects/{hash}` (if the doc exists and doesn't already have one)
  2. Finds every `sites` doc with matching `prospectId` and adds `clientSlug` both at the top level and inside `formData` (so regen picks it up)
- Logs each write + a final summary
- Idempotent: skips anything already backfilled

## After running

Hard-refresh the dashboard, go to the Sites module, and confirm both Couwenberg Concrete and Lam's Restaurant flip to green / "files uploaded" status — that means the probe found their renamed folders.

## Cleanup

Once verified, this doc can stay as reference or be deleted. The snippet only needs to run once.
