# @fauxfetus/generator

This package contains a `DataGenerator` class, whose `run()` method is called from the main project in `scripts/data/generate.mts` and via `pnpm data:generate`.

The purpose of this class is to create the massive dump of files found in `static/data/`.

## Rules

1. `/static/audio` must exist as a symlink to faux mp3 archive
1. Each track in each artist's album's directory _must_ have consistent data for each entry. Use [kid3](https://kid3.kde.org/) to create consistent APEv2 tags for all files.
1. Irregular albums, such as splits & comps, must be housed in underscore-prefixed directories, e.g. `_SPLITS`, and must follow this structure: `_SPLITS/album-slug/track-number_artist-slug_track-slug.mp3`
1. Required APEv2 tags: `Album`, `Artist`, `Title`
   1. `Compilation`, for splits & comps, must be any _globally unique_ string. Typically duplicating the `Album` string should suffice. This data is not visible in the app.
1. Recommend APEv2 tags: `Composer`
   1. `Track`, numbering, if applicable
