<script lang="ts">
	import type { PageData } from './$types';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';

	let { data }: { data: PageData } = $props();

	// Construct track path from album path and track name
	const trackPath = `${data.track.albumPath}/${data.track.trackName.toLowerCase().replace(/\s+/g, '-')}`;
	const breadcrumbItems = [
		{ name: 'Home', href: '/' },
		{ name: 'Artists', href: '/artists' },
		{ name: data.track.artistName, href: data.track.artistPath },
		{ name: data.track.albumName, href: data.track.albumPath },
		{ name: data.track.trackName, href: trackPath }
	];
</script>

<div class="container mx-auto px-4 py-8">
	<Breadcrumb items={breadcrumbItems} />

	<div class="card card-border bg-base-100">
		<div class="card-body">
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

