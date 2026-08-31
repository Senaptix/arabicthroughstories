#!/usr/bin/env bash
#
# THE production deploy. This file is a copy of /srv/qasas/deploy.sh on the
# VPS — keep the two identical. The version that lived here until 2026-08-31
# was the older in-place build, kept building long after the server had moved
# to releases: it pulled, built and restarted without ever touching the `live`
# symlink, so it reported a clean deploy and shipped nothing. Two commits sat
# built-but-unserved before anyone noticed. If you change the deploy, change
# it in both places.
#
# Previously this built in place: `next build` deletes and rewrites .next/
# while the running server is still reading from .next/standalone, so the live
# site threw MODULE_NOT_FOUND for the ~30 seconds a build takes. Tolerable
# when a human deployed and watched; not once deploys run unattended on a
# cron, and not on launch day.
#
# Now: build in the checkout, copy the finished output into a timestamped
# release, repoint the `live` symlink, restart. The old release keeps serving
# untouched until the instant of the swap, so downtime is the restart alone.

set -euo pipefail

if (( EUID != 0 )); then
  echo "Run this deploy script as root." >&2
  exit 1
fi

REPO=/srv/qasas/app
RELEASES=/srv/qasas/releases
LIVE=/srv/qasas/live
KEEP=5

# Build as the unprivileged service user, with the production env loaded so
# Next can inline NEXT_PUBLIC values at build time as well as read them later.
sudo -H -u qasas -- bash -c '
  set -euo pipefail
  set -a
  source /srv/qasas/qasas.env
  set +a

  cd /srv/qasas/app
  git pull --ff-only
  npm ci
  npm run build

  # output: "standalone" copies neither of these, and without them the site
  # loses its CSS, images and audio.
  mkdir -p .next/standalone/public .next/standalone/.next/static
  cp -r public/. .next/standalone/public/
  cp -r .next/static/. .next/standalone/.next/static/
'

# Only now does anything the live site depends on change.
SHA=$(sudo -H -u qasas git -C "$REPO" rev-parse --short HEAD)
TARGET="$RELEASES/$(date -u +%Y%m%d-%H%M%S)-$SHA"

mkdir -p "$RELEASES"
cp -a "$REPO/.next/standalone" "$TARGET"
cp -a "$REPO/qasas.env" "$TARGET/.env" 2>/dev/null || true
chown -R qasas:qasas "$TARGET"

# Atomic: ln -sfn onto a temp name then mv, so the symlink is never absent.
ln -sfn "$TARGET" "$LIVE.new"
mv -Tf "$LIVE.new" "$LIVE"

systemctl restart qasas
systemctl is-active --quiet qasas

# Prune old releases, keeping the current one whatever its age.
CURRENT=$(readlink -f "$LIVE")
find "$RELEASES" -mindepth 1 -maxdepth 1 -type d | sort -r | tail -n "+$((KEEP+1))" | while read -r old; do
  [[ "$(readlink -f "$old")" == "$CURRENT" ]] && continue
  rm -rf "$old"
done

echo "deployed $SHA -> $TARGET"
