#!/usr/bin/env bash
# LaunchLocal — Stop hook bash wrapper.
#
# Fires when a Claude Code session ends inside the Launch Local repo. Spawns
# the Node uploader (site-upload.js) in the background, which scans
# Client-Sites/ for recently-modified slug folders and pushes them to Firebase
# Storage. Non-blocking: Claude Code exits immediately; the upload runs detached.
#
# Wired up by .claude/settings.json (project-level) so partners get this for
# free when they clone the repo. Per-PC setup (Node + service account) lives
# in tools/README.md.

set -u
cat > /dev/null  # drain stdin so Claude Code doesn't block on EPIPE

# Locate this script (and therefore the project root). Works regardless of
# where Claude Code was started — Client-Sites/<slug>/, Pipeline/, repo root.
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
project_root="$(cd "$script_dir/.." && pwd)"
node_script="$script_dir/site-upload.js"

# Defensive: bail silently if the uploader is missing
[ -f "$node_script" ] || exit 0

# Avoid re-entering from sub-sessions
[ "${LAUNCHLOCAL_UPLOAD_CHILD:-}" = "1" ] && exit 0
[ "${AI_PROJECTS_REFRESH_CHILD:-}" = "1" ] && exit 0

# De-dupe: skip if another upload fired within the last 30 sec. Multiple
# Stop hooks can fire in rapid succession when the operator ends several
# sessions; the upload itself is idempotent but spawning duplicate Node
# processes wastes CPU.
log_dir="${HOME:-$USERPROFILE}/.launchlocal"
mkdir -p "$log_dir" 2>/dev/null || true
marker="$log_dir/last-upload"
if [ -f "$marker" ]; then
  last=$(cat "$marker" 2>/dev/null || echo 0)
  now=$(date +%s)
  if [ "$((now - last))" -lt 30 ]; then
    exit 0
  fi
fi
date +%s > "$marker"

# Locate node — prefer PATH, fall back to common Windows install paths
node_bin="$(command -v node || true)"
if [ -z "$node_bin" ]; then
  for cand in \
    "/c/Program Files/nodejs/node.exe" \
    "/c/Program Files (x86)/nodejs/node.exe" \
    "$LOCALAPPDATA/Programs/nodejs/node.exe"; do
    if [ -x "$cand" ]; then node_bin="$cand"; break; fi
  done
fi

if [ -z "$node_bin" ]; then
  echo "[launchlocal-upload] Node not found on PATH or common install dirs. See tools/README.md." \
    >> "$log_dir/upload.log" 2>&1
  exit 0
fi

# Spawn detached so Claude Code exits immediately; upload runs in background.
LAUNCHLOCAL_UPLOAD_CHILD=1 nohup "$node_bin" "$node_script" \
  >> "$log_dir/upload.log" 2>&1 &

exit 0
