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

rsync -avzh --delete build/ meowsus@fauxfetus.net:fauxfetus.net/
