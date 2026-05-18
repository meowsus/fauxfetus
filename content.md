## May 17, 2026

The audio player updates have definitely made some kind of positive impact, but I'm still not fully satisfied. I'm in the process of writing an external audio engine library which should help, but we're limping along at least.

While working on the audio engine a dear old friend reached out with something really interesting. Unbeknownst to me, my dear old brother Mike recorded an EP 20 years ago that I had never heard before. Maybe you haven't either?

Presenting the long lost [Voices in the Mist](/artists/the-night-owl/voices-in-the-mist/) EP by [The Night Owl](/artists/the-night-owl). Enjoy!

## May 16, 2026

So my last attempt at fixing the playback issues failed. It wasn't a spectacular failure. In fact you probably wouldn't have noticed any difference if I hadn't written this admission.

I've totally ripped out the homebrewed junk that was in place for an open source library called [Gapless 5](https://github.com/regosen/Gapless-5). So far it's working really well. I've been listening to the radio on my phone for about 15 minutes now without issue. I think we're good now, and I apologize for this incredibly long running bug. Yes, I am aware of how stupid it is for a website whose primary purpose is to play audio to have a bug that prevents it from successfully playing audio.

Speaking of the radio, I employed a weighting algorithm that will more fairly select artists from the catalog, rather than randomly selecting tracks. This approach gives each artist about a ~56% chance of being selected for play, based on the current number of artists that host their music here. This weighting helps avoid the problem of a wildly prolific artist dominating radio playback. In other words, you're going to hear far fewer BlastexOP134.XXnds songs (sorry?) and far more artists you may have forgotten about.

So, please fire up the radio and put it through its paces for me. Smash that contact button in the header or open an issue on GitHub if you experience any issues.

## May 11, 2026

I believe I've been able to fix the bugs with audio playback. If you've noticed that your mobile device just stops playing music after a song or two, when your screen eventually turns off, this problem _should_ be fixed.

Have I tested it? No. No, I haven't. Should you expect a follow-up post tonight or tomorrow featuring an apology from yours truly about how the site is unusable and everything sucked but is now fixed? Yes. Yes, you should.

## May 07, 2026

I've been playing around with the site's layout today. I ditched the "hamburger" menu in favor of icon links, since there isn't a ton to link to right now. I also moved the icon that controls the player drawer to the bottom right. Just some little spruce-em-ups I've had on the back burner.

## May 02, 2026

As a follow-up to the fixes that rolled out on April 26, I believe I've actually fixed the issue underlying the weird behavior that was being reported. I'm sure that nobody cares, but the problem was a misconfigured service worker (_classic_, amirite?) that eagerly loaded the entirety of the site's contents into the accessing device. How much content you ask? Oh, well, somewhere in the neighborhood of 8 gigabytes.

Yeah.

So while every MP3 file was being loaded onto your computer or smart phone en masse the website tended to behave a bit wonky when you were trying to use it.

Super sorry about this. If it's any consolation, my cell phone plan is usage based and my bill was $128 last month. This is my penance.

As an act of contrition, I'm uploading the entire [Ugh God](/artists/ugh-god) catalog:

- [Secret Demo](/artists/ugh-god/secret-demo)
- [Deep, Dark, Mysterious, and Serious](/artists/ugh-god/deep-dark-mysterious-and-serious)
- [The Happily Married Tammywhale Tape](/artists/ugh-god/the-happily-married-tammywhale-tape)
- [Dangerbird Split](/artists/ugh-god/dangerbird-split)
- [Ugh God Fucks Drexel](/artists/ugh-god/ugh-god-fucks-drexel)
- [Ugh God... Not The M Room](/artists/ugh-god/ugh-god-not-the-m-room)
- [Wood](/artists/ugh-god/wood)
- [A Pony On Top Of A Mountain](/artists/ugh-god/a-pony-on-top-of-a-mountain)
- [Heavy Flow](/artists/ugh-god/heavy-flow)
- [Rock & Real Bad: The Worst Of Ugh God](/artists/ugh-god/rock-and-real-bad-the-worst-of-ugh-god)

## Apr 26, 2026

