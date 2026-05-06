# Laptop workflow

Quick reference for working on Launch Local from the laptop (or any non-primary
PC). The laptop holds a normal git checkout — **GitHub is the source of truth**;
sync via `git push`/`pull`, never via cloud-folder sync (OneDrive/Dropbox/iCloud
will corrupt `.git/`).

All client sites live inside this repo at `Client-Sites/{slug}/`. One pull gets
everything — no separate repos to manage.

---

## Start of session

```bash
cd "Launch Local"
tools/sync-all.sh
```

Pulls the repo (including all client sites). Run once at the start of every
laptop session before doing any work.

---

## End of session

```bash
tools/sync-push.sh
# or with a custom commit message:
tools/sync-push.sh -m "Little-Bones hero copy"
```

Stages + commits any uncommitted work as `WIP: laptop sync YYYY-MM-DD-HHMM`
(or your `-m` message), and pushes. Run before closing the laptop.

---

## If `sync-all.sh` shows a merge conflict

The script uses `git pull --ff-only`, which refuses to merge. If it fails:

```bash
cd "Launch Local"
git pull                    # produces conflict markers
# resolve in your editor
git add -A
git commit -m "Resolve merge"
git push
```

Then re-run `sync-all.sh` to confirm it's clean.

---

## Adding a new client site

Just create the folder under `Client-Sites/{ClientSlug}/` and commit. The slug
is auto-derived from `businessName` (Title-Case-Hyphen, apostrophes stripped).
No extra setup needed — the next `sync-push.sh` or commit will include it.

---

## Rules of thumb

- **GitHub is the source of truth.** Never cloud-sync `Launch Local/` — git
  is the only sync layer.
- Run `sync-all.sh` *every* session start, even if you "only made small
  changes" yesterday — your partner might have pushed something.
- Run `sync-push.sh` *every* session end, even if everything looks clean.
  The cost of a pointless run is zero; the cost of forgetting is a merge
  conflict tomorrow.
- The Firebase upload Stop hook (`tools/site-upload-hook.sh`) handles client
  site previews independently of these scripts — no manual upload step needed
  after a Claude Code session.
