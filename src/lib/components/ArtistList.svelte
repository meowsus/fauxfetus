<script lang="ts">
	import type { Artist } from '@fauxfetus/generator';
	import { resolve } from '$app/paths';

	let { artists }: { artists: Artist[] } = $props();
</script>

<ul class="list rounded-box bg-base-100 shadow-md">
	<li class="p-4 pb-2 text-xs tracking-wide opacity-60">Artists</li>

	{#each artists as artist (artist.artistPath)}
		<li class="list-row">
			<div>
				<a href={resolve(artist.artistPath)} class="hover:link-primary/80 link text-lg link-primary"
					>{artist.artistName}</a
				>
			</div>
		</li>
	{/each}
</ul>
