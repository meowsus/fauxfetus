<script lang="ts">
	import type { PageData } from './$types';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import ArtistAlbumList from '$lib/components/ArtistAlbumList.svelte';

	let { data }: { data: PageData } = $props();

	const breadcrumbItems = [
		{ name: 'Home', href: '/' as const },
		{ name: 'Artists', href: '/artists' as const },
		{ name: data.artist.artistName }
	];
</script>

<svelte:head>
	<title>{data.artist.artistName} - Faux Fetus</title>
	<meta name="description" content="Browse albums by {data.artist.artistName} on Faux Fetus." />
</svelte:head>

<div class="flex flex-col gap-2">
	<Breadcrumb items={breadcrumbItems} />
	<ArtistAlbumList albums={data.artist.albums} />
</div>
