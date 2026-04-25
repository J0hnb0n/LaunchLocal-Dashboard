# LaunchLocal — operator tools

Local tooling that runs on each operator's PC. Currently houses the
**site-upload pipeline**: a Claude Code Stop hook + Node script that
auto-uploads generated client sites to Firebase Storage so every operator
sees the same set of sites in the dashboard, regardless of which PC built
them.

---

## What it does

When a Claude Code session ends anywhere inside this repo:

1. `.claude/settings.json` fires `tools/site-upload-hook.sh`.
2. The hook spawns `tools/site-upload.js` in the background.
3. The Node script scans `Client-Sites/` for slug folders modified in the
   last 30 minutes.
4. For each recent slug, it:
   - Looks up the matching `sites/{siteId}` Firestore doc by `clientSlug`.
   - Uploads every file under `Client-Sites/{slug}/` to
     `sites/{slug}/...` in Firebase Storage.
   - Removes any orphaned files in Storage that no longer exist locally.
   - Updates the Firestore doc to `status=files-uploaded`,
     `qaStatus=pending`, and bumps `previewVersion` so the dashboard
     iframe busts its cache.
   - Appends a `site_files_uploaded` entry to `activityLog`.

The hook is non-blocking — Claude Code exits immediately and the upload
runs detached. Logs land in `~/.launchlocal/upload.log`.

---

## One-time per-PC setup

### 1. Install Node 18+

Download from <https://nodejs.org/> if not already installed.

### 2. Drop the Firebase service account JSON

Each operator needs a service account credential for `launchlocal-89789`.

1. Open the Firebase Console:
   <https://console.firebase.google.com/project/launchlocal-89789/settings/serviceaccounts/adminsdk>
2. Click **Generate new private key** and download the JSON.
3. Save it to:
   - **Windows:** `C:\Users\<you>\.launchlocal\service-account.json`
   - **macOS / Linux:** `~/.launchlocal/service-account.json`

The path is also overridable via `LAUNCHLOCAL_SERVICE_ACCOUNT` env var.

### 3. Run the setup script

**Windows:**

```bat
cd "Launch Local\tools"
setup-windows.bat
```

This installs `firebase-admin` into `tools/node_modules/` and verifies the
service-account JSON is in place.

**macOS / Linux:**

```bash
cd "Launch Local/tools"
npm install
```

(The `setup-windows.bat` equivalent on unix is just `npm install` plus the
manual JSON drop. No script needed.)

That's it — the Stop hook is wired up by `.claude/settings.json` (committed
to the repo), so it fires automatically the next time a Claude Code session
ends inside the repo.

---

## How operators run a site-gen

1. In the dashboard, click **Generate Prompt** on an approved prospect.
2. Copy the prompt.
3. Open a terminal in `Launch Local/Client-Sites/{slug}/` (the folder is
   created automatically; the prompt contains the exact path).
4. Run `claude` and paste the prompt.
5. When Claude finishes the session, the Stop hook auto-uploads the files
   and the dashboard flips the site to **Awaiting QA** within ~10 seconds.

If anything goes wrong, check `~/.launchlocal/upload.log`.

---

## Manual upload (debugging)

```bash
cd "Launch Local/tools"
node site-upload.js
```

The script is idempotent — running it on a slug folder that's already in
Storage just re-uploads any changed files and removes orphans.

---

## Security notes

- The service-account JSON grants **admin access** to Firestore + Storage
  for `launchlocal-89789`. Treat it like a production credential.
- Never commit it. The repo `.gitignore` excludes both `.launchlocal/` (in
  case anyone drops it next to the project) and `node_modules/`.
- If the JSON is ever exposed, revoke it immediately in Firebase Console
  and generate a new one.
