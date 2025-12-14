<script lang="ts">
	import type { PageData } from './$types';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import AlbumTrackList from '$lib/components/AlbumTrackList.svelte';

	let { data }: { data: PageData } = $props();

	const breadcrumbItems = [
		{ name: 'Home', href: '/' as const },
		{ name: 'Artists', href: '/artists' as const },
		{ name: data.album.artistName, href: data.album.artistPath },
		{ name: data.album.albumName }
	];
</script>

<svelte:head>
	<title>{data.album.albumName} by {data.album.artistName} - Faux Fetus</title>
	<meta
		name="description"
		content="Listen to tracks from the album {data.album.albumName} by {data.album
			.artistName} on Faux Fetus."
	/>
</svelte:head>

<div class="flex flex-col gap-2">
	<Breadcrumb items={breadcrumbItems} />
	<AlbumTrackList tracks={data.album.tracks} />
</div>
