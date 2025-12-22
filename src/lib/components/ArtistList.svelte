<script lang="ts">
	import type { Artist } from '@fauxfetus/generator';
	import { resolve } from '$app/paths';

	let { artists }: { artists: Artist[] } = $props();

	let searchValue = $state('');

	let filteredArtists = $derived.by(() => {
		return artists.filter((artist) =>
			artist.artistName.toLowerCase().includes(searchValue.toLowerCase())
		);
	});
</script>

<ul class="list rounded-box bg-base-100 shadow-md">
	<div class="flex flex-col gap-2 md:flex-row md:items-center md:gap-2">
		<li class="p-4 pb-2 text-xs tracking-wide opacity-60 md:grow">Artists</li>

		<input
			type="text"
			placeholder="Filter artists..."
			class="input-bordered input w-full md:max-w-64"
			bind:value={searchValue}
		/>
	</div>

	{#each filteredArtists as artist (artist.artistPath)}
		<li class="list-row">
			<div>
				<a href={resolve(artist.artistPath)} class="hover:link-primary/80 link text-lg link-primary"
					>{artist.artistName}</a
				>
			</div>
		</li>
	{/each}
</ul>
