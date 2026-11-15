---
title: The eight-gigabyte service worker incident
music:
  - artist: ugh-god
    albums:
      [
        secret-demo,
        deep-dark-mysterious-and-serious,
        the-happily-married-tammywhale-tape,
        dangerbird-split,
        ugh-god-fucks-drexel,
        ugh-god-not-the-m-room,
        wood,
        a-pony-on-top-of-a-mountain,
        heavy-flow,
        rock-and-real-bad-the-worst-of-ugh-god
      ]
---

Oh boy. I heard from quite a number of you that the site wasn't working. I could reproduce the symptoms y'all were describing, but it took me a minute to figure out what was going on. I was loading the

1. full data of all 49 radio tracks as soon as the page loaded
2. entire ~150MB catalog file for no reason on the Artists page
3. artist, album, and track page objects in full, unnecessarily

These bugs caused the site to behave super erratically. These should be fixed now!

As a follow-up to the fixes that rolled out that day, I believe I've actually fixed the issue underlying the weird behavior that was being reported. I'm sure that nobody cares, but the problem was a misconfigured service worker (_classic_, amirite?) that eagerly loaded the entirety of the site's contents into the accessing device. How much content you ask? Oh, well, somewhere in the neighborhood of 8 gigabytes.

Yeah.

So while every MP3 file was being loaded onto your computer or smart phone en masse the website tended to behave a bit wonky when you were trying to use it.

Super sorry about this. If it's any consolation, my cell phone plan is usage based and my bill was $128 last month. This is my penance.

As an act of contrition, I'm uploading the entire [Ugh God](/artists/ugh-god) catalog.
