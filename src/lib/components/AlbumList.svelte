<script lang="ts">
	import type { Album } from '@fauxfetus/generator';
	import { resolve } from '$app/paths';

	let { albums }: { albums: Album[] } = $props();
</script>

<ul class="list rounded-box bg-base-100 shadow-md">
	<li class="p-4 pb-2 text-xs tracking-wide opacity-60">Albums</li>

	{#each albums as album (album.slug)}
		<li class="list-row">
			<div class="flex items-center gap-2">
				<a
					href={resolve(`/artists/${album.artistSlug}/${album.slug}`)}
					class="hover:link-primary/80 link text-lg link-primary">{album.name}</a
				>

				{#if album.isCompilation}
					<span class="badge badge-outline badge-sm badge-info">Compilation</span>
				{/if}
			</div>
		</li>
	{/each}
</ul>
