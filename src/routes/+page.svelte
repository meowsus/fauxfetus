<script lang="ts">
	import { resolve } from '$app/paths';

	import Timeline from '$lib/components/Timeline.svelte';
	import TimelineEntry from '$lib/components/TimelineEntry.svelte';
</script>

<div class="flex flex-col gap-6 px-6 py-2">
	<section class="flex flex-col gap-4 text-lg">
		<Timeline>
			<TimelineEntry date="Dec 28, 2025">
				<p class="mb-2">
					We suffered a slight regression where splits are split up by artist. This means that you
					can't currently listen to a split in its entirety from any page. As it turns out,
					showcasing more than one artist on a single album is a hard problem to solve. The way I
					solved it last week *technically* worked, but the way I handled it was gross. I'll keep
					noodling on it.
				</p>
				<p class="mb-2">
					But more good news, we have new releases! Specifically, "The Best Of The First Four Acts
					of Faux Fest" and "Faux Faux Fest '24". The first was recorded forever ago but was never
					released. The second was recorded on my 40th birthday.
				</p>
				<ul class="mb-2 list-inside list-disc">
					<li>
						<em>The Best Of The First Four Acts of Faux Fest</em> features
						<a
							href={resolve(
								'/artists/captain-werewolf/the-best-of-the-first-four-acts-of-faux-fest'
							)}
							class="link-primary">Captain Werewolf</a
						>,
						<a
							href={resolve(
								'/artists/a-three-ring-circus/the-best-of-the-first-four-acts-of-faux-fest'
							)}
							class="link-primary">A Three Ring Circus (for Autistic Children)</a
						>,
						<a
							href={resolve('/artists/lee-jae-won/the-best-of-the-first-four-acts-of-faux-fest')}
							class="link-primary">Lee, J. Won</a
						>, and
						<a
							href={resolve(
								'/artists/happybear-kaboom/the-best-of-the-first-four-acts-of-faux-fest'
							)}
							class="link-primary">Happybear Kaboom</a
						>.
					</li>
					<li>
						<em>Faux Faux Fest '24</em> features
						<a
							href={resolve('/artists/dust-from-1000-years/faux-faux-fest-24')}
							class="link-primary">Dust From 1000 Years</a
						>,
						<a href={resolve('/artists/bad-history-month/faux-faux-fest-24')} class="link-primary"
							>Bad History Month</a
						>,
						<a href={resolve('/artists/luna-honey/faux-faux-fest-24')} class="link-primary"
							>Luna Honey</a
						>,
						<a href={resolve('/artists/idiot-mambo/faux-faux-fest-24')} class="link-primary"
							>Idiot Mambo</a
						>,
						<a
							href={resolve('/artists/drums-like-machine-guns/faux-faux-fest-24')}
							class="link-primary">Drums Like Machine Guns</a
						>, and
						<a href={resolve('/artists/nyxy-nix/faux-faux-fest-24')} class="link-primary"
							>Nyxy Nix</a
						>.
					</li>
				</ul>
				<p>
					I also made sure that artists & albums were sorted alphabetically and added a little
					search bar for the artists page.
				</p>
			</TimelineEntry>
			<TimelineEntry date="Dec 21, 2025">
				<p class="mb-2">
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
							class="link-primary">Bornpilot</a
						>
						/
						<a
							href={resolve('/artists/welcome-wizard/bornpilot-welcome-wizard-split')}
							class="link-primary">Welcome Wizard</a
						>
					</li>
					<li>
						<a
							href={resolve('/artists/captain-werewolf/captain-werewolf-miles-rozatti-split')}
							class="link-primary">Captain Werewolf</a
						>
						/
						<a
							href={resolve('/artists/miles-rozatti/captain-werewolf-miles-rozatti-split')}
							class="link-primary">Miles Rozatti</a
						>
					</li>
					<li>
						<a
							href={resolve('/artists/father-sleep/happybear-kaboom-father-sleep-split')}
							class="link-primary">Happybear Kaboom</a
						>
						/
						<a
							href={resolve('/artists/father-sleep/happybear-kaboom-father-sleep-split')}
							class="link-primary">Father Sleep</a
						>
					</li>
					<li>
						<a
							href={resolve('/artists/the-cold-lamper/the-cold-lamper-j-mono-split')}
							class="link-primary">The Cold Lamper</a
						>
						/
						<a href={resolve('/artists/j-mono/the-cold-lamper-j-mono-split')} class="link-primary"
							>J. Mono</a
						>
					</li>
					<li>
						<a
							href={resolve('/artists/the-night-owl/the-night-owl-welcome-wizard-split')}
							class="link-primary">The Night Owl</a
						>
						/
						<a
							href={resolve('/artists/welcome-wizard/the-night-owl-welcome-wizard-split')}
							class="link-primary">Welcome Wizard</a
						>
					</li>
					<li>
						<a
							href={resolve('/artists/the-riffingtons/the-riffingtons-eat-split')}
							class="link-primary">The Riffingtons</a
						>
						/
						<a href={resolve('/artists/eat/the-riffingtons-eat-split')} class="link-primary">Eat</a>
					</li>
				</ul>
			</TimelineEntry>
			<TimelineEntry date="Dec 20, 2025">
				I added <a href={resolve('/artists/aunt-vivians-revengence')} class="link-primary"
					>Aunt Vivian's Revengence</a
				>. This was the first recording ever made by the
				<a href={resolve('/artists/chamomile')} class="link-primary">Chamomile</a> boys, back when
				they didn't know how to play their instruments and they spent all their time getting high
				and listening to Pink Floyd and Yes. The name is inspired by
				<a href="https://superbad.com/1/turkey/viv.html">Superbad.com</a>. It is an objectively
				terrible album, but one that hasn't been heard by very many people. Now it's here for no
				additional people to listen to. Oh, and I updated dark mode to be less suck. You're welcome.
			</TimelineEntry>
			<TimelineEntry date="Dec 14, 2025">
				I added basic SEO. Pretty boring, tbh. It'll get good soon.
			</TimelineEntry>
			<TimelineEntry date="Nov 30, 2025">I've relaunched the site. Don't ask me why.</TimelineEntry>
		</Timeline>
	</section>
</div>
