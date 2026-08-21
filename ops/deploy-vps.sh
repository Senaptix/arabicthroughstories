#!/usr/bin/env bash
set -euo pipefail

if (( EUID != 0 )); then
  echo "Run this deploy script as root." >&2
  exit 1
fi

# Git, npm and the build all run as the unprivileged service user. The
# production env is loaded inside that same process so Next can embed its
# NEXT_PUBLIC values during the build as well as read them at runtime.
sudo -H -u qasas -- bash -c '
  set -euo pipefail
  set -a
  source /srv/qasas/qasas.env
  set +a

  cd /srv/qasas/app
  git pull --ff-only
  npm ci
  npm run build

  # output: "standalone" does not copy either directory. Both are required:
  # without them the live site loses its CSS, images and audio.
  mkdir -p .next/standalone/public .next/standalone/.next/static
  cp -r public/. .next/standalone/public/
  cp -r .next/static/. .next/standalone/.next/static/
'

systemctl restart qasas
systemctl is-active --quiet qasas
