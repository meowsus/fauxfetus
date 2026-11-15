---
title: The playback saga, resolved
---

I believe I've been able to fix the bugs with audio playback. If you've noticed that your mobile device just stops playing music after a song or two, when your screen eventually turns off, this problem _should_ be fixed.

Have I tested it? No. No, I haven't. Should you expect a follow-up post tonight or tomorrow featuring an apology from yours truly about how the site is unusable and everything sucked but is now fixed? Yes. Yes, you should.

So my last attempt at fixing the playback issues failed. It wasn't a spectacular failure. In fact you probably wouldn't have noticed any difference if I hadn't written this admission.

I've totally ripped out the homebrewed junk that was in place for an open source library called [Gapless 5](https://github.com/regosen/Gapless-5). So far it's working really well. I've been listening to the radio on my phone for about 15 minutes now without issue. I think we're good now, and I apologize for this incredibly long running bug. Yes, I am aware of how stupid it is for a website whose primary purpose is to play audio to have a bug that prevents it from successfully playing audio.

Speaking of the radio, I employed a weighting algorithm that will more fairly select artists from the catalog, rather than randomly selecting tracks. This approach gives each artist about a ~56% chance of being selected for play, based on the current number of artists that host their music here. This weighting helps avoid the problem of a wildly prolific artist dominating radio playback. In other words, you're going to hear far fewer BlastexOP134.XXnds songs (sorry?) and far more artists you may have forgotten about.

So, please fire up the radio and put it through its paces for me. Smash that contact button in the header or open an issue on GitHub if you experience any issues.
