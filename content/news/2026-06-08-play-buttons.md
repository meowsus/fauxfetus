---
title: Play buttons on track pages (and a build-time saga)
---

I threw a play button on the track pages. Now you can launch the player if you happened to land on one of the track pages. This caused the build time to generate the site to go from forty-five seconds up to eight and a half minutes. After a good amount of research into that I was able to cut the build time down to twenty seconds or so by segmenting out the data responsible for rendering the track metadata into its own file.
