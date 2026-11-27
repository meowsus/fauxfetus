<script lang="ts">
	import { resolve } from '$app/paths';

	interface Album {
		slug: string;
		name: string;
		artistSlug: string;
		isCompilation: boolean;
		trackCount: number;
	}

	let {
		albums
	}: {
		albums: Album[];
	} = $props();
</script>

<ul class="music">
	{#each albums as album (album.slug)}
		<li>
			<a href={resolve(`artists/${album.artistSlug}/${album.slug}`)}>{album.name}</a>
			{#if album.isCompilation}
				<small>Compilation</small>
			{/if}
			<span class="count">
				{album.trackCount}
				{album.trackCount === 1 ? 'track' : 'tracks'}
			</span>
		</li>
	{/each}
</ul>
