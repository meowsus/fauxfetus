# Redesign mockups — four directions

Four deliberately opposed visual directions over **identical, real homepage
content**: the same nav, the same release groups (from the actual news
pipeline), the same catalog slice, the same player state. The content never
changes; everything you feel shift between files is the design.

## Viewing

- **Desktop**: `python3 -m http.server 8787` in this directory →
  <http://localhost:8787/>
- **Phone (same LAN)**: `http://<this-machine-ip>:8787/` — get the IP with
  `hostname -I`. Judge on a phone; that's the primary device for this site.
- The files are standalone (inline CSS, webfonts via CDN with system
  fallbacks), so `file://` works too.

## What's real vs. furniture

- **Real**: all artist/album/track names, release groups and their dates,
  counts (99 artists · 239 albums · 2,521 tracks), the tagline, footer links,
  the track/album in the player (`Eschaton In Rosendale` is track 2 of 4 on
  Death Row Unicorn Parade).
- **Furniture (mockup-only)**: track durations and progress (1:24/4:47), two
  of the three news excerpts, and the "albums shown" cut in the catalog strip.
  The six-artist catalog strip itself is a structural proposal — the current
  homepage has no catalog section; include or drop it when we implement.
- **4-mothwing v3 notes**: the homepage catalog section was **cut** (direction
  decision from the jury — /artists/ carries the archive); album track counts
  on the recent ledger are **real data** (read out of `catalog.json`); the
  header uses the real PWA icon (`logo.png`, copied from
  `static/icons/icon-192x192.png`, inverted + screen-blended for the dark
  page). Nav = Artists/Albums/News only, right-aligned at every width; at
  ≥64em the header keeps its original two-row geometry and the mark
  stretches to fill it; phone widths get full-bleed freeform text (measure
  caps apply ≥48em).
- **4-mothwing v3.5 notes** (all screenshot-verified at 390/800/1440; see
  `plans/redesign-principles.md` "Round-2 sanity audit"):
  1. **Banner right column right-aligned** at ≥64em (`text-align: right` on
     `.tagcol`) — blurb, counts, nav and search share one flush-right axis;
  2. **Desktop search demoted to a quiet underline field** (≥64em only: box,
     inset bg and radius stripped to one hairline bottom border, 24rem →
     19rem; focus = violet underline, no bg) so the menu leads; phone/tablet
     keep the boxed full-width field — right for touch;
  3. **Eyebrow is now a subtitle** — DOM order is h1 first; "an experimental
     music collective" hangs beneath the wordmark at every width;
  4. **Section note unbounded** — the "Everything to land in the catalog…"
     `.note` lost its 54ch/46ch caps; tagline + news excerpts keep
     reading measures;
  5. **One shared banner baseline** at ≥64em — `.tagcol` spans both hero
     rows and bottoms out on row 2, so the counts line sits on the same
     visual line as the subtitle.
     Implementation flags inherited from the audit (for the build, not the
     mockup): ≥16px body + search font (iOS zoom), 44px-class link padding,
     `viewport-fit=cover` + `env(safe-area-inset-bottom)` for the PWA.

## What to judge

1. **Voice** — does the type sound like the label (deadpan, experimental)?
2. **Color world** — black/paper/velvet; which one makes release names sing?
3. **Density** — spec-sheet tight vs. editorial air.
4. **Player chrome** — docked bottom bar, in-flow figure, or floating pill.
5. **Thumb trust** — at arm's length: can you read the release groups, are
   tap targets honest, does the player live where your thumb is?

All four are authored **mobile-first** (base styles = phone, `min-width`
breakpoints only) — resize hard and try to break them; that's part of the
evaluation.

## The four

| File                  | Direction          | One-liner                                            |
| --------------------- | ------------------ | ---------------------------------------------------- |
| `1-tape-archive.html` | Terminal/brutalist | Black + acid green, mono type, spec-sheet energy     |
| `2-sleeve-notes.html` | Liner notes        | Paper, serif, hairlines; reads like a record insert  |
| `3-cradle.html`       | Player-first shell | Phone-framed PWA: bottom tabs, docked mini-player    |
| `4-mothwing.html`     | Midnight spacious  | Near-black + violet, huge serif, luxurious restraint |

## The seven page stubs (Mothwing chrome)

Same locked header / footer / player / tokens as `4-mothwing` — new bodies
only, real data from `catalog.json` + `content/news/*`:

| File                    | Page           | What it settles                                                                              |
| ----------------------- | -------------- | -------------------------------------------------------------------------------------------- |
| `5-artists-index.html`  | `/artists/`    | 99-name alphabet: violet letter waypoints, 2-col name grid, counts                           |
| `6-album-detail.html`   | an album page  | kicker + serif masthead, numbered tracklist, `playing` row, `/dl/`                           |
| `7-news-index.html`     | `/news/`       | year groups, dates hang left at ≥64em, 46ch excerpt measure                                  |
| `8-albums-index.html`   | `/albums/`     | 239 albums alphabetical: letter waypoints, artist flows inline after each title              |
| `9-news-post.html`      | a news post    | kicker date, serif masthead, 62ch prose, the post's music groups in homepage ledger grammar  |
| `10-artist-detail.html` | an artist page | kicker counts (7 albums · 123 tracks), the discography as the homepage ledger minus dates    |
| `11-track-detail.html`  | a track page   | the one `now playing` row + the real audio sidecar: container, codec, bitrate, measured 2:42 |

All nine Mothwing pages are cross-linked and every catalog surface has a
stub — the full site IA browses end-to-end: home → artists → artist →
albums → album → track, plus home → news → post. Only the error page
(real `+error.svelte`) remains implementation-only.

`shot.html` now honors `?src=<page>` so viewport-crop screenshots work for
any page (full-canvas shots can hit the page URL directly).

Start from `index.html` for the gallery view with palette chips.