Oh boy. I heard from quite a number of you that the site wasn't working. I could reproduce the symptoms y'all were describing, but it took me a minute to figure out what was going on. I was loading the

1. full data of all 49 radio tracks as soon as the page loaded
2. entire ~150MB catalog file for no reason on the Artists page
3. artist, album, and track page objects in full, unnecessarily

Both of these bugs caused the site to behave super erratically. These should be fixed now!

## Mar 15, 2026

After 18 years 4 months and 27 days I am beyond pleased to announce that the mysteriously illustrious "Mr. Pure" has joined these hairy, hallowed halls. This is a big day, at least for me. If you're unfamiliar with his work I would recommend starting with [Eschaton](/artists/the-wacky-ball-kickers/eschaton) by The Wacky Ball Kickers and traverse thenceforth at thy own risk. I will not apologize for what you are about to witness. Enjoy?

- [The Wacky Ball Kickers](/artists/the-wacky-ball-kickers)
- [Abe Lincoln & The Stincolns](/artists/abe-lincoln-and-the-stincolns)
- [Hemmorhoy Rogers](/artists/hemorrhoy-rogers)
- [Big Poo Generator](/artists/big-poo-generator)
- [The Gland Puppies](/artists/the-gland-puppies)
- [The Crapenters](/artists/the-crapenters)

## Feb 15, 2026

I'm digging around my old backup hard drives this morning and am finding some stuff:

- [Adipem Frumenti](/artists/adipem-frumenti/adipem-frumenti) was a collab between the members of [Father Sleep](/artists/father-sleep), [Welcome Wizard](/artists/welcome-wizard), and probably [The Night Owl](/artists/the-night-owl).
- [Apples and Banananananas](/artists/apples-and-cinnamon/apples-and-banananananas) (by [Apples and Cinnamon](/artists/apples-and-cinnamon)) was essentially [Adipem Frumenti](/artists/adipem-frumenti) without The Night Owl.
- [Satanic Harvest](/artists/satanic-harvest/satanic-harvest) was a late [Ugh God](/artists/ugh-god) side-project.
- [The Pentagram](/artists/drug-from-shit/the-pentagram) (by [Drug from Shit](/artists/drug-from-shit)) was effectively the first [Satanic Harvest](/artists/satanic-harvest) demo. I think.
- [Mega Mega](/artists/mega-mega) was [Lee, Jae Won](/artists/lee-jae-won) but with a sampled Greg Saunier on drums. Here's their incredible [demo](/artists/mega-mega/demo) and a few [live](/artists/mega-mega/live) tracks. I don't have expressed permission to post this, but I don't care. I've always wanted to.

Also, fun fact: You can now install this site as an app on your phone. You should be prompted to install it when you visit the site from now on.

I redid the header and replaced the homepage content to make it easier for me to futz with. Not all that exciting.

## Feb 14, 2026

I removed the theme stuff. No one likes light mode anyway.

I also added a dedicated audio player. It supports radio mode and an album playlist mode. It should be intuitive to use. Good luck, Benji, and you're welcome. You can find it by clicking the "Player" button in the header or by clicking the play button next to any track. Let's celebrate with some new releases:

- [A Three Ring Circus](/artists/a-three-ring-circus/a-three-ring-circus) by [A Three Ring Circus](/artists/a-three-ring-circus) - Did you know that they released a real, full album at some point? I sure didn't!
- [Nos Navizgark](/artists/plain-jain/nos-navizgark) by [Plain Jain](/artists/plain-jain) - I hear that Plain Jain was from Baltimore. It's a gone-noplace side-project from one of the [CAW!](/artists/caw) kids. It's been a while since any _actually new_ artists have been added. Welcome, bois.
- [MONKEYKNUCkLER](/artists/monkeyknuckler/monkeyknuckler) by [MONKEYKNUCkLER](/artists/monkeyknuckler) - For some strange reason they lost their presence on here. I had a CD-R laying around that just said "MONKEYKNUCkLER" on it. I'm pretty sure it's just a collection of every song that was released. I have no idea what the song titles should be.
- [Dearth](/artists/pink-panzer/dearth) by [Pink Panzer](/artists/pink-panzer) - Another Pink Panzer album I found on a CD-R. I'm calling it Dearth because I think it's supposed to just be self titled, but there's already a self titled Pink Panzer release.

