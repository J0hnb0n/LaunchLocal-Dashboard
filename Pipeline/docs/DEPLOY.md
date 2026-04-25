# LaunchLocal — Production deploy + security checklist

One-time setup to take the dashboard from local-only to live on Netlify.
Work through it top-to-bottom; each step has a clear "done when" check.

---

## 0. Rotate the secrets that have been in chat / docs

Both have been visible in transcripts or master CLAUDE.md. Treat as
compromised; rotate before doing anything else.

- [ ] **Google API key** (used by Places + PageSpeed)
  - [Cloud Console — Credentials](https://console.cloud.google.com/apis/credentials)
  - Find the key ending `8hVA`, click **Regenerate Key**
  - Hold the new value locally — we'll paste it into Netlify env vars in step 4
- [ ] **Firebase CI token** (used by client-site GitHub Actions deploys)
  - In a terminal: `firebase login:ci` → complete OAuth → save the new token
  - Hold the new value — we'll paste it into GitHub Secrets in step 8
- [ ] Delete the old values from master `CLAUDE.md` and any local notes once
      the rotation is confirmed working

**Done when:** old key/token are revoked in Cloud Console; new ones held
locally but not yet pasted anywhere public.

---

## 1. Initialize Firebase Storage

Storage rules + bucket need to exist before the upload pipeline can run.

- [ ] Open [Firebase Console → Storage](https://console.firebase.google.com/project/launchlocal-89789/storage)
- [ ] Click **Get Started** → choose production mode → pick the default
      region (matches Firestore region)
- [ ] From `Pipeline/`, deploy the rules:
  ```bash
  cd "Launch Local/Pipeline"
  firebase deploy --only storage:rules,firestore:rules
  ```

**Done when:** the Storage tab shows the bucket and the Rules tab matches
`Pipeline/firebase/storage.rules` (admins/devs write, sales reads).

---

## 2. Generate a Firebase service account

Used by both the Stop-hook upload pipeline (per-PC) and the Netlify
Functions (server-side preview proxy).

- [ ] [Firebase Console → Project Settings → Service Accounts](https://console.firebase.google.com/project/launchlocal-89789/settings/serviceaccounts/adminsdk)
- [ ] Click **Generate new private key** → download the JSON
- [ ] Save **two copies** (same content, two destinations):
  1. **Local PC** for the Stop-hook → `C:\Users\<you>\.launchlocal\service-account.json`
  2. **Netlify env var** (paste the entire JSON as a single string in
     step 4, var name `FIREBASE_SERVICE_ACCOUNT`)
- [ ] On the partner's PC later: same JSON drops into their
      `~\.launchlocal\service-account.json`

**Done when:** the JSON is in both locations and `Launch
Local/tools/setup-windows.bat` reports "Service account: found".

---

## 3. Disable Firebase Auth self-signup

Internal tool — only admins should be able to add new users. The login
page has no signup form, but the underlying Firebase REST API still
permits `createUserWithEmailAndPassword` from any browser unless
explicitly disabled.

- [ ] [Firebase Console → Authentication → Settings → User actions](https://console.firebase.google.com/project/launchlocal-89789/authentication/providers)
- [ ] Tick **"Email enumeration protection"**
- [ ] Tick **"Disable account creation (sign-up)"**

> Why this matters: `dashboard.html` auto-grants `role: 'admin'` on first
> login (it auto-creates the `users/{uid}` doc). With sign-up enabled,
> anyone could create an account via the public REST API and become an
> admin.

**Done when:** an attempt to sign up via REST returns
`OPERATION_NOT_ALLOWED`.

---

## 4. Create the Netlify site + set env vars

- [ ] Create a new repo on GitHub at `J0hnb0n/LaunchLocal-Dashboard` (if
      not already), push the `Launch Local/` working copy as the initial
      commit. The `.gitignore` excludes secrets, `node_modules/`, and
      `Client-Sites/`.
- [ ] In Netlify, **Add new site → Import from GitHub** → pick the repo.
      Netlify will auto-detect `netlify.toml` and configure functions +
      publish dir.
- [ ] **Site configuration → Environment variables**:
  - `GOOGLE_API_KEY` — paste the rotated key from step 0
  - `FIREBASE_SERVICE_ACCOUNT` — paste the entire service-account JSON
    from step 2 (single string, including newlines as `\n`)
- [ ] Trigger a deploy. First build should pull the firebase-admin
      dependency for `netlify/functions/` automatically.
- [ ] Note the assigned `*.netlify.app` URL (e.g.
      `launchlocal-pipeline.netlify.app`) — used in steps 5 + 6.

**Done when:** the deploy succeeds and the dashboard URL loads the login
page.

---

## 5. Add the Netlify URL to Firebase Auth authorized domains

Without this, login on the live site fails with `auth/unauthorized-domain`.

- [ ] [Firebase Console → Authentication → Settings → Authorized domains](https://console.firebase.google.com/project/launchlocal-89789/authentication/settings)
- [ ] Click **Add domain** → enter the Netlify hostname (no protocol)

**Done when:** signing in on the live site produces no
`auth/unauthorized-domain` error.

---

## 6. Lock the Google API key to the Netlify domain

Defence in depth: even though the key now lives only in Netlify env vars,
restrict where it can be called from.

- [ ] [Cloud Console → Credentials → (the new key)](https://console.cloud.google.com/apis/credentials)
- [ ] **Application restrictions** → IP addresses → leave empty (Netlify
      Functions don't have a stable IP). Skip this restriction.
- [ ] **API restrictions** → "Restrict key" → tick only:
  - Places API (New)
  - PageSpeed Insights API
- [ ] Save.

> We can't usefully apply HTTP referrer restrictions because the key is
> now used server-side from Netlify Functions, not from a browser. The
> two-API restriction is what actually limits blast radius.

**Done when:** Cloud Console shows the key with both APIs listed and
nothing else.

---

## 7. Seed the first admin

The dashboard auto-creates an admin profile on first login (see
`dashboard.html:212-228`), but the Firebase Auth user has to exist first.

- [ ] [Firebase Console → Authentication → Users](https://console.firebase.google.com/project/launchlocal-89789/authentication/users) → **Add user**
- [ ] Set email + password
- [ ] Open the live dashboard, sign in with that user
- [ ] Confirm the sidebar shows your name + the **Admin** role badge

**Done when:** you see the dashboard with admin nav.

For the partner later: repeat **Add user** in Firebase Console with their
email. They sign in once, the dashboard auto-creates their `users/{uid}`
doc with `role: 'admin'`. To downgrade (e.g., to `sales`), edit the
`users/{uid}` doc directly in Firestore Console.

---

## 8. Update GitHub Secrets across client-site repos

The rotated Firebase CI token from step 0 has to be re-pasted into every
repo that uses GitHub Actions to deploy a client site to Firebase
Hosting.

For each repo, **Settings → Secrets and variables → Actions → `FIREBASE_TOKEN`** → update with the new value:

- [ ] [J0hnb0n/topiq](https://github.com/J0hnb0n/topiq/settings/secrets/actions)
- [ ] [J0hnb0n/taylor-optical](https://github.com/J0hnb0n/taylor-optical/settings/secrets/actions)
- [ ] [J0hnb0n/little-bones](https://github.com/J0hnb0n/little-bones/settings/secrets/actions)
- [ ] [J0hnb0n/woodley-genealogy](https://github.com/J0hnb0n/woodley-genealogy/settings/secrets/actions)
- [ ] [J0hnb0n/noko-pool-co](https://github.com/J0hnb0n/noko-pool-co/settings/secrets/actions) — even though archived

After each update, push a no-op commit (e.g. update the README) to
verify the deploy succeeds with the new token.

**Done when:** at least one client-site CI run is green with the new
token.

---

## 9. End-to-end smoke test

- [ ] Sign in to the live dashboard. Console shows no errors; the
      session-cookie POST to `/api/session` returns 200 in DevTools.
- [ ] Run a Places search (Scouting tab). It should hit
      `/api/places` and return results — no `X-Goog-Api-Key` header in
      the request from the browser.
- [ ] Generate a prompt for a test prospect, then run Claude Code from
      `Launch Local/` and paste the prompt. Wait for the session to end.
- [ ] Within ~10 seconds, the Sites tab card flips from "Prompt
      Generated" to "Awaiting QA" and the iframe loads the preview from
      `/preview/<slug>/index.html`.
- [ ] Open `~/.launchlocal/upload.log` and confirm the upload entry
      mentions the slug + file count.
- [ ] Sign out → confirm the `__llSession` cookie is cleared and the
      preview iframe (in another tab) returns 401 on next reload.

**Done when:** all six checks pass.

---

## Preview iframe — same-origin, no sandbox

The preview iframe loads from the same origin as the dashboard (`/preview/{slug}/...`) and runs without a `sandbox` attribute. Reason: a sandboxed iframe gets a unique opaque origin, which causes its subresource requests (CSS, JS, images) to be treated as cross-site — the `__llSession` cookie is dropped and every asset returns 401, leaving an unstyled bare-HTML render.

Trade-off: a buggy or malicious client site could reach into the dashboard via `parent.LaunchLocal.currentUser`, etc. Acceptable today because every preview is a site we generated and reviewed through QA. **Revisit this** when we add a "share preview link with client" feature — at that point move previews to a different subdomain (e.g. `preview.launchlocal-pipeline.netlify.app`) so origin isolation is real.

## Session lifetime — what to know

The server-side session cookie (`__llSession`) is good for **5 days from
the moment of actual sign-in** (Firebase tracks this as `auth_time`, and
the cookie inherits it — refreshing the page or re-fetching the ID token
does NOT slide the window). After 5 days the user has to sign in again,
even if they've been actively using the dashboard.

This is fine for an internal tool. If we ever want a sliding window, the
fix is a periodic re-login flow (force re-auth before the cookie expires)
— not anything in the cookie itself.

## Local development

Once secrets are rotated and Netlify is up, local dev is:

```bash
# from Launch Local/
netlify dev
```

That starts the static server + Functions emulator at http://localhost:8888.
Set the same two env vars locally via `netlify env:set` (one-time per
machine), or place them in `.env` (gitignored).

`python -m http.server` still works for dashboard-only development, but
`/api/*` and `/preview/*` are 404 on it — only `netlify dev` runs the
full stack.

---

## Security state — what's done, what's not

| Item                                                  | Status |
|-------------------------------------------------------|--------|
| Google API key off the client                         | ✅ proxied via /api/places, /api/pagespeed |
| Google API key restricted to Places + PageSpeed only  | ⚠️ step 6 |
| Firebase web config public (intentional, by design)   | ✅ no action |
| Firestore rules role-gated                            | ✅ already production-grade |
| Storage rules role-gated + default deny               | ✅ added in this deploy |
| Self-signup disabled                                  | ⚠️ step 3 |
| First-admin seed via console                          | ⚠️ step 7 |
| Server-side preview auth (httpOnly cookie)            | ✅ /preview/* requires __llSession |
| Firebase CI token rotation                            | ⚠️ steps 0 + 8 |
| Service-account JSON kept out of repo                 | ✅ gitignored, lives in `~/.launchlocal/` |

Anything still flagged ⚠️ is in this checklist above — do not call the
deploy "done" until they're all ✅.
