<script lang="ts">
	import { resolve } from '$app/paths';

	import Timeline from '$lib/components/Timeline.svelte';
	import TimelineEntry from '$lib/components/TimelineEntry.svelte';
</script>

<div class="flex flex-col gap-6 px-6 py-2">
	<section class="flex flex-col gap-4 text-lg">
		<Timeline>
			<TimelineEntry date="Feb 1, 2026">
				<p>I removed the theme stuff. No one likes light mode anyway.</p>
			</TimelineEntry>
			<TimelineEntry date="Jan 24, 2026">
				<p>
					No one will care, but I just released a much more flexible version of the data generator.
					Now splits and comps are much easier for me to manage. As a result <a
						href={resolve('/artists/5limbs/faux-comp-1/')}
						class="link-primary">Faux Comp 1</a
					> exists, and along with it are some more "new" artists:
				</p>

				<ul class="list-inside list-disc">
					<li>
						<a href={resolve('/artists/casy-brian')} class="link-primary">Casy + Brian</a>
					</li>
					<li><a href={resolve('/artists/dead-rabbits')} class="link-primary">Dead Rabbits</a></li>
					<li><a href={resolve('/artists/the-grays')} class="link-primary">The Grays</a></li>
				</ul>

				<p>
					Additionally, album pages responsible for listing splits or true compilations will list
					each track's artist, interlinking these album pages appropriately.
				</p>
			</TimelineEntry>
			<TimelineEntry date="Dec 30, 2025">
				<p>
					After <a
						href="https://www.brandkramp.us/2025/12/30/curts-big-fat-faux-fetus-40th/"
						class="link-primary"
						target="_blank">a recent article was published about Faux Faux Fest '24</a
					>, the better <a href={resolve('/artists/ugh-god')} class="link-primary">Ugh God</a>
					drummer reminded me of a long-forgotten live set that they and
					<a href={resolve('/artists/the-beautiful-traps')} class="link-primary"
						>The Beautiful Traps</a
					> performed back in 2008. I made a split release of it:
				</p>

				<ul class="list-inside list-disc">
					<li>
						<a href={resolve('/artists/the-beautiful-traps/live-wprb')} class="link-primary"
							>Ugh God & The Beautiful Traps - Live @ WPRB</a
						>
					</li>
				</ul>

				<p>
					Also, let's all take a moment to finally welcome Ugh God into the fold. Better late than
					never!
				</p>
			</TimelineEntry>
			<TimelineEntry date="Dec 29, 2025">
				<p>
					<a href={resolve('/artists/assisted-living/faux-faux-fest-24')} class="link-primary"
						>Assisted Living</a
					> also played Faux Faux Fest '24. I added their track.
				</p>
			</TimelineEntry>
			<TimelineEntry date="Dec 28, 2025">
				<p>
					We suffered a slight regression where splits are split up by artist. This means that you
					can't currently listen to a split in its entirety from any page. As it turns out,
					showcasing more than one artist on a single album is a hard problem to solve. The way I
					solved it last week *technically* worked, but the way I handled it was gross. I'll keep
					noodling on it.
				</p>
				<p>
					But more good news, we have new releases! Specifically, "The Best Of The First Four Acts
					of Faux Fest" and "Faux Faux Fest '24". The first was recorded forever ago but was never
					released. The second was recorded on my 40th birthday.
				</p>
				<ul class="list-inside list-disc">
					<li>
						<a
							href={resolve(
								'/artists/captain-werewolf/the-best-of-the-first-four-acts-of-faux-fest'
							)}
							class="link-primary">The Best of the First Four Acts of Faux Fest</a
						>
					</li>
					<li>
						<a
							href={resolve('/artists/dust-from-1000-years/faux-faux-fest-24')}
							class="link-primary">Faux Faux Fest '24</a
						>
					</li>
				</ul>
				<p>
					I also made sure that artists & albums were sorted alphabetically and added a little
					search bar for the artists page.
				</p>
			</TimelineEntry>
			<TimelineEntry date="Dec 21, 2025">
				<p>
					Okay, this is actually exciting: I added six split releases that have been sitting around
					for far too long. This means that we welcome a few "new" "artists" into the fold, namely
					J. Mono & Miles Rozatti. Welcome. I'm sure you're SO happy to be here. We also welcome
					back Happybear Kaboom, which will likely be taken down soon, so listen while you can.
					Here's the list:
				</p>

				<ul class="list-inside list-disc">
					<li>
						<a
							href={resolve('/artists/bornpilot/bornpilot-welcome-wizard-split')}
							class="link-primary">Bornpilot & Welcome Wizard - Split</a
						>
					</li>
					<li>
						<a
							href={resolve('/artists/captain-werewolf/captain-werewolf-miles-rozatti-split')}
							class="link-primary">Captain Werewolf & Miles Rozatti Split</a
						>
					</li>
					<li>
						<a
							href={resolve('/artists/father-sleep/happybear-kaboom-father-sleep-split')}
							class="link-primary">Happybear Kaboom & Father Sleep Split</a
						>
					</li>
					<li>
						<a
							href={resolve('/artists/the-cold-lamper/the-cold-lamper-j-mono-split')}
							class="link-primary">The Cold Lamper & J. Mono Split</a
						>
					</li>
					<li>
						<a
							href={resolve('/artists/the-night-owl/the-night-owl-welcome-wizard-split')}
							class="link-primary">The Night Owl & Welcome Wizard Split</a
						>
					</li>
					<li>
						<a href={resolve('/artists/the-riffingtons/taco-enema')} class="link-primary"
							>The Riffingtons & Eat Split</a
						>
					</li>
				</ul>
			</TimelineEntry>
			<TimelineEntry date="Dec 20, 2025">
				<p>
					I added <a href={resolve('/artists/aunt-vivians-revengence')} class="link-primary"
						>Aunt Vivian's Revengence</a
					>. This was the first recording ever made by the
					<a href={resolve('/artists/chamomile')} class="link-primary">Chamomile</a> boys, back when
					they didn't know how to play their instruments and they spent all their time getting high
					and listening to Pink Floyd and Yes. The name is inspired by
					<a href="https://superbad.com/1/turkey/viv.html">Superbad.com</a>. It is an objectively
					terrible album, but one that hasn't been heard by very many people. Now it's here for no
					additional people to listen to. Oh, and I updated dark mode to be less suck. You're
					welcome.
				</p>
			</TimelineEntry>
			<TimelineEntry date="Dec 14, 2025">
				<p>I added basic SEO. Pretty boring, tbh. It'll get good soon.</p>
			</TimelineEntry>
			<TimelineEntry date="Nov 30, 2025"
				><p>I've relaunched the site. Don't ask me why.</p></TimelineEntry
			>
		</Timeline>
	</section>
</div>
