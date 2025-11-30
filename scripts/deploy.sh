#!/usr/bin/env bash
set -euo pipefail

pnpm lint
pnpm build

rsync -avzh --delete --exclude=".htaccess" build/ meowsus@fauxfetus.net:fauxfetus.net/