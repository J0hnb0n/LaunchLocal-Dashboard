#!/usr/bin/env bash
# LaunchLocal — laptop sync-push helper.
#
# Companion to tools/sync-all.sh. Walks the main Launch Local repo + every
# git repo under Client-Sites/ and pushes any uncommitted or unpushed work.
# Run at the end of a laptop session.
#
# Default commit message: "WIP: laptop sync YYYY-MM-DD-HHMM"
# Override with -m / --message.

set -u
set -o pipefail

default_msg="WIP: laptop sync $(date +%F-%H%M)"
msg="$default_msg"

while [ $# -gt 0 ]; do
  case "$1" in
    -m|--message)
      msg="$2"; shift 2 ;;
    -h|--help)
      cat <<EOF
Usage: $0 [-m "commit message"]

  -m, --message MSG   Commit message for any WIP commits (default: "$default_msg")

Walks main repo + every git repo under Client-Sites/ and pushes uncommitted
or unpushed work. Run at end of a laptop session.
EOF
      exit 0 ;;
    *)
      echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"

committed=0
pushed=0
clean=0
failed=0

push_one() {
  local label="$1" dir="$2"
  echo "=== $label ==="

  if [ ! -d "$dir/.git" ]; then
    echo "  → not a git repo, skipping"
    return
  fi

  if [ -n "$(git -C "$dir" status --porcelain)" ]; then
    git -C "$dir" add -A
    if git -C "$dir" commit -m "$msg"; then
      committed=$((committed+1))
    else
      echo "  → commit failed"
      failed=$((failed+1))
      return
    fi
  fi

  local local_sha upstream_sha
  local_sha="$(git -C "$dir" rev-parse HEAD 2>/dev/null || true)"
  upstream_sha="$(git -C "$dir" rev-parse '@{u}' 2>/dev/null || true)"

  if [ -z "$upstream_sha" ]; then
    echo "  → no upstream tracking, skipping push"
    return
  fi

  if [ "$local_sha" = "$upstream_sha" ]; then
    echo "  → already in sync"
    clean=$((clean+1))
    return
  fi

  if git -C "$dir" push; then
    pushed=$((pushed+1))
  else
    echo "  → push failed (resolve manually — likely behind origin)"
    failed=$((failed+1))
  fi
}

push_one "Launch Local (main repo)" "$repo_root"
echo

if [ -d "$repo_root/Client-Sites" ]; then
  for site in "$repo_root/Client-Sites"/*/; do
    [ -d "$site" ] || continue
    slug="$(basename "$site")"
    push_one "Client-Sites/$slug" "$site"
    echo
  done
fi

echo "=== Summary ==="
echo "  committed: $committed"
echo "  pushed:    $pushed"
echo "  clean:     $clean"
echo "  failed:    $failed"

[ "$failed" -gt 0 ] && exit 1
exit 0
