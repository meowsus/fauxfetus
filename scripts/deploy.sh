#!/usr/bin/env bash
set -euo pipefail

pnpm lint
pnpm build

rsync -avzh --delete build/ meowsus@fauxfetus.net:fauxfetus.net/