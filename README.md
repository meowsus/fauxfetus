# fauxfetus

1. `/static/audio` must exist as a symlink to faux mp3 archive
1. During deployment, `/static/audio` must be replaced with a copy of the faux mp3 archive
1. The faux mp3 archive directory must follow this structure: `artist-slug/album-slug/track-slug.mp3`
1. Each track in each artist's album's directory _must_ have consistent data for each entry. Use [kid3](https://kid3.kde.org/) to create consistent APEv2 tags for all files.
