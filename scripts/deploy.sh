#!/usr/bin/env bash
set -euo pipefail

pnpm check
pnpm lint

# Regenerate the catalog from the audio on disk so prerendered routes
# always match the current files (static/audio + static/data are gitignored,
# so a stale catalog.json would otherwise deploy silently).
pnpm validate:data
pnpm generate:data

pnpm build

# '/dl/' exclusion shields the server-side sidecar + its generated zip
# cache from --delete (see plans/audio-downloads.md + server/README.md).
rsync -avzh --delete --exclude '/dl/' build/ meowsus@fauxfetus.net:fauxfetus.net/

# The dl/ sidecar (see server/README.md): idempotent, never touches the
# generated zip cache. dl/cache/ exists only on the server (one-time
# bootstrap; rsynced cache/.htaccess is handled there).
rsync -rv --chmod=D755,F644 --exclude 'cache/' server/dl/ meowsus@fauxfetus.net:fauxfetus.net/dl/