Also, the track pages now display the track's metadata. These will probably be removed at some point because they're pretty pointless. Just something for the nerds to enjoy.

Lastly, the albums page now displays a badge for compilation albums to help with some confusion.

## Jan 24, 2026

No one will care, but I just released a much more flexible version of the data generator. Now splits and comps are much easier for me to manage. As a result [Faux Comp 1](/artists/5limbs/faux-comp-1/) exists, and along with it are some more "new" artists:

- [Casy + Brian](/artists/casy-brian)
- [Dead Rabbits](/artists/dead-rabbits)
- [The Grays](/artists/the-grays)

Additionally, album pages responsible for listing splits or true compilations will list each track's artist, interlinking these album pages appropriately.

## Dec 30, 2025

After [a recent article was published about Faux Faux Fest '24](https://www.brandkramp.us/2025/12/30/curts-big-fat-faux-fetus-40th/), the better [Ugh God](/artists/ugh-god) drummer reminded me of a long-forgotten live set that they and [The Beautiful Traps](/artists/the-beautiful-traps) performed back in 2008. I made a split release of it:

- [Ugh God & The Beautiful Traps - Live @ WPRB](/artists/the-beautiful-traps/live-wprb)

Also, let's all take a moment to finally welcome Ugh God into the fold. Better late than never!

## Dec 29, 2025

[Assisted Living](/artists/assisted-living/faux-faux-fest-24) also played Faux Faux Fest '24. I added their track.

## Dec 28, 2025

We suffered a slight regression where splits are split up by artist. This means that you can't currently listen to a split in its entirety from any page. As it turns out, showcasing more than one artist on a single album is a hard problem to solve. The way I solved it last week _technically_ worked, but the way I handled it was gross. I'll keep noodling on it.

But more good news, we have new releases! Specifically, "The Best Of The First Four Acts of Faux Fest" and "Faux Faux Fest '24". The first was recorded forever ago but was never released. The second was recorded on my 40th birthday.

- [The Best of the First Four Acts of Faux Fest](/artists/captain-werewolf/the-best-of-the-first-four-acts-of-faux-fest)
- [Faux Faux Fest '24](/artists/dust-from-1000-years/faux-faux-fest-24)

I also made sure that artists & albums were sorted alphabetically and added a little search bar for the artists page.

## Dec 21, 2025

Okay, this is actually exciting: I added six split releases that have been sitting around for far too long. This means that we welcome a few "new" "artists" into the fold, namely J. Mono & Miles Rozatti. Welcome. I'm sure you're SO happy to be here. We also welcome back Happybear Kaboom, which will likely be taken down soon, so listen while you can. Here's the list:

- [Bornpilot & Welcome Wizard - Split](/artists/bornpilot/bornpilot-welcome-wizard-split)
- [Captain Werewolf & Miles Rozatti Split](/artists/captain-werewolf/captain-werewolf-miles-rozatti-split)
- [Happybear Kaboom & Father Sleep Split](/artists/father-sleep/happybear-kaboom-father-sleep-split)
- [The Cold Lamper & J. Mono Split](/artists/the-cold-lamper/the-cold-lamper-j-mono-split)
- [The Night Owl & Welcome Wizard Split](/artists/the-night-owl/the-night-owl-welcome-wizard-split)
- [The Riffingtons & Eat Split](/artists/the-riffingtons/taco-enema)

## Dec 20, 2025

I added [Aunt Vivian's Revengence](/artists/aunt-vivians-revengence). This was the first recording ever made by the [Chamomile](/artists/chamomile) boys, back when they didn't know how to play their instruments and they spent all their time getting high and listening to Pink Floyd and Yes. The name is inspired by [Superbad.com](https://superbad.com/1/turkey/viv.html). It is an objectively terrible album, but one that hasn't been heard by very many people. Now it's here for no additional people to listen to. Oh, and I updated dark mode to be less suck. You're welcome.

## Dec 14, 2025

I added basic SEO. Pretty boring, tbh. It'll get good soon.

## Nov 30, 2025

I've relaunched the site. Don't ask me why.
