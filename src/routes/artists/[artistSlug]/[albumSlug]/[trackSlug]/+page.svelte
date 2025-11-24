<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="container mx-auto px-4 py-8">
	<div class="breadcrumbs mb-6 text-sm">
		<ul>
			<li><a href="/artists" class="link link-primary">Artists</a></li>
			<li><a href={data.track.artistPath} class="link link-primary">{data.track.artistName}</a></li>
			<li><a href={data.track.albumPath} class="link link-primary">{data.track.albumName}</a></li>
			<li class="text-base-content">{data.track.trackName}</li>
		</ul>
	</div>

	<div class="card card-border bg-base-100">
		<div class="card-body">
			<h1 class="card-title text-4xl text-base-content mb-2">{data.track.trackName}</h1>
			<p class="text-xl text-base-content/70 mb-6">
				by {data.track.artistName} • {data.track.albumName}
				{#if data.track.trackNumber !== null}
					<span class="text-base-content/50"> • Track {data.track.trackNumber}</span>
				{/if}
			</p>

			<div class="card-actions justify-start">
				<audio controls class="w-full">
					<source src={data.track.audioUrl} type="audio/mpeg" />
					Your browser does not support the audio element.
				</audio>
			</div>
		</div>
	</div>
</div>

