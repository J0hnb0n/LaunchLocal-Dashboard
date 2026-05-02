#!/usr/bin/env bash
# LaunchLocal — laptop sync-all helper.
#
# Pulls the main Launch Local repo and clones-or-pulls every per-client repo
# listed in SITES below. Run at the start of a laptop session. Pair with
# tools/sync-push.sh at the end.
#
# Add a new client by appending "{slug}:{owner}/{repo}" to SITES. Slug is the
# Client-Sites/ folder name; repo is the GitHub <owner>/<name>. Slug and repo
# can diverge (e.g. Little-Bones-Grill folder vs Little-Bones repo).

set -u
set -o pipefail

SITES=(
  "Taylor-Optical:J0hnb0n/Taylor-Optical"
  "Little-Bones-Grill:J0hnb0n/Little-Bones"
)

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"

cloned=0
pulled=0
skipped=0
failed=0

echo "=== Launch Local (main repo) ==="
if [ -d "$repo_root/.git" ]; then
  if git -C "$repo_root" pull --ff-only; then
    pulled=$((pulled+1))
  else
    echo "  → pull failed (resolve manually, then re-run)"
    failed=$((failed+1))
  fi
else
  echo "  → not a git repo, skipping"
  skipped=$((skipped+1))
fi
echo

mkdir -p "$repo_root/Client-Sites"

for entry in "${SITES[@]}"; do
  slug="${entry%%:*}"
  repo="${entry#*:}"
  target="$repo_root/Client-Sites/$slug"

  echo "=== $slug ($repo) ==="

  if [ ! -d "$target" ]; then
    if gh repo clone "$repo" "$target"; then
      cloned=$((cloned+1))
    else
      echo "  → clone failed"
      failed=$((failed+1))
    fi
  elif [ -d "$target/.git" ]; then
    if git -C "$target" pull --ff-only; then
      pulled=$((pulled+1))
    else
      echo "  → pull failed (resolve manually, then re-run)"
      failed=$((failed+1))
    fi
  else
    echo "  → exists but not a git repo, skipping"
    skipped=$((skipped+1))
  fi
  echo
done

echo "=== Summary ==="
echo "  cloned:  $cloned"
echo "  pulled:  $pulled"
echo "  skipped: $skipped"
echo "  failed:  $failed"

[ "$failed" -gt 0 ] && exit 1
exit 0
