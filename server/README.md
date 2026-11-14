# server/

Files that live on the DreamHost shared host but are **not** part of the
static build output. `scripts/deploy.sh` handles both deploy halves:

1. main rsync: `build/ → fauxfetus.net/` with `--exclude '/dl/'` (which also
   shields the remote sidecar + cache from `--delete`)
2. sidecar rsync: `server/dl/ → fauxfetus.net/dl/` excluding `cache/`
   (safe to run any time; never touches generated zips)

## dl/ — album-zip sidecar

A single-file PHP endpoint (no framework, no dependencies) that serves and
generates album zips on demand for the otherwise-static site. Uses the
`ZipArchive` extension (present on all DreamHost servers; PHP 8.2 verified
on this host 2026-11-14). Design + testing: **plans/audio-downloads.md**.

```text
GET /dl/?a={artistSlug}&b={albumSlug}
  → 302 /dl/cache/{artistSlug}--{albumSlug}--{hash8}.zip
```

Key invariants:

- The cache dir persists across full site deploys (`--exclude '/dl/'`).
- Cache file names embed a version hash over the album's audio files
  (size + mtime) and the catalog file (md5). New content ⇒ new URL, so no
  browser/proxy cache can serve a stale zip; superseded versions are
  pruned automatically when a new one is generated.
- No user input reaches the filesystem: GET params only select an album in
  `catalog.json`; every archived path comes from the catalog's `audioUrl`.
- Responses are `no-store`; error statuses are 400/404/500/503 text.

## One-time bootstrap (done 2026-11-14)

```sh
ssh meowsus@fauxfetus.net 'mkdir -p ~/fauxfetus.net/dl/cache && \
  echo "Options -Indexes" > ~/fauxfetus.net/dl/cache/.htaccess'
```

Only `dl/cache/` needs manual creation (`deploy.sh` excludes it); its
`.htaccess` is shipped from `server/dl/cache/.htaccess` manually because
rsync never syncs that subdirectory.

## Smoke tests

```sh
ssh meowsus@fauxfetus.net 'php -l fauxfetus.net/dl/index.php'
curl -sIL 'https://www.fauxfetus.net/dl/?a=<artist>&b=<album>'   # 302 → 200 application/zip
curl -sL --output /tmp/x.zip 'https://www.fauxfetus.net/dl/?a=<artist>&b=<album>'
unzip -t /tmp/x.zip
# re-request: X-Zip-Cache: hit and identical bytes; unknown album → 404
```
