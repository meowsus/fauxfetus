<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="container mx-auto px-4 py-8">
	<nav class="mb-6 text-sm">
		<a href="/artists" class="text-blue-600 hover:underline">Artists</a>
		<span class="mx-2">/</span>
		<a href={data.track.artistPath} class="text-blue-600 hover:underline">{data.track.artistName}</a>
		<span class="mx-2">/</span>
		<a href={data.track.albumPath} class="text-blue-600 hover:underline">{data.track.albumName}</a>
		<span class="mx-2">/</span>
		<span>{data.track.trackName}</span>
	</nav>

	<h1 class="mb-2 text-4xl font-bold">{data.track.trackName}</h1>
	<p class="mb-4 text-xl text-gray-600">
		by {data.track.artistName} • {data.track.albumName}
		{#if data.track.trackNumber !== null}
			<span class="text-gray-400"> • Track {data.track.trackNumber}</span>
		{/if}
	</p>

	<audio controls class="w-full">
		<source src={data.track.audioUrl} type="audio/mpeg" />
		Your browser does not support the audio element.
	</audio>
</div>

