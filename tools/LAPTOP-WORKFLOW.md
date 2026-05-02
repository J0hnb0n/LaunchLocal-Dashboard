# Laptop workflow

Quick reference for working on Launch Local from the laptop (or any non-primary
PC). The laptop holds a normal git checkout — **GitHub is the source of truth**;
sync via `git push`/`pull`, never via cloud-folder sync (OneDrive/Dropbox/iCloud
will corrupt `.git/`).

---

## Start of session

```bash
cd "Launch Local"
tools/sync-all.sh
```

Pulls the main repo and clones-or-pulls every client repo listed in
`tools/sync-all.sh` into `Client-Sites/{slug}/`. Run once at the start of every
laptop session before doing any work.

---

## End of session

```bash
tools/sync-push.sh
# or with a custom commit message:
tools/sync-push.sh -m "Taylor-Optical hero copy"
```

Walks the main repo + every git repo under `Client-Sites/`, stages + commits
any uncommitted work as `WIP: laptop sync YYYY-MM-DD-HHMM` (or your `-m`
message), and pushes. Run before closing the laptop.

---

## If `sync-all.sh` shows a merge conflict

The script uses `git pull --ff-only`, which refuses to merge. If it fails on
a repo:

```bash
cd "Launch Local"           # or cd Client-Sites/<slug> for a client repo
git pull                    # produces conflict markers
# resolve in your editor
git add -A
git commit -m "Resolve merge"
git push
```

Then re-run `sync-all.sh` to confirm the rest synced.

---

## Adding a new client site

Edit `tools/sync-all.sh` and append to the `SITES` array:

```bash
SITES=(
  "Taylor-Optical:J0hnb0n/Taylor-Optical"
  "Little-Bones-Grill:J0hnb0n/Little-Bones"
  "New-Client-Slug:owner/repo"          # ← here
)
```

Slug is the `Client-Sites/{slug}/` folder name; repo is the GitHub `<owner>/<name>`.
Slug and repo can diverge.

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
