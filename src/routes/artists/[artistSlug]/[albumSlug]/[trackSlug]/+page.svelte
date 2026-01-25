<script lang="ts">
	import type { PageData } from './$types';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';

	let { data }: { data: PageData } = $props();

	const artistHref: `/artists/${string}` = `/artists/${data.track.artistSlug}`;
	const albumHref: `/artists/${string}/${string}` = `${artistHref}/${data.track.albumSlug}`;

	const breadcrumbItems = [
		{ name: 'Home', href: '/' as const },
		{ name: 'Artists', href: '/artists' as const },
		{ name: data.track.artistName, href: artistHref },
		{ name: data.track.albumName, href: albumHref },
		{ name: data.track.name }
	];
</script>

<svelte:head>
	<title>{data.track.name} by {data.track.artistName} - Faux Fetus</title>
	<meta
		name="description"
		content="Listen to {data.track.name} from the album {data.track.albumName} by {data.track
			.artistName} on Faux Fetus."
	/>
</svelte:head>

<div class="flex flex-col gap-2">
	<Breadcrumb items={breadcrumbItems} />

	<audio controls class="w-full">
		<source src={`/audio/${data.track.audioUrl}`} type="audio/mpeg" />
		Your browser does not support the audio element.
	</audio>
</div>
