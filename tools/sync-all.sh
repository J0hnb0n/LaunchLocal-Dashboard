#!/usr/bin/env bash
# LaunchLocal — laptop sync-all helper.
#
# Pulls the main Launch Local repo. Client sites live inside the repo
# (Client-Sites/), so a single pull gets everything. Run at the start of
# a laptop session. Pair with tools/sync-push.sh at the end.

set -u
set -o pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"

echo "=== Launch Local ==="
if [ -d "$repo_root/.git" ]; then
  if git -C "$repo_root" pull --ff-only; then
    echo "  ✓ up to date"
  else
    echo "  → pull failed (resolve manually: cd '$repo_root' && git pull)"
    exit 1
  fi
else
  echo "  → not a git repo, nothing to pull"
  exit 1
fi
