<script lang="ts">
	import type { PageData } from './$types';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';

	let { data }: { data: PageData } = $props();

	const breadcrumbItems = [
		{ name: 'Home', href: '/' as const },
		{ name: 'Artists', href: '/artists' as const },
		{ name: data.track.artistName, href: data.track.artistPath },
		{ name: data.track.albumName, href: data.track.albumPath },
		{ name: data.track.trackName }
	];
</script>

<svelte:head>
	<title>{data.track.trackName} by {data.track.artistName} - Faux Fetus</title>
	<meta
		name="description"
		content="Listen to {data.track.trackName} from the album {data.track.albumName} by {data.track
			.artistName} on Faux Fetus."
	/>
</svelte:head>

<div class="flex flex-col gap-2">
	<Breadcrumb items={breadcrumbItems} />

	<audio controls class="w-full">
		<source src={data.track.audioUrl} type="audio/mpeg" />
		Your browser does not support the audio element.
	</audio>
</div>
