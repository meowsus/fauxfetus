<script lang="ts">
	import type { PageData } from './$types';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import TrackList from '$lib/components/TrackList.svelte';

	let { data }: { data: PageData } = $props();

	const artistHref: `/artists/${string}` = `/artists/${data.album.artistSlug}`;

	const breadcrumbItems = [
		{ name: 'Home', href: '/' as const },
		{ name: 'Artists', href: '/artists' as const },
		{ name: data.album.artistName, href: artistHref },
		{ name: data.album.name }
	];
</script>

<svelte:head>
	<title>{data.album.name} by {data.album.artistName} - Faux Fetus</title>
	<meta
		name="description"
		content="Listen to tracks from the album {data.album.name} by {data.album
			.artistName} on Faux Fetus."
	/>
</svelte:head>

<div class="flex flex-col gap-2">
	<Breadcrumb items={breadcrumbItems} />
	<TrackList tracks={data.album.tracks} shouldDisableRadioMode={true} />
</div>
