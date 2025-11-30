#!/usr/bin/env bash

pnpm lint
pnpm build

rsync -avzh --delete --exclude=".htaccess" build/ meowsus@fauxfetus.net:fauxfetus.net/