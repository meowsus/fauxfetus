<script lang="ts">
	import type { ArtistAlbum } from '@fauxfetus/generator';
	import { resolve } from '$app/paths';

	let { albums }: { albums: ArtistAlbum[] } = $props();
</script>

<ul class="list rounded-box bg-base-100 shadow-md">
	<li class="p-4 pb-2 text-xs tracking-wide opacity-60">Albums</li>

	{#each albums as album (album.albumPath)}
		<li class="list-row">
			<div>
				<a href={resolve(album.albumPath)} class="hover:link-primary/80 link text-lg link-primary"
					>{album.albumName}</a
				>
			</div>
		</li>
	{/each}
</ul>
