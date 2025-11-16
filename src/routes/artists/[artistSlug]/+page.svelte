<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="container mx-auto px-4 py-8">
	<nav class="mb-6 text-sm">
		<a href="/artists" class="text-blue-600 hover:underline">Artists</a>
		<span class="mx-2">/</span>
		<span>{data.artist.artistName}</span>
	</nav>

	<h1 class="mb-8 text-4xl font-bold">{data.artist.artistName}</h1>

	<h2 class="mb-4 text-2xl font-semibold">Albums</h2>
	<ul class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each data.artist.albums as album}
			<li>
				<a
					href={album.albumPath}
					class="block rounded-lg border border-gray-300 p-4 transition-colors hover:border-gray-400 hover:bg-gray-50"
				>
					<h3 class="text-xl font-semibold">{album.albumName}</h3>
				</a>
			</li>
		{/each}
	</ul>
</div>
