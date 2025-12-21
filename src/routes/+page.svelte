<script lang="ts">
	import { resolve } from '$app/paths';

	import Timeline from '$lib/components/Timeline.svelte';
	import TimelineEntry from '$lib/components/TimelineEntry.svelte';
</script>

<div class="flex flex-col gap-6 px-6 py-2">
	<section class="flex flex-col gap-4 text-lg">
		<Timeline>
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
						<a href={resolve('/artists/bornpilot/bornpilot-welcome-wizard')} class="link-primary"
							>Bornpilot / Welcome Wizard</a
						>
					</li>
					<li>
						<a
							href={resolve('/artists/captain-werewolf/captain-werewolf-miles-rozatti')}
							class="link-primary">Captain Werewolf / Miles Rozatti</a
						>
					</li>
					<li>
						<a
							href={resolve('/artists/father-sleep/happybear-kaboom-father-sleep')}
							class="link-primary">Happybear Kaboom / Father Sleep</a
						>
					</li>
					<li>
						<a
							href={resolve('/artists/the-cold-lamper/the-cold-lamper-j-mono')}
							class="link-primary">The Cold Lamper / J. Mono</a
						>
					</li>
					<li>
						<a
							href={resolve('/artists/the-night-owl/the-night-owl-welcome-wizard')}
							class="link-primary">The Night Owl / Welcome Wizard</a
						>
					</li>
					<li>
						<a
							href={resolve('/artists/the-riffingtons/the-riffingtons-eat-taco-enema')}
							class="link-primary">The Riffingtons / EAT</a
						>
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
