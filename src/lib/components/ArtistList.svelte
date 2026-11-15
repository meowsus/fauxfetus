<script lang="ts">
	import { resolve } from '$app/paths';

	let { artists }: { artists: Array<{ slug: string; name: string }> } = $props();

	let searchValue = $state('');

	let filteredArtists = $derived.by(() => {
		return artists.filter((artist) =>
			artist.name.toLowerCase().includes(searchValue.toLowerCase())
		);
	});
</script>

<section>
	<h2>Artists</h2>

	<label for="artist-filter">Filter artists</label>
	<input id="artist-filter" type="search" bind:value={searchValue} />

	<ul>
		{#each filteredArtists as artist (artist.slug)}
			<li><a href={resolve(`/artists/${artist.slug}`)}>{artist.name}</a></li>
		{/each}
	</ul>
</section>
