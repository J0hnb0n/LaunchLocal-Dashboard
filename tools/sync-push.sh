#!/usr/bin/env bash
# LaunchLocal — laptop sync-push helper.
#
# Companion to tools/sync-all.sh. Stages + commits any uncommitted work in the
# Launch Local repo (including Client-Sites/) and pushes. Run at the end of a
# laptop session.
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

  -m, --message MSG   Commit message (default: "$default_msg")

Stages + commits any uncommitted work and pushes. Run at end of a laptop session.
EOF
      exit 0 ;;
    *)
      echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"

echo "=== Launch Local ==="

if [ ! -d "$repo_root/.git" ]; then
  echo "  → not a git repo, nothing to push"
  exit 1
fi

if [ -n "$(git -C "$repo_root" status --porcelain)" ]; then
  git -C "$repo_root" add -A
  if git -C "$repo_root" commit -m "$msg"; then
    echo "  ✓ committed"
  else
    echo "  → commit failed"
    exit 1
  fi
else
  echo "  → working tree clean"
fi

local_sha="$(git -C "$repo_root" rev-parse HEAD 2>/dev/null || true)"
upstream_sha="$(git -C "$repo_root" rev-parse '@{u}' 2>/dev/null || true)"

if [ -z "$upstream_sha" ]; then
  echo "  → no upstream tracking, skipping push"
  exit 0
fi

if [ "$local_sha" = "$upstream_sha" ]; then
  echo "  → already in sync with remote"
  exit 0
fi

if git -C "$repo_root" push; then
  echo "  ✓ pushed"
else
  echo "  → push failed (resolve manually — likely behind origin)"
  exit 1
fi
