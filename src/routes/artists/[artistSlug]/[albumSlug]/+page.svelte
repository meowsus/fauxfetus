<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="container mx-auto px-4 py-8">
	<nav class="mb-6 text-sm">
		<a href="/artists" class="text-blue-600 hover:underline">Artists</a>
		<span class="mx-2">/</span>
		<a href={data.album.artistPath} class="text-blue-600 hover:underline">{data.album.artistName}</a>
		<span class="mx-2">/</span>
		<span>{data.album.albumName}</span>
	</nav>

	<h1 class="mb-2 text-4xl font-bold">{data.album.albumName}</h1>
	<p class="mb-8 text-xl text-gray-600">by {data.album.artistName}</p>

	<h2 class="mb-4 text-2xl font-semibold">Tracks</h2>
	<ul class="space-y-2">
		{#each data.album.tracks as track}
			<li>
				<a
					href={track.trackPath}
					class="flex items-center gap-4 rounded-lg border border-gray-300 p-4 transition-colors hover:border-gray-400 hover:bg-gray-50"
				>
					<span class="text-gray-500">{track.trackNumber ?? '—'}</span>
					<span class="flex-1 font-medium">{track.trackName}</span>
				</a>
			</li>
		{/each}
	</ul>
</div>

