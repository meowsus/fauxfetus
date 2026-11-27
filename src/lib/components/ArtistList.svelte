<script lang="ts">
	import { resolve } from '$app/paths';
	import { SvelteMap } from 'svelte/reactivity';

	let {
		artists
	}: {
		artists: Array<{ slug: string; name: string; albumCount: number }>;
	} = $props();

	/** Letter bin = first character of the name, with "The" prefixes ignored —
	 *  'The Barco Project' files under B. The catalog array is already sorted on
	 *  this same stripped key (DataGenerator), so insertion order keeps each bin
	 *  alphabetical with 'The …' names in their stripped position. Non A–Z
	 *  (digits, symbols) bucket under '#'. */
	const letterFor = (name: string): string => {
		const key = name.replace(/^the\s+/i, '');
		const first = key.charAt(0).toUpperCase();
		return /[A-Z]/.test(first) ? first : '#';
	};

	const anchorFor = (letter: string): string =>
		letter === '#' ? 'artists-other' : `artists-${letter.toLowerCase()}`;

	const groups = $derived.by(() => {
		const map = new SvelteMap<string, Array<{ slug: string; name: string; albumCount: number }>>();
		for (const artist of artists) {
			const letter = letterFor(artist.name);
			const bucket = map.get(letter) ?? [];
			bucket.push(artist);
			map.set(letter, bucket);
		}
		// Artists arrive pre-sorted from the load (The-less alphabetical, symbols first);
		// insertion order keeps the bins alphabetical.
		return [...map.entries()];
	});
</script>

<ol class="letters">
	{#each groups as [letter, group] (letter)}
		<li class="letter">
			<h2 class="cap dim tnum" id={anchorFor(letter)}>{letter}</h2>
			<ul class="names">
				{#each group as artist (artist.slug)}
					<li>
						<a href={resolve(`artists/${artist.slug}`)}>{artist.name}</a>
						{#if artist.albumCount > 1}
							<span class="count dim tnum">{artist.albumCount}</span>
						{/if}
					</li>
				{/each}
			</ul>
		</li>
	{/each}
</ol>

<style>
	/* letters take the ledger waypoint color on the roster */
	ol.letters h2 {
		color: var(--violet);
		font-size: 0.8rem;
		letter-spacing: 0.14em;
	}

	/* name + trailing album count share one baseline */
	ul.names li {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
	}

	ul.names .count {
		font-size: 0.7rem;
		opacity: 0.72;
		white-space: nowrap;
	}
</style>
